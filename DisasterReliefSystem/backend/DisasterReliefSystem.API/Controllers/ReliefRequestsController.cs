using System.ComponentModel.DataAnnotations;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using DisasterReliefSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[ApiController, Authorize, Route("api/relief-requests")]
public class ReliefRequestsController(AppDbContext db) : AppController
{
    public record RequestBody([Required, StringLength(200)] string Title, [Required, StringLength(4000)] string Description,
        [Required, StringLength(255)] string Address, [StringLength(200)] string? Region, decimal Latitude, decimal Longitude,
        [Range(1, 3)] int EmergencyLevel, [Range(1, 1000000)] int AffectedPeople,
        bool NeedFood, bool NeedWater, bool NeedMedicine, bool NeedBlanket, bool NeedShelter,
        [Required, StringLength(30)] string ContactPhone, [Range(1, 1000000)] int? FoodQuantity,
        [Range(1, 1000000)] int? WaterQuantity, [Range(1, 1000000)] int? MedicineQuantity,
        [Range(1, 1000000)] int? BlanketQuantity, [Range(1, 1000000)] int? ShelterQuantity,
        [StringLength(1400000)] string? PhotoDataUrl = null);
    public record StatusBody([Required] string Status, [StringLength(2000)] string? Note, [Range(1, 1000)] int? TargetHeadcount);
    private bool Staff => User.IsInRole("Admin") || User.IsInRole("Coordinator");
    private IQueryable<ReliefRequest> Visible() => Staff ? db.ReliefRequests : db.ReliefRequests.Where(r => r.Requester.UserId == CurrentUserId || r.Assignments.Any(a => a.Volunteer.UserId == CurrentUserId));

    [HttpGet]
    public async Task<IActionResult> List(int pageNumber = 1, int pageSize = 50, string? status = null, string? search = null)
    {
        var rows = await Visible().OrderByDescending(r => r.CreatedAt).ToListAsync();
        IEnumerable<ReliefRequest> filtered = rows;
        if (!string.IsNullOrWhiteSpace(status)) filtered = filtered.Where(r => WorkflowSupport.Status(WorkflowSupport.RequestStatuses, r.Status).Equals(status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(search)) filtered = filtered.Where(r => r.Title.Contains(search, StringComparison.OrdinalIgnoreCase) || r.Region.Contains(search, StringComparison.OrdinalIgnoreCase));
        return Ok(Page(filtered.Select(WorkflowSupport.RequestDto), pageNumber, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Detail(int id) => Ok(WorkflowSupport.RequestDto(await Visible().SingleOrDefaultAsync(r => r.RequestId == id) ?? throw new ApiException(404, "Không tìm thấy yêu cầu.")));

    [HttpPost, Authorize(Roles = "Requester,Admin")]
    public async Task<IActionResult> Create(RequestBody b)
    {
        WorkflowSupport.Coordinates(b.Latitude, b.Longitude);
        ValidatePhoto(b.PhotoDataUrl);
        var requester = await db.Requesters.SingleOrDefaultAsync(r => r.UserId == CurrentUserId);
        if (requester == null) { requester = new Requester { UserId = CurrentUserId }; db.Requesters.Add(requester); }
        var r = new ReliefRequest
        {
            Requester = requester, Title = WorkflowSupport.Text(b.Title, "Tiêu đề", 200), Description = WorkflowSupport.Text(b.Description, "Mô tả", 4000),
            Location = WorkflowSupport.Text(b.Address, "Địa chỉ", 255), Region = string.IsNullOrWhiteSpace(b.Region) ? b.Address.Trim() : b.Region.Trim(),
            Latitude = b.Latitude, Longitude = b.Longitude, EmergencyLevel = b.EmergencyLevel, AffectedPeople = b.AffectedPeople,
            ContactPhone = WorkflowSupport.Text(b.ContactPhone, "Số điện thoại", 30), NeedFood = b.NeedFood, NeedWater = b.NeedWater,
            NeedMedicine = b.NeedMedicine, NeedBlanket = b.NeedBlanket, NeedShelter = b.NeedShelter,
            FoodQuantity = b.NeedFood ? b.FoodQuantity : null, WaterQuantity = b.NeedWater ? b.WaterQuantity : null,
            MedicineQuantity = b.NeedMedicine ? b.MedicineQuantity : null, BlanketQuantity = b.NeedBlanket ? b.BlanketQuantity : null,
            ShelterQuantity = b.NeedShelter ? b.ShelterQuantity : null, PhotoDataUrl = b.PhotoDataUrl, Status = 0, CreatedAt = DateTime.UtcNow
        };
        db.ReliefRequests.Add(r);
        foreach (var uid in await db.Users.Where(u => u.Role.RoleName == "Admin" || u.Role.RoleName == "Coordinator").Select(u => u.UserId).ToListAsync())
            WorkflowSupport.Notify(db, uid, "Yêu cầu cứu trợ mới", r.Title, "RequestCreated");
        await db.SaveChangesAsync();
        return StatusCode(201, new { id = r.RequestId.ToString(), message = "Đã gửi yêu cầu cứu trợ." });
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> SetStatus(int id, StatusBody body)
    {
        await WorkflowSupport.Gate.WaitAsync();
        await InventoryGate.Lock.WaitAsync();
        try
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            var r = await db.ReliefRequests.Include(r => r.Requester).Include(r => r.Assignments).SingleOrDefaultAsync(r => r.RequestId == id) ?? throw new ApiException(404, "Không tìm thấy yêu cầu.");
            var target = Array.IndexOf(WorkflowSupport.RequestStatuses, body.Status);
            if (target < 0) throw new ApiException(400, "Trạng thái không hợp lệ.");
            if (!Staff && (r.Requester.UserId != CurrentUserId || target != 5)) throw new ApiException(403, "Bạn chỉ được hủy yêu cầu của mình.");
            if (r.Status is 4 or 5) throw new ApiException(409, "Yêu cầu đã kết thúc.");
            if (target == 5)
            {
                var assignmentIds = r.Assignments.Select(a => a.AssignmentId).ToArray();
                var wasDispatched = await db.AuditLogs.AnyAsync(log =>
                    (log.Entity == "ReliefRequest" && log.EntityId == id && log.Action == "InProgress") ||
                    (log.Entity == "Assignment" && assignmentIds.Contains(log.EntityId) && log.Action == "OnTheWay"));
                if (r.Status == 3 || r.Assignments.Any(a => a.Status is 2 or 3) || wasDispatched) throw new ApiException(409, "Đội cứu trợ đã bắt đầu vận chuyển hoặc giao hàng; không thể tự động hủy và hoàn kho. Cần đối soát vật tư thực tế.");
                foreach (var a in r.Assignments.Where(WorkflowSupport.Active)) { a.Status = 4; a.CancelledAt = DateTime.UtcNow; a.IsTeamLead = false; a.CancellationRequested = false; }
                foreach (var allocation in await db.RequestAllocations.Where(a => a.RequestId == id && !a.Returned).ToListAsync())
                {
                    var stock = await db.Inventories.SingleAsync(i => i.InventoryId == allocation.InventoryId);
                    stock.Quantity = checked(stock.Quantity + allocation.Quantity); stock.UpdatedAt = DateTime.UtcNow; allocation.Returned = true;
                    db.InventoryTransactions.Add(new InventoryTransaction { InventoryId = stock.InventoryId, Type = 0, Quantity = allocation.Quantity, ReferenceId = id, ReferenceNo = $"REQ-{id}-RETURN", Note = "Hoàn vật tư do hủy yêu cầu trước vận chuyển", CreatedByUserId = CurrentUserId, CreatedAt = DateTime.UtcNow });
                }
            }
            else if (r.Status == 0 && target == 1)
            {
                if (body.TargetHeadcount is null) throw new ApiException(400, "Nhập số tình nguyện viên mục tiêu khi duyệt.");
                r.TargetHeadcount = body.TargetHeadcount;
            }
            else if (!(r.Status == 2 && target == 3) && !(r.Status == 3 && target == 4))
                throw new ApiException(409, "Chuyển trạng thái không hợp lệ. Phân công được cập nhật từ nhiệm vụ tình nguyện viên.");

            var issues = new List<object>();
            if (r.Status == 0 && target == 1)
            {
                issues = await Allocate(r);
                r.InventoryIssuesJson = System.Text.Json.JsonSerializer.Serialize(issues);
            }
            if (target == 4)
            {
                foreach (var a in r.Assignments.Where(WorkflowSupport.Active)) { a.Status = 3; a.CompletedAt = DateTime.UtcNow; a.CancellationRequested = false; }
            }
            r.Status = (byte)target; r.UpdatedAt = DateTime.UtcNow; r.ReviewNote = body.Note?.Trim();
            WorkflowSupport.Notify(db, r.Requester.UserId, "Yêu cầu được cập nhật", $"{r.Title}: {body.Status}", $"Request{body.Status}");
            WorkflowSupport.Audit(db, CurrentUserId, body.Status, "ReliefRequest", id);
            await db.SaveChangesAsync(); await tx.CommitAsync();
            return Ok(new { id = id.ToString(), status = body.Status, message = "Đã cập nhật yêu cầu.", inventoryIssues = issues });
        }
        finally { InventoryGate.Lock.Release(); WorkflowSupport.Gate.Release(); }
    }

    private async Task<List<object>> Allocate(ReliefRequest r)
    {
        var result = new List<object>();
        var needs = new[] { ("Food", r.NeedFood, r.FoodQuantity), ("Water", r.NeedWater, r.WaterQuantity), ("Medicine", r.NeedMedicine, r.MedicineQuantity), ("Blanket", r.NeedBlanket, r.BlanketQuantity), ("Shelter", r.NeedShelter, r.ShelterQuantity) };
        foreach (var (category, needed, amount) in needs.Where(n => n.Item2))
        {
            var requested = amount ?? r.AffectedPeople;
            var remaining = requested;
            var stocks = await db.Inventories.Include(i => i.Supply).Where(i => i.Quantity > 0 && i.Warehouse.IsActive && i.Supply.Category == category).OrderBy(i => i.InventoryId).ToListAsync();
            // Category quantities cannot safely add kilograms, boxes and individual units.
            // Require a staff stock-out operation when the catalog mixes measurement units.
            if (stocks.Select(s => s.Supply.Unit?.Trim().ToLowerInvariant()).Distinct().Count() > 1)
            {
                result.Add(new { category, requestedQuantity = requested, issuedQuantity = 0, isFullyIssued = false,
                    requiresManualAllocation = true, reason = "Nhóm vật tư có nhiều đơn vị tính; cần chọn vật tư và xuất kho thủ công." });
                continue;
            }
            foreach (var stock in stocks)
            {
                var issued = Math.Min(remaining, stock.Quantity); if (issued == 0) break;
                stock.Quantity -= issued; stock.UpdatedAt = DateTime.UtcNow; remaining -= issued;
                db.RequestAllocations.Add(new RequestAllocation { RequestId = r.RequestId, InventoryId = stock.InventoryId, Quantity = issued });
                db.InventoryTransactions.Add(new InventoryTransaction { InventoryId = stock.InventoryId, Type = 1, Quantity = issued, ReferenceId = r.RequestId, ReferenceNo = $"REQ-{r.RequestId}", Note = "Cấp vật tư khi duyệt yêu cầu", CreatedByUserId = CurrentUserId, CreatedAt = DateTime.UtcNow });
            }
            result.Add(new { category, requestedQuantity = requested, issuedQuantity = requested - remaining, isFullyIssued = remaining == 0 });
        }
        return result;
    }

    [HttpGet("open-tasks"), Authorize(Roles = "Volunteer,Admin")]
    public async Task<IActionResult> OpenTasks(int pageNumber = 1, int pageSize = 50)
    {
        var rows = await db.ReliefRequests.Include(r => r.Assignments).Where(r => r.Status == 1 || r.Status == 2).OrderByDescending(r => r.EmergencyLevel).ThenBy(r => r.CreatedAt).ToListAsync();
        return Ok(Page(rows.Where(r => r.TargetHeadcount > r.Assignments.Count(WorkflowSupport.Active)).Select(r => new
        { id = r.RequestId.ToString(), r.Title, address = r.Location, r.Description, r.Region, r.Latitude, r.Longitude,
            r.EmergencyLevel, r.TargetHeadcount, activeAssignmentCount = r.Assignments.Count(WorkflowSupport.Active), r.CreatedAt }), pageNumber, pageSize));
    }

    [HttpPost("{id:int}/join"), Authorize(Roles = "Volunteer")]
    public async Task<IActionResult> Join(int id)
    {
        await WorkflowSupport.Gate.WaitAsync();
        try
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            var v = await db.Volunteers.SingleOrDefaultAsync(v => v.UserId == CurrentUserId && v.ApprovalStatus == 1) ?? throw new ApiException(403, "Hồ sơ tình nguyện viên chưa được duyệt.");
            var r = await db.ReliefRequests.Include(r => r.Assignments).Include(r => r.Requester).SingleOrDefaultAsync(r => r.RequestId == id) ?? throw new ApiException(404, "Không tìm thấy yêu cầu.");
            if (r.Status is not (1 or 2) || r.TargetHeadcount == null || r.Assignments.Count(WorkflowSupport.Active) >= r.TargetHeadcount) throw new ApiException(409, "Yêu cầu không còn chỗ trống.");
            if (await db.Assignments.AnyAsync(a => a.VolunteerId == v.VolunteerId && a.Status < 3)) throw new ApiException(409, "Bạn đang có nhiệm vụ chưa hoàn thành.");
            var a = new Assignment { RequestId = id, VolunteerId = v.VolunteerId, UserId = CurrentUserId, Status = 1, AssignedAt = DateTime.UtcNow, AcceptedAt = DateTime.UtcNow };
            db.Assignments.Add(a); r.Status = 2;
            WorkflowSupport.Notify(db, r.Requester.UserId, "Đã có tình nguyện viên nhận hỗ trợ", r.Title, "AssignmentAccepted");
            await db.SaveChangesAsync(); await tx.CommitAsync();
            return Ok(new { id = a.AssignmentId.ToString(), a.IsTeamLead, message = "Đã nhận nhiệm vụ." });
        }
        finally { WorkflowSupport.Gate.Release(); }
    }

    [HttpDelete("{id:int}/team-lead"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> RemoveLead(int id)
    {
        if (!await db.ReliefRequests.AnyAsync(r => r.RequestId == id)) throw new ApiException(404, "Không tìm thấy yêu cầu.");
        foreach (var a in await db.Assignments.Where(a => a.RequestId == id && a.IsTeamLead).ToListAsync()) a.IsTeamLead = false;
        await db.SaveChangesAsync(); return Ok(new { id = id.ToString(), message = "Đã gỡ nhóm trưởng." });
    }

    [HttpGet("{id:int}/suggested-volunteers"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Suggested(int id, double maxDistanceKm = 50, int top = 20)
    {
        if (!double.IsFinite(maxDistanceKm) || maxDistanceKm <= 0) throw new ApiException(400, "Khoảng cách phải lớn hơn 0.");
        var r = await db.ReliefRequests.FindAsync(id) ?? throw new ApiException(404, "Không tìm thấy yêu cầu.");
        var volunteers = await db.Volunteers.Include(v => v.User).Include(v => v.Assignments).Include(v => v.VolunteerSkills).ThenInclude(s => s.Skill).Where(v => v.ApprovalStatus == 1 && !v.Assignments.Any(a => a.Status < 3)).ToListAsync();
        var candidates = volunteers.Select(v => new
        {
            volunteerProfileId = v.VolunteerId.ToString(), v.User.FullName, distanceKm = Math.Round(Distance((double)r.Latitude, (double)r.Longitude, (double)v.Latitude, (double)v.Longitude), 2),
            v.ExperienceYears, matchedSkillsCount = 0, matchedSkillNames = Array.Empty<string>(), completedAssignmentsCount = v.Assignments.Count(a => a.Status == 3)
        }).Where(v => v.distanceKm <= maxDistanceKm).OrderBy(v => v.distanceKm).ThenByDescending(v => v.ExperienceYears).ToList();
        return Ok(new { candidates = candidates.Take(Math.Clamp(top, 1, 200)), totalEligibleCount = candidates.Count });
    }
    private static double Distance(double lat1, double lon1, double lat2, double lon2)
    {
        var r = Math.PI / 180; var dlat = (lat2 - lat1) * r; var dlon = (lon2 - lon1) * r;
        var a = Math.Pow(Math.Sin(dlat / 2), 2) + Math.Cos(lat1 * r) * Math.Cos(lat2 * r) * Math.Pow(Math.Sin(dlon / 2), 2);
        return 6371 * 2 * Math.Asin(Math.Sqrt(Math.Clamp(a, 0, 1)));
    }
    private static void ValidatePhoto(string? dataUrl)
    {
        if (string.IsNullOrWhiteSpace(dataUrl)) return;
        var jpeg = dataUrl.StartsWith("data:image/jpeg;base64,", StringComparison.Ordinal);
        var png = dataUrl.StartsWith("data:image/png;base64,", StringComparison.Ordinal);
        if (!jpeg && !png) throw new ApiException(400, "Ảnh phải là JPEG hoặc PNG.");
        try
        {
            var bytes = Convert.FromBase64String(dataUrl[(dataUrl.IndexOf(',') + 1)..]);
            if (bytes.Length is < 8 or > 1048576) throw new ApiException(400, "Ảnh phải nhỏ hơn hoặc bằng 1 MiB.");
            if (jpeg && !(bytes[0] == 0xff && bytes[1] == 0xd8 && bytes[2] == 0xff)) throw new ApiException(400, "Dữ liệu ảnh JPEG không hợp lệ.");
            if (png && !bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) throw new ApiException(400, "Dữ liệu ảnh PNG không hợp lệ.");
        }
        catch (FormatException) { throw new ApiException(400, "Dữ liệu ảnh không hợp lệ."); }
    }
}
