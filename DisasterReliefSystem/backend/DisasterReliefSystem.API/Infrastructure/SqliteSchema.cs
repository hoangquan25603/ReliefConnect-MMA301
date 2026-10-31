using DisasterReliefSystem.API.Data;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Infrastructure;

/// <summary>Small, idempotent upgrade for databases made by the first local demo build.
/// Historical SQL Server migrations are intentionally not applied to the local SQLite database.</summary>
public static class SqliteSchema
{
    public static async Task UpgradeLocalDemoAsync(AppDbContext db)
    {
        var connection = db.Database.GetDbConnection();
        await connection.OpenAsync();
        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "PRAGMA table_info('ReliefRequests')";
            var found = false;
            await using (var reader = await command.ExecuteReaderAsync())
                while (await reader.ReadAsync())
                    if (reader.GetString(1) == "InventoryIssuesJson") found = true;
            if (!found)
            {
                command.CommandText = "ALTER TABLE ReliefRequests ADD COLUMN InventoryIssuesJson TEXT NULL";
                await command.ExecuteNonQueryAsync();
            }
        }
        finally { await connection.CloseAsync(); }
    }
}
