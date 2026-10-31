using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using Microsoft.Extensions.Caching.Memory;

namespace DisasterReliefSystem.API.Infrastructure;

public sealed class PasswordResetService(IConfiguration config, IWebHostEnvironment environment, IMemoryCache cache)
{
    private sealed class Challenge(int userId, string hash) { public int UserId { get; } = userId; public string Hash { get; } = hash; public int Attempts { get; set; } }
    private readonly object sync = new();
    public void EnsureAvailable()
    {
        var method = config["Email:DeliveryMethod"];
        if (method != "Smtp" && !(method == "Pickup" && environment.IsDevelopment()))
            throw new ApiException(503, "Chưa cấu hình dịch vụ email. Liên hệ quản trị viên để đặt lại mật khẩu.");
    }
    public async Task SendAsync(int userId, string email)
    {
        EnsureAvailable();
        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var key = "reset:" + email;
        cache.Set(key, new Challenge(userId, Security.TokenHash(code)), TimeSpan.FromMinutes(10));
        try
        {
            using var client = new SmtpClient();
            if (config["Email:DeliveryMethod"] == "Pickup")
            {
                var path = Path.Combine(environment.ContentRootPath, ".local", "mail");
                Directory.CreateDirectory(path);
                client.DeliveryMethod = SmtpDeliveryMethod.SpecifiedPickupDirectory;
                client.PickupDirectoryLocation = path;
            }
            else
            {
                client.Host = config["Email:Host"] ?? throw new ApiException(503, "Chưa cấu hình máy chủ email.");
                client.Port = config.GetValue("Email:Port", 587); client.EnableSsl = config.GetValue("Email:EnableSsl", true);
                client.Credentials = new NetworkCredential(config["Email:Username"], config["Email:Password"]);
            }
            using var mail = new MailMessage(config["Email:From"] ?? "noreply@relief.local", email,
                "ReliefConnect - Password reset", $"Your verification code: {code}\nValid for 10 minutes. Do not share this code.");
            await client.SendMailAsync(mail);
        }
        catch { cache.Remove(key); throw new ApiException(503, "Không gửi được email khôi phục. Vui lòng liên hệ quản trị viên."); }
    }
    public string Verify(string email, string code)
    {
        lock (sync)
        {
            var key = "reset:" + email;
            if (!cache.TryGetValue<Challenge>(key, out var challenge) || challenge is null) throw new ApiException(400, "Mã xác minh không hợp lệ hoặc hết hạn.");
            challenge.Attempts++;
            if (challenge.Hash != Security.TokenHash(code))
            {
                if (challenge.Attempts >= 5) cache.Remove(key);
                throw new ApiException(400, "Mã xác minh không đúng. Tối đa 5 lần thử.");
            }
            cache.Remove(key);
            var session = Security.NewToken();
            cache.Set("reset-session:" + Security.TokenHash(session), challenge.UserId, TimeSpan.FromMinutes(10));
            return session;
        }
    }
    public int ConsumeSession(string session)
    {
        lock (sync)
        {
            var key = "reset-session:" + Security.TokenHash(session);
            if (!cache.TryGetValue<int>(key, out var userId) || userId <= 0) throw new ApiException(400, "Phiên khôi phục đã hết hạn hoặc đã được sử dụng.");
            cache.Remove(key); return userId;
        }
    }
}
