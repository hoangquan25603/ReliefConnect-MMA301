using System.ComponentModel.DataAnnotations;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using DisasterReliefSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[ApiController, Authorize, Route("api/assignments")]
public class AssignmentsController(AppDbContext db) : AppController
{
    public record CreateBody([Required] string ReliefRequestId, [Required] string VolunteerProfileId, [StringLength(2000)] string? Note);
    public record StatusBody([Required] string Status);
    public record ReasonBody([Required, StringLength(2000)] string Reason);
    private bool Staff => User.IsInRole("Admin") || User.IsInRole("Coordinator");
    private IQueryable<Assignment> Query() => db.Assignments.Include(a => a.ReliefRequest).ThenInclude(r => r.Requester).Include(a => a.Volunteer).ThenInclude(v => v.User);

    [HttpGet]
    public async Task<IActionResult> List(int pageNumber = 1, int pageSize = 100, int? reliefRequestId = null, string? status = null)
    {
        var query = Query();
        if (!Staff) query = query.Where(a => a.Volunteer.UserId == CurrentUserId);
        if (reliefRequestId != null) query = query.Where(a => a.RequestId == reliefRequestId);
        IEnumerable<Assignment> rows = await query.OrderByDescending(a => a.AssignedAt).ToListAsync();
        if (!string.IsNullOrWhiteSpace(status)) rows = rows.Where(a => status.ToLowerInvariant() switch
        {
            "ongoing" => a.Status == 2, "upcoming" => a.Status is 0 or 1, "completed" => a.Status == 3,
            _ => WorkflowSupport.Status(WorkflowSupport.AssignmentStatuses, a.Status).Equals(status, StringComparison.OrdinalIgnoreCase)
        });
        return Ok(Page(rows.Select(WorkflowSupport.AssignmentDto), pageNumber, pageSize));
    }

    [HttpGet("pending-cancellations"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Pending() => Ok((await Query().Where(a => a.CancellationRequested && a.Status < 3).OrderBy(a => a.CancellationRequestedAt).ToListAsync()).Select(WorkflowSupport.AssignmentDto));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Detail(int id)
    {
        var a = await Query().SingleOrDefaultAsync(a => a.AssignmentId == id) ?? throw new ApiException(404, "Không tìm thấy phân công.");
        if (!Staff && a.Volunteer.UserId != CurrentUserId) throw new ApiException(404, "Không tìm thấy phân công.");
        return Ok(WorkflowSupport.AssignmentDto(a));
    }

    [HttpPost, Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Create(CreateBody b)
    {
        var requestId = WorkflowSupport.Id(b.ReliefRequestId); var volunteerId = WorkflowSupport.Id(b.VolunteerProfileId);
        await WorkflowSupport.Gate.WaitAsync();
        try
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            var r = await db.ReliefRequests.Include(r => r.Assignments).SingleOrDefaultAsync(r => r.RequestId == requestId) ?? throw new ApiException(404, "Không tìm thấy yêu cầu.");
            var v = await db.Volunteers.SingleOrDefaultAsync(v => v.VolunteerId == volunteerId && v.ApprovalStatus == 1) ?? throw new ApiException(400, "Tình nguyện viên chưa được duyệt.");
            if (r.Status is not (1 or 2) || r.TargetHeadcount == null || r.Assignments.Count(WorkflowSupport.Active) >= r.TargetHeadcount) throw new ApiException(409, "Yêu cầu chưa duyệt hoặc đã đủ nhân sự.");
            if (await db.Assignments.AnyAsync(a => a.VolunteerId == volunteerId && a.Status < 3)) throw new ApiException(409, "Tình nguyện viên đang có nhiệm vụ.");
            var a = new Assignment { RequestId = requestId, VolunteerId = volunteerId, UserId = CurrentUserId, Note = b.Note?.Trim(), AssignedAt = DateTime.UtcNow };
            db.Assignments.Add(a); r.Status = 2;
            WorkflowSupport.Notify(db, v.UserId, "Nhiệm vụ mới", r.Title, "AssignmentCreated");
            await db.SaveChangesAsync(); await tx.CommitAsync();
            return StatusCode(201, new { id = a.AssignmentId.ToString(), message = "Đã phân công nhiệm vụ." });
        }
        finally { WorkflowSupport.Gate.Release(); }
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> Status(int id, StatusBody b)
    {
        await WorkflowSupport.Gate.WaitAsync();
        try
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            var a = await Owned(id);
            var target = Array.IndexOf(WorkflowSupport.AssignmentStatuses, b.Status);
            if (target != a.Status + 1 || target is < 1 or > 3) throw new ApiException(409, "Tiến độ phải theo thứ tự Nhận nhiệm vụ → Đang đi → Hoàn thành.");
            if (a.ReliefRequest.Status is 4 or 5) throw new ApiException(409, "Yêu cầu đã kết thúc.");
            a.Status = (byte)target;
            if (target == 1) a.AcceptedAt = DateTime.UtcNow;
            if (target == 2) a.ReliefRequest.Status = 3;
            if (target == 3) { a.CompletedAt = DateTime.UtcNow; a.CancellationRequested = false; }
            await SyncRequest(a);
            WorkflowSupport.Notify(db, a.ReliefRequest.Requester.UserId, "Tiến độ cứu trợ", $"{a.ReliefRequest.Title}: {b.Status}", $"Assignment{b.Status}");
            WorkflowSupport.Audit(db, CurrentUserId, b.Status, "Assignment", id);
            await db.SaveChangesAsync(); await tx.CommitAsync();
            return Ok(new { id = id.ToString(), message = "Đã cập nhật tiến độ." });
        }
        finally { WorkflowSupport.Gate.Release(); }
    }

    [HttpPost("{id:int}/request-cancellation")]
    public async Task<IActionResult> RequestCancellation(int id, ReasonBody b)
    {
        var a = await Owned(id);
        if (a.Status >= 3 || a.CancellationRequested) throw new ApiException(409, "Không thể gửi yêu cầu hủy ở trạng thái hiện tại.");
        a.CancellationReason = WorkflowSupport.Text(b.Reason, "Lý do", 2000); a.CancellationRequested = true; a.CancellationRequestedAt = DateTime.UtcNow;
        foreach (var uid in await db.Users.Where(u => u.Role.RoleName == "Admin" || u.Role.RoleName == "Coordinator").Select(u => u.UserId).ToListAsync())
            WorkflowSupport.Notify(db, uid, "Đề nghị hủy nhiệm vụ", a.ReliefRequest.Title, "CancellationRequested");
        await db.SaveChangesAsync(); return Ok(new { id = id.ToString(), message = "Đã gửi đề nghị hủy." });
    }

    [HttpPut("{id:int}/approve-cancellation"), Authorize(Roles = "Admin,Coordinator")]
    public Task<IActionResult> ApproveCancellation(int id) => Cancel(id, null, true);

    [HttpPut("{id:int}/cancel"), Authorize(Roles = "Admin,Coordinator")]
    public Task<IActionResult> CancelDirect(int id, ReasonBody b) => Cancel(id, WorkflowSupport.Text(b.Reason, "Lý do", 2000), false);

    private async Task<IActionResult> Cancel(int id, string? reason, bool requestedOnly)
    {
        await WorkflowSupport.Gate.WaitAsync();
        try
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            var a = await Query().SingleOrDefaultAsync(a => a.AssignmentId == id) ?? throw new ApiException(404, "Không tìm thấy phân công.");
            if (a.Status >= 3 || (requestedOnly && !a.CancellationRequested)) throw new ApiException(409, "Không có đề nghị hủy hợp lệ hoặc nhiệm vụ đã kết thúc.");
            a.Status = 4; a.CancelledAt = DateTime.UtcNow; a.CancellationRequested = false; a.IsTeamLead = false;
            if (reason != null) a.CancellationReason = reason;
            await SyncRequest(a);
            WorkflowSupport.Notify(db, a.Volunteer.UserId, "Đã hủy phân công", a.CancellationReason ?? "Phân công được hủy", "AssignmentCancelled");
            WorkflowSupport.Audit(db, CurrentUserId, "Cancel", "Assignment", id);
            await db.SaveChangesAsync(); await tx.CommitAsync();
            return Ok(new { id = id.ToString(), message = "Đã hủy phân công." });
        }
        finally { WorkflowSupport.Gate.Release(); }
    }

    [HttpPut("{id:int}/reject-cancellation"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> RejectCancellation(int id)
    {
        var a = await Query().SingleOrDefaultAsync(a => a.AssignmentId == id) ?? throw new ApiException(404, "Không tìm thấy phân công.");
        if (!a.CancellationRequested || a.Status >= 3) throw new ApiException(409, "Không có đề nghị hủy đang chờ.");
        a.CancellationRequested = false;
        WorkflowSupport.Notify(db, a.Volunteer.UserId, "Đề nghị hủy không được duyệt", a.ReliefRequest.Title, "CancellationRejected");
        await db.SaveChangesAsync(); return Ok(new { id = id.ToString(), message = "Đã từ chối đề nghị hủy." });
    }

    [HttpPut("{id:int}/set-team-lead"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> SetLead(int id)
    {
        await WorkflowSupport.Gate.WaitAsync();
        try
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            var a = await Query().SingleOrDefaultAsync(a => a.AssignmentId == id) ?? throw new ApiException(404, "Không tìm thấy phân công.");
            if (a.Status is not (1 or 2)) throw new ApiException(409, "Chỉ định nhóm trưởng sau khi đã nhận nhiệm vụ.");
            foreach (var other in await db.Assignments.Where(other => other.RequestId == a.RequestId && other.IsTeamLead).ToListAsync()) other.IsTeamLead = false;
            a.IsTeamLead = true; await db.SaveChangesAsync(); await tx.CommitAsync();
            return Ok(new { id = id.ToString(), message = "Đã chỉ định nhóm trưởng." });
        }
        finally { WorkflowSupport.Gate.Release(); }
    }

    private async Task<Assignment> Owned(int id)
    {
        var a = await Query().SingleOrDefaultAsync(a => a.AssignmentId == id) ?? throw new ApiException(404, "Không tìm thấy phân công.");
        if (!Staff && a.Volunteer.UserId != CurrentUserId) throw new ApiException(403, "Bạn không có quyền thay đổi nhiệm vụ này.");
        return a;
    }
    private async Task SyncRequest(Assignment changed)
    {
        var all = await db.Assignments.Where(a => a.RequestId == changed.RequestId).ToListAsync();
        // Tracking identity resolution includes the new state of the current assignment.
        if (changed.ReliefRequest.Status is 4 or 5) return;
        if (all.Any(a => a.Status == 2)) changed.ReliefRequest.Status = 3;
        else if (all.Any(a => a.Status < 3)) changed.ReliefRequest.Status = 2;
        else if (all.Any(a => a.Status == 3)) changed.ReliefRequest.Status = 4;
        else changed.ReliefRequest.Status = 1;
        changed.ReliefRequest.UpdatedAt = DateTime.UtcNow;
    }
}
