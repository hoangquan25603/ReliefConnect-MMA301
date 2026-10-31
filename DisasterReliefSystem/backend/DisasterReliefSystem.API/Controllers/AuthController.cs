using System.ComponentModel.DataAnnotations;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using DisasterReliefSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[Route("api/auth")]
public sealed class AuthController(AppDbContext db, PasswordResetService resets) : AppController
{
    public record LoginBody([Required, EmailAddress, MaxLength(100)] string Email, [Required, MaxLength(128)] string Password);
    public record RegisterBody([Required, EmailAddress, MaxLength(100)] string Email, [Required] string Password,
        [Required] string ConfirmPassword, [Required, MaxLength(100)] string FullName, [MaxLength(20)] string? PhoneNumber);
    public record TokenBody([Required, MaxLength(128)] string RefreshToken);
    public record ChangePasswordBody([Required] string OldPassword, [Required] string NewPassword, [Required] string ConfirmPassword);
    public record EmailBody([Required, EmailAddress, MaxLength(100)] string Email);
    public record VerifyBody([Required, EmailAddress] string Email, [Required, RegularExpression("^[0-9]{6}$")] string Code);
    public record ResetBody([Required, MaxLength(128)] string ResetSessionId, [Required] string NewPassword, [Required] string ConfirmPassword);

    private async Task<object> CreateSession(User user)
    {
        var access = Security.NewToken(); var refresh = Security.NewToken();
        var expires = DateTime.UtcNow.AddHours(1);
        db.RefreshTokens.Add(new RefreshToken { UserId = user.UserId, Token = Security.TokenHash(refresh),
            AccessTokenHash = Security.TokenHash(access), AccessExpiresAt = expires, CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7) });
        await db.SaveChangesAsync();
        return new { userId = user.UserId.ToString(), user.FullName, user.Email, role = user.Role.RoleName,
            phoneNumber = user.Phone, accessToken = access, refreshToken = refresh, expiresAt = expires };
    }

    [HttpPost("login"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Login(LoginBody body)
    {
        var email = body.Email.Trim().ToLowerInvariant();
        var user = await db.Users.Include(u => u.Role).SingleOrDefaultAsync(u => u.Email == email);
        if (user is null || !Security.VerifyPassword(user, body.Password) || user.Status != 1)
            throw new ApiException(401, "Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.");
        return Ok(await CreateSession(user));
    }

    [HttpPost("register"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterBody body)
    {
        Security.ValidatePassword(body.Password);
        if (body.Password != body.ConfirmPassword) throw new ApiException(400, "Mật khẩu xác nhận không khớp.");
        if (string.IsNullOrWhiteSpace(body.FullName)) throw new ApiException(400, "Họ tên không được để trống.");
        var email = body.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email)) throw new ApiException(409, "Email đã được đăng ký.");
        var role = await db.Roles.SingleAsync(r => r.RoleName == "Requester");
        var user = new User { Role = role, FullName = body.FullName.Trim(), Email = email, Phone = body.PhoneNumber,
            Status = 1, CreatedAt = DateTime.UtcNow };
        user.PasswordHash = Security.HashPassword(user, body.Password);
        user.Requester = new Requester { User = user };
        db.Users.Add(user); await db.SaveChangesAsync();
        return Ok(await CreateSession(user));
    }

    [HttpGet("me"), Authorize]
    public async Task<IActionResult> Me() => Ok(Security.UserDto(await db.Users.Include(u => u.Role).SingleAsync(u => u.UserId == CurrentUserId)));

    [HttpPost("refresh-token"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Refresh(TokenBody body)
    {
        await AuthGate.Lock.WaitAsync();
        try
        {
            await using var transaction = await db.Database.BeginTransactionAsync();
            var hash = Security.TokenHash(body.RefreshToken);
            var session = await db.RefreshTokens.Include(t => t.User).ThenInclude(u => u.Role).SingleOrDefaultAsync(t => t.Token == hash);
            if (session is null || session.IsRevoked || session.ExpiresAt <= DateTime.UtcNow || session.User.Status != 1)
                throw new ApiException(401, "Phiên đăng nhập đã hết hạn.");
            session.IsRevoked = true; session.RevokedAt = DateTime.UtcNow;
            var result = await CreateSession(session.User);
            await transaction.CommitAsync();
            return Ok(result);
        }
        finally { AuthGate.Lock.Release(); }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(TokenBody body)
    {
        var hash = Security.TokenHash(body.RefreshToken);
        await db.RefreshTokens.Where(t => t.Token == hash).ExecuteUpdateAsync(setters => setters
            .SetProperty(t => t.IsRevoked, true).SetProperty(t => t.RevokedAt, DateTime.UtcNow));
        return Ok(new { message = "Đã đăng xuất." });
    }

    [HttpPost("change-password"), Authorize, EnableRateLimiting("auth")]
    public async Task<IActionResult> ChangePassword(ChangePasswordBody body)
    {
        Security.ValidatePassword(body.NewPassword);
        if (body.NewPassword != body.ConfirmPassword) throw new ApiException(400, "Mật khẩu xác nhận không khớp.");
        var user = await db.Users.FindAsync(CurrentUserId) ?? throw new ApiException(404, "Không tìm thấy tài khoản.");
        if (!Security.VerifyPassword(user, body.OldPassword)) throw new ApiException(400, "Mật khẩu hiện tại không đúng.");
        user.PasswordHash = Security.HashPassword(user, body.NewPassword); user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(); await RevokeSessions(user.UserId);
        return Ok(new { message = "Đổi mật khẩu thành công. Vui lòng đăng nhập lại." });
    }

    [HttpPost("forgot-password"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Forgot(EmailBody body)
    {
        resets.EnsureAvailable();
        var email = body.Email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email && u.Status == 1);
        if (user is not null) await resets.SendAsync(user.UserId, user.Email);
        return Ok(new { message = "Nếu tài khoản tồn tại, mã khôi phục đã được gửi." });
    }

    [HttpPost("verify-reset-code"), EnableRateLimiting("auth")]
    public IActionResult VerifyReset(VerifyBody body) => Ok(new { resetSessionId = resets.Verify(body.Email.Trim().ToLowerInvariant(), body.Code) });

    [HttpPost("reset-password"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Reset(ResetBody body)
    {
        Security.ValidatePassword(body.NewPassword);
        if (body.NewPassword != body.ConfirmPassword) throw new ApiException(400, "Mật khẩu xác nhận không khớp.");
        var userId = resets.ConsumeSession(body.ResetSessionId);
        var user = await db.Users.FindAsync(userId) ?? throw new ApiException(400, "Phiên khôi phục không hợp lệ.");
        user.PasswordHash = Security.HashPassword(user, body.NewPassword); user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(); await RevokeSessions(userId);
        return Ok(new { message = "Đã đặt lại mật khẩu." });
    }

    private Task<int> RevokeSessions(int userId) => db.RefreshTokens.Where(t => t.UserId == userId)
        .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.IsRevoked, true).SetProperty(t => t.RevokedAt, DateTime.UtcNow));
}
