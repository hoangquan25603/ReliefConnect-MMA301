using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DisasterReliefSystem.API.Infrastructure;

public static class Security
{
    private static readonly PasswordHasher<User> Hasher = new();
    public static string HashPassword(User user, string password) => Hasher.HashPassword(user, password);
    public static bool VerifyPassword(User user, string password)
    {
        try { return Hasher.VerifyHashedPassword(user, user.PasswordHash, password) != PasswordVerificationResult.Failed; }
        catch (FormatException) { return false; }
    }
    public static string NewToken() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
    public static string TokenHash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    public static void ValidatePassword(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < 10 || password.Length > 128 ||
            !password.Any(char.IsLetter) || !password.Any(char.IsDigit))
            throw new ApiException(400, "Mật khẩu phải dài 10–128 ký tự, gồm chữ và số.");
    }
    public static object UserDto(User user) => new { id = user.UserId.ToString(), userId = user.UserId.ToString(),
        user.FullName, user.Email, phoneNumber = user.Phone, role = user.Role.RoleName,
        isActive = user.Status == 1, user.CreatedAt, user.UpdatedAt };
}

public sealed class SessionAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger,
    UrlEncoder encoder, AppDbContext db) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var value = Request.Headers.Authorization.ToString();
        if (!value.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return AuthenticateResult.NoResult();
        var token = value[7..].Trim();
        if (token.Length != 64) return AuthenticateResult.Fail("Invalid session");
        var hash = Security.TokenHash(token);
        var session = await db.RefreshTokens.AsNoTracking().Include(s => s.User).ThenInclude(u => u.Role)
            .SingleOrDefaultAsync(s => s.AccessTokenHash == hash && !s.IsRevoked);
        if (session is null || session.AccessExpiresAt <= DateTime.UtcNow || session.User.Status != 1)
            return AuthenticateResult.Fail("Session expired");
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, session.UserId.ToString()),
            new Claim(ClaimTypes.Name, session.User.FullName), new Claim(ClaimTypes.Email, session.User.Email),
            new Claim(ClaimTypes.Role, session.User.Role.RoleName) };
        return AuthenticateResult.Success(new AuthenticationTicket(
            new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name)), Scheme.Name));
    }
}
