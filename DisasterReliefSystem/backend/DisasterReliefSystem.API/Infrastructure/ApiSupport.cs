using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace DisasterReliefSystem.API.Infrastructure;

public sealed class ApiException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

[ApiController]
public abstract class AppController : ControllerBase
{
    protected int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    protected static object Page<T>(IEnumerable<T> source, int pageNumber = 1, int pageSize = 20)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 200);
        var rows = source.ToList();
        return new { items = rows.Skip((pageNumber - 1) * pageSize).Take(pageSize), totalCount = rows.Count,
            pageNumber, pageSize, totalPages = (int)Math.Ceiling(rows.Count / (double)pageSize) };
    }
}

// Serialize stock-changing operations within this single-instance SQLite deployment.
// A transaction and optimistic concurrency check additionally prevent partial writes.
public static class InventoryGate
{
    public static readonly SemaphoreSlim Lock = new(1, 1);
}

public static class AuthGate
{
    public static readonly SemaphoreSlim Lock = new(1, 1);
}
