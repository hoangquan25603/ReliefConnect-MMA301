using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[ApiController, Authorize(Roles = "Admin,Coordinator"), Route("api/dashboard")]
public class DashboardController(AppDbContext db) : AppController
{
    [HttpGet("summary")]
    public async Task<IActionResult> Summary() => Ok(new
    {
        totalUsers = await db.Users.CountAsync(), totalReliefRequests = await db.ReliefRequests.CountAsync(),
        totalVolunteers = await db.Volunteers.CountAsync(v => v.ApprovalStatus == 1), totalWarehouses = await db.Warehouses.CountAsync(w => w.IsActive),
        pendingRequests = await db.ReliefRequests.CountAsync(r => r.Status == 0), completedRequests = await db.ReliefRequests.CountAsync(r => r.Status == 4),
        lowStockItems = await db.Inventories.CountAsync(i => i.Quantity <= i.MinimumQuantity), pendingDonations = await db.Donations.CountAsync(d => d.Status == "Pending")
    });
    [HttpGet("requests-over-time")]
    public async Task<IActionResult> OverTime(int days = 30)
    {
        days = Math.Clamp(days, 1, 366); var start = DateTime.UtcNow.Date.AddDays(1 - days);
        var dates = await db.ReliefRequests.Where(r => r.CreatedAt >= start).Select(r => r.CreatedAt).ToListAsync();
        return Ok(Enumerable.Range(0, days).Select(i => new { date = start.AddDays(i).ToString("yyyy-MM-dd"), count = dates.Count(d => d.Date == start.AddDays(i)) }));
    }
    [HttpGet("map")]
    public async Task<IActionResult> Map()
    {
        var requests = await db.ReliefRequests.Where(r => r.Status < 4).ToListAsync();
        return Ok(new
        {
            requests = requests.Select(r => new { id = r.RequestId.ToString(), r.Title, r.Latitude, r.Longitude, status = WorkflowSupport.Status(WorkflowSupport.RequestStatuses, r.Status), r.EmergencyLevel }),
            warehouses = await db.Warehouses.Where(w => w.IsActive).Select(w => new { id = w.WarehouseId.ToString(), name = w.WarehouseName, w.Latitude, w.Longitude }).ToListAsync()
        });
    }
    [HttpGet("/api/admin/audit-logs"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> AuditLogs(int pageNumber = 1, int pageSize = 20) => Ok(Page(await db.AuditLogs.Include(a => a.User).OrderByDescending(a => a.CreatedAt).Select(a => new
    { id = a.AuditId.ToString(), a.Action, entityName = a.Entity, entityId = a.EntityId.ToString(), userId = a.UserId.ToString(), userEmail = a.User.Email, timestamp = a.CreatedAt, details = "" }).ToListAsync(), pageNumber, pageSize));
}
