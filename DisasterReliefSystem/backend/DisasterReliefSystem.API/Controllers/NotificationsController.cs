using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[ApiController, Authorize, Route("api/notifications")]
public class NotificationsController(AppDbContext db) : AppController
{
    [HttpGet]
    public async Task<IActionResult> List(int pageNumber = 1, int pageSize = 50) => Ok(Page(await db.Notifications.Where(n => n.UserId == CurrentUserId).OrderByDescending(n => n.CreatedAt)
        .Select(n => new { id = n.NotificationId.ToString(), n.Title, n.Content, n.Type, n.IsRead, n.ReadAt, n.CreatedAt }).ToListAsync(), pageNumber, pageSize));
    [HttpGet("unread-count")]
    public async Task<IActionResult> Unread() => Ok(new { count = await db.Notifications.CountAsync(n => n.UserId == CurrentUserId && !n.IsRead) });
    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> Read(int id)
    {
        var n = await db.Notifications.SingleOrDefaultAsync(n => n.NotificationId == id && n.UserId == CurrentUserId) ?? throw new ApiException(404, "Không tìm thấy thông báo.");
        n.IsRead = true; n.ReadAt ??= DateTime.UtcNow; await db.SaveChangesAsync(); return Ok(new { message = "Đã đọc thông báo." });
    }
    [HttpPut("read-all")]
    public async Task<IActionResult> ReadAll()
    {
        foreach (var n in await db.Notifications.Where(n => n.UserId == CurrentUserId && !n.IsRead).ToListAsync()) { n.IsRead = true; n.ReadAt = DateTime.UtcNow; }
        await db.SaveChangesAsync(); return Ok(new { message = "Đã đọc tất cả thông báo." });
    }
}
