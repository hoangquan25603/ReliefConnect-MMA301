using System.ComponentModel.DataAnnotations;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using DisasterReliefSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[ApiController, AllowAnonymous, Route("api/public")]
public class PublicController(AppDbContext db) : AppController
{
    public record ContactBody([Required, StringLength(200)] string FullName, [Required, EmailAddress, StringLength(254)] string Email,
        [StringLength(30)] string? PhoneNumber, [Required, StringLength(4000)] string Content);
    [HttpGet("highlights")]
    public async Task<IActionResult> Highlights()
    {
        var requests = await db.ReliefRequests.Where(r => r.Status > 0 && r.Status < 4).OrderByDescending(r => r.EmergencyLevel).ThenByDescending(r => r.CreatedAt).ToListAsync();
        var warehouses = await db.Warehouses.Where(w => w.IsActive).ToListAsync();
        var mapPoints = requests.Select(r => new { type = "Request", latitude = Math.Round((double)r.Latitude, 1), longitude = Math.Round((double)r.Longitude, 1), status = (string?)WorkflowSupport.Status(WorkflowSupport.RequestStatuses, r.Status), emergencyLevel = (int?)r.EmergencyLevel })
            .Concat(warehouses.Select(w => new { type = "Warehouse", latitude = Math.Round(w.Latitude, 1), longitude = Math.Round(w.Longitude, 1), status = (string?)null, emergencyLevel = (int?)null }));
        return Ok(new
        {
            urgentRequests = requests.Take(6).Select(r => new { r.Region, r.EmergencyLevel, needLabels = Needs(r), relativeTime = $"{Math.Max(0, (int)(DateTime.UtcNow - r.CreatedAt).TotalHours)} giờ trước" }),
            mapPoints, stats = new { approvedVolunteerCount = await db.Volunteers.CountAsync(v => v.ApprovalStatus == 1), completedRequestCount = await db.ReliefRequests.CountAsync(r => r.Status == 4),
                provincesCoveredCount = await db.ReliefRequests.Where(r => r.Status > 0 && r.Status < 5).Select(r => r.Region).Distinct().CountAsync(), completedAssignmentCount = await db.Assignments.CountAsync(a => a.Status == 3) }
        });
    }
    [HttpPost("contact"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Contact(ContactBody body)
    {
        var message = new ContactMessage { FullName = WorkflowSupport.Text(body.FullName, "Họ tên", 200), Email = body.Email.Trim().ToLowerInvariant(), PhoneNumber = body.PhoneNumber?.Trim() ?? "", Content = WorkflowSupport.Text(body.Content, "Nội dung", 4000) };
        db.ContactMessages.Add(message);
        foreach (var uid in await db.Users.Where(u => u.Role.RoleName == "Admin").Select(u => u.UserId).ToListAsync())
            WorkflowSupport.Notify(db, uid, "Liên hệ mới", $"{message.FullName} ({message.Email}): {message.Content}", "ContactReceived");
        await db.SaveChangesAsync(); return StatusCode(201, new { id = message.Id.ToString(), message = "Đã lưu tin nhắn gửi quản trị viên." });
    }
    private static string[] Needs(ReliefRequest r) => new[] { (r.NeedFood, "Lương thực"), (r.NeedWater, "Nước sạch"), (r.NeedMedicine, "Thuốc men"), (r.NeedBlanket, "Chăn màn"), (r.NeedShelter, "Nơi trú ẩn") }.Where(n => n.Item1).Select(n => n.Item2).ToArray();
}
