using System.ComponentModel.DataAnnotations;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using DisasterReliefSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[Authorize(Roles = "Admin"), Route("api/admin/users")]
public sealed class UsersController(AppDbContext db) : AppController
{
    public record CreateBody([Required, MaxLength(100)] string FullName, [Required, EmailAddress, MaxLength(100)] string Email,
        [Required] string Password, [Required] string RoleName, [MaxLength(20)] string? PhoneNumber);
    public record UpdateBody([Required, MaxLength(100)] string FullName, [MaxLength(20)] string? PhoneNumber);
    public record RoleBody([Required] string RoleName);
    public record PasswordBody([Required] string NewPassword);
    [HttpGet]
    public async Task<IActionResult> List(int pageNumber = 1, int pageSize = 20, string? role = null)
    {
        var users = db.Users.Include(u => u.Role).AsNoTracking();
        if (!string.IsNullOrWhiteSpace(role)) users = users.Where(u => u.Role.RoleName == role);
        return Ok(Page((await users.OrderBy(u => u.UserId).ToListAsync()).Select(Security.UserDto), pageNumber, pageSize));
    }
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) => Ok(Security.UserDto(await Find(id)));
    [HttpPost]
    public async Task<IActionResult> Create(CreateBody b)
    {
        Security.ValidatePassword(b.Password);
        if (string.IsNullOrWhiteSpace(b.FullName)) throw new ApiException(400, "Họ tên không được để trống.");
        var email = b.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email)) throw new ApiException(409, "Email đã được sử dụng.");
        var role = await db.Roles.SingleOrDefaultAsync(r => r.RoleName == b.RoleName) ?? throw new ApiException(400, "Vai trò không hợp lệ.");
        var u = new User { Role = role, FullName = b.FullName.Trim(), Email = email, Phone = b.PhoneNumber, Status = 1, CreatedAt = DateTime.UtcNow };
        u.PasswordHash = Security.HashPassword(u, b.Password); u.Requester = new Requester { User = u };
        if (role.RoleName == "Volunteer") u.Volunteer = new Volunteer { User = u, ApprovalStatus = 1, AvailabilityStatus = 1, ApprovedAt = DateTime.UtcNow, ApprovedBy = CurrentUserId };
        db.Users.Add(u); await db.SaveChangesAsync(); return Ok(Security.UserDto(u));
    }
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateBody b)
    {
        if (string.IsNullOrWhiteSpace(b.FullName)) throw new ApiException(400, "Họ tên không được để trống.");
        var u = await Find(id); u.FullName = b.FullName.Trim(); u.Phone = b.PhoneNumber; u.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(); return Ok(Security.UserDto(u));
    }
    [HttpPut("{id:int}/activate")]
    public Task<IActionResult> Activate(int id) => SetStatus(id, true);
    [HttpPut("{id:int}/deactivate")]
    public Task<IActionResult> Deactivate(int id) => SetStatus(id, false);
    private async Task<IActionResult> SetStatus(int id, bool active)
    {
        await AuthGate.Lock.WaitAsync();
        try
        {
            var u = await Find(id);
            if (!active)
            {
                if (id == CurrentUserId) throw new ApiException(400, "Không thể tự khóa tài khoản đang đăng nhập.");
                await ProtectLastAdmin(u);
            }
            u.Status = active ? (byte)1 : (byte)0; u.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(); if (!active) await Revoke(id);
            return Ok(new { message = active ? "Đã kích hoạt tài khoản." : "Đã khóa tài khoản." });
        }
        finally { AuthGate.Lock.Release(); }
    }
    [HttpPut("{id:int}/role")]
    public async Task<IActionResult> ChangeRole(int id, RoleBody b)
    {
        await AuthGate.Lock.WaitAsync();
        try
        {
            var u = await Find(id);
            var role = await db.Roles.SingleOrDefaultAsync(r => r.RoleName == b.RoleName) ?? throw new ApiException(400, "Vai trò không hợp lệ.");
            if (role.RoleName != "Admin") { if (id == CurrentUserId) throw new ApiException(400, "Không thể tự thay đổi quyền quản trị."); await ProtectLastAdmin(u); }
            u.Role = role; u.UpdatedAt = DateTime.UtcNow;
            if (role.RoleName == "Volunteer" && !await db.Volunteers.AnyAsync(v => v.UserId == id))
                db.Volunteers.Add(new Volunteer { UserId = id, ApprovalStatus = 1, AvailabilityStatus = 1, ApprovedAt = DateTime.UtcNow, ApprovedBy = CurrentUserId });
            await db.SaveChangesAsync(); await Revoke(id); return Ok(new { message = "Đã thay đổi vai trò. Tài khoản cần đăng nhập lại." });
        }
        finally { AuthGate.Lock.Release(); }
    }
    [HttpPost("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, PasswordBody b)
    {
        Security.ValidatePassword(b.NewPassword);
        var u = await Find(id); u.PasswordHash = Security.HashPassword(u, b.NewPassword); u.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(); await Revoke(id); return Ok(new { message = "Đã đặt lại mật khẩu." });
    }
    private async Task<User> Find(int id) => await db.Users.Include(u => u.Role).SingleOrDefaultAsync(u => u.UserId == id) ?? throw new ApiException(404, "Không tìm thấy tài khoản.");
    private async Task ProtectLastAdmin(User u)
    {
        if (u.Role.RoleName == "Admin" && !await db.Users.AnyAsync(x => x.UserId != u.UserId && x.Status == 1 && x.Role.RoleName == "Admin"))
            throw new ApiException(400, "Hệ thống phải còn ít nhất một quản trị viên đang hoạt động.");
    }
    private Task<int> Revoke(int id) => db.RefreshTokens.Where(t => t.UserId == id).ExecuteUpdateAsync(s => s.SetProperty(t => t.IsRevoked, true).SetProperty(t => t.RevokedAt, DateTime.UtcNow));
}
