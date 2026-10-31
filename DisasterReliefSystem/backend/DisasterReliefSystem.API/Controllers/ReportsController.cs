using System.Globalization;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[ApiController, Authorize(Roles = "Admin,Coordinator"), Route("api/reports")]
public class ReportsController(AppDbContext db) : AppController
{
    private const string Mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    [HttpGet("relief-requests/excel")]
    public async Task<IActionResult> Requests(string? status = null, string? search = null)
    {
        var all = await db.ReliefRequests.OrderByDescending(r => r.CreatedAt).ToListAsync();
        var filtered = all.Where(r => (string.IsNullOrWhiteSpace(status) || WorkflowSupport.Status(WorkflowSupport.RequestStatuses, r.Status).Equals(status, StringComparison.OrdinalIgnoreCase)) && (string.IsNullOrWhiteSpace(search) || r.Title.Contains(search, StringComparison.OrdinalIgnoreCase) || r.Region.Contains(search, StringComparison.OrdinalIgnoreCase)));
        var rows = new List<string[]> { new[] { "ID", "Tiêu đề", "Khu vực", "Địa chỉ", "Khẩn cấp", "Số người", "Trạng thái", "Ngày tạo UTC" } };
        rows.AddRange(filtered.Select(r => new[] { r.RequestId.ToString(), r.Title, r.Region, r.Location ?? "", r.EmergencyLevel.ToString(), r.AffectedPeople.ToString(), WorkflowSupport.Status(WorkflowSupport.RequestStatuses, r.Status), r.CreatedAt.ToString("O", CultureInfo.InvariantCulture) }));
        return File(ExcelExport.Create(rows), Mime, "relief-requests.xlsx");
    }
    [HttpGet("assignments/excel")]
    public async Task<IActionResult> Assignments(string? status = null, int? volunteerId = null)
    {
        var q = db.Assignments.Include(a => a.ReliefRequest).Include(a => a.Volunteer).ThenInclude(v => v.User).AsQueryable();
        if (volunteerId != null) q = q.Where(a => a.VolunteerId == volunteerId);
        var all = await q.OrderByDescending(a => a.AssignedAt).ToListAsync();
        var rows = new List<string[]> { new[] { "ID", "Yêu cầu", "Tình nguyện viên", "Trạng thái", "Nhóm trưởng", "Ngày phân công UTC", "Ngày hoàn thành UTC" } };
        rows.AddRange(all.Where(a => string.IsNullOrWhiteSpace(status) || WorkflowSupport.Status(WorkflowSupport.AssignmentStatuses, a.Status).Equals(status, StringComparison.OrdinalIgnoreCase)).Select(a => new[] { a.AssignmentId.ToString(), a.ReliefRequest.Title, a.Volunteer.User.FullName, WorkflowSupport.Status(WorkflowSupport.AssignmentStatuses, a.Status), a.IsTeamLead ? "Có" : "Không", a.AssignedAt.ToString("O"), a.CompletedAt?.ToString("O") ?? "" }));
        return File(ExcelExport.Create(rows), Mime, "assignments.xlsx");
    }
    [HttpGet("inventory/excel")]
    public async Task<IActionResult> Inventory(int? warehouseId = null, string? search = null)
    {
        var q = db.Inventories.Include(i => i.Warehouse).Include(i => i.Supply).AsQueryable();
        if (warehouseId != null) q = q.Where(i => i.WarehouseId == warehouseId);
        var all = await q.OrderBy(i => i.Warehouse.WarehouseName).ThenBy(i => i.Supply.SupplyName).ToListAsync();
        var rows = new List<string[]> { new[] { "ID", "Kho", "Vật tư", "Đơn vị", "Nhóm", "Tồn kho", "Mức tối thiểu", "Cập nhật UTC" } };
        rows.AddRange(all.Where(i => string.IsNullOrWhiteSpace(search) || i.Supply.SupplyName.Contains(search, StringComparison.OrdinalIgnoreCase)).Select(i => new[] { i.InventoryId.ToString(), i.Warehouse.WarehouseName, i.Supply.SupplyName, i.Supply.Unit ?? "", i.Supply.Category ?? "", i.Quantity.ToString(), i.MinimumQuantity.ToString(), i.UpdatedAt.ToString("O") }));
        return File(ExcelExport.Create(rows), Mime, "inventory.xlsx");
    }
}
