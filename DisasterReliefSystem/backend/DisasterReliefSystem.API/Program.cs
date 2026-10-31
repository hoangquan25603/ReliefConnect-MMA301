using System.Threading.RateLimiting;
using DisasterReliefSystem.API.AI;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var dataDirectory = Path.Combine(builder.Environment.ContentRootPath, ".local");
Directory.CreateDirectory(dataDirectory);
builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(dataDirectory, "keys")));
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(
    builder.Configuration.GetConnectionString("DefaultConnection") ?? $"Data Source={Path.Combine(dataDirectory, "relief.db")}"));
builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.PropertyNameCaseInsensitive = true);
builder.Services.AddAuthentication("Session").AddScheme<AuthenticationSchemeOptions, SessionAuthenticationHandler>("Session", null);
builder.Services.AddAuthorization();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<ReliefClassifier>();
builder.Services.AddSingleton<PasswordResetService>();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ??
        ["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173", "https://localhost", "http://localhost", "capacitor://localhost"])
    .AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions
        { PermitLimit = 30, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

var app = builder.Build();
app.Use(async (context, next) =>
{
    try { await next(); }
    catch (Exception ex) when (ex is ApiException or DbUpdateException or OverflowException)
    {
        var status = ex is ApiException error ? error.StatusCode : ex is DbUpdateConcurrencyException ? 409 : ex is OverflowException ? 400 : 409;
        var message = ex is ApiException ? ex.Message : ex is OverflowException ? "Số lượng vượt giới hạn cho phép." : "Dữ liệu đã thay đổi hoặc trùng lặp. Hãy tải lại và thử lại.";
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new { statusCode = status, isSuccess = false, errorMessages = new[] { message }, result = (object?)null });
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Unhandled API error");
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { statusCode = 500, isSuccess = false, errorMessages = new[] { "Lỗi máy chủ. Vui lòng thử lại." }, result = (object?)null });
    }
});
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
var serveWeb = Directory.Exists(Path.Combine(app.Environment.ContentRootPath, "wwwroot"));
if (serveWeb) { app.UseDefaultFiles(); app.UseStaticFiles(); }
app.MapControllers();
app.MapGet("/api/health", () => new { status = "ok", application = "ReliefConnect", database = "SQLite", version = "1.0.0" });
if (serveWeb) app.MapFallbackToFile("index.html");
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
    await SqliteSchema.UpgradeLocalDemoAsync(db);
    await SeedData.InitializeAsync(db, builder.Configuration, app.Environment);
}
app.Run();
public partial class Program { }
