using System.ComponentModel.DataAnnotations;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using DisasterReliefSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[Authorize, Route("api/inventory-items")]
public sealed class InventoryItemsController(AppDbContext db) : AppController
{
    public record CreateBody([Required] string WarehouseId, [Required, MaxLength(100)] string ItemName,
        [Required, MaxLength(30)] string Unit, [Range(0, 1000000000)] int MinimumQuantity, string Category = "Other");
    public record UpdateBody([Required, MaxLength(100)] string ItemName, [Required, MaxLength(30)] string Unit,
        [Range(0, 1000000000)] int MinimumQuantity, string Category = "Other");
    public record MoveBody([Range(1, 1000000000)] int Quantity, [MaxLength(100)] string? ReferenceNo, [MaxLength(1000)] string? Note);
    public record TransferBody([Required] string DestinationWarehouseId, [Range(1, 1000000000)] int Quantity,
        [MaxLength(100)] string? ReferenceNo, [MaxLength(1000)] string? Note);
    public static readonly string[] Categories = ["Food", "Water", "Medicine", "Blanket", "Shelter", "Other"];
    public static object Dto(Inventory i) => new { id = i.InventoryId.ToString(), warehouseId = i.WarehouseId.ToString(),
        itemName = i.Supply.SupplyName, category = i.Supply.Category ?? "Other", unit = i.Supply.Unit, i.Quantity,
        i.MinimumQuantity, isLowStock = i.Quantity <= i.MinimumQuantity };
    private IQueryable<Inventory> Query => db.Inventories.Include(i => i.Supply).Include(i => i.Warehouse);
    [HttpGet]
    public async Task<IActionResult> List(int? warehouseId, string? search, bool lowStockOnly = false, int pageNumber = 1, int pageSize = 20)
    {
        var q = Query.AsNoTracking();
        if (warehouseId.HasValue) q = q.Where(i => i.WarehouseId == warehouseId.Value);
        if (lowStockOnly) q = q.Where(i => i.Quantity <= i.MinimumQuantity);
        if (!string.IsNullOrWhiteSpace(search)) q = q.Where(i => i.Supply.SupplyName.Contains(search.Trim()));
        return Ok(Page((await q.OrderBy(i => i.InventoryId).ToListAsync()).Select(Dto), pageNumber, pageSize));
    }
    [HttpGet("summary")]
    public async Task<IActionResult> Summary(int? warehouseId)
    {
        var q = db.Inventories.AsNoTracking();
        if (warehouseId.HasValue) q = q.Where(i => i.WarehouseId == warehouseId.Value);
        var rows = await q.ToListAsync();
        return Ok(new { totalItems = rows.Count, totalQuantity = rows.Sum(i => (long)i.Quantity),
            lowStockItems = rows.Count(i => i.Quantity <= i.MinimumQuantity), warehouses = rows.Select(i => i.WarehouseId).Distinct().Count() });
    }
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) => Ok(Dto(await Find(id)));
    [HttpPost, Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Create(CreateBody b)
    {
        Validate(b.ItemName, b.Unit, b.Category);
        if (!int.TryParse(b.WarehouseId, out var warehouseId)) throw new ApiException(400, "Mã kho không hợp lệ.");
        await InventoryGate.Lock.WaitAsync();
        try
        {
            await ActiveWarehouse(warehouseId);
            var supply = await GetOrCreateSupply(b.ItemName, b.Unit, b.Category);
            if (supply.SupplyId != 0 && await db.Inventories.AnyAsync(i => i.WarehouseId == warehouseId && i.SupplyId == supply.SupplyId))
                throw new ApiException(409, "Vật tư này đã có trong kho. Dùng chức năng nhập kho để bổ sung.");
            var item = new Inventory { WarehouseId = warehouseId, Supply = supply, MinimumQuantity = b.MinimumQuantity, UpdatedAt = DateTime.UtcNow };
            db.Inventories.Add(item); await db.SaveChangesAsync();
            return Ok(new { id = item.InventoryId.ToString(), message = "Đã tạo vật tư với tồn kho bằng 0." });
        }
        finally { InventoryGate.Lock.Release(); }
    }
    [HttpPut("{id:int}"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Update(int id, UpdateBody b)
    {
        Validate(b.ItemName, b.Unit, b.Category);
        await InventoryGate.Lock.WaitAsync();
        try
        {
            var i = await Find(id); await ActiveWarehouse(i.WarehouseId);
            var supply = await GetOrCreateSupply(b.ItemName, b.Unit, b.Category);
            if (supply.SupplyId != i.SupplyId && await db.RequestAllocations.AnyAsync(a => a.InventoryId == id && !a.Returned))
                throw new ApiException(400, "Vật tư đã được cấp cho yêu cầu cứu trợ. Không thể đổi tên, nhóm hoặc đơn vị; chỉ có thể sửa ngưỡng tồn tối thiểu.");
            if (supply.SupplyId != 0 && await db.Inventories.AnyAsync(x => x.InventoryId != id && x.WarehouseId == i.WarehouseId && x.SupplyId == supply.SupplyId))
                throw new ApiException(409, "Kho đã có vật tư trùng tên, đơn vị và nhóm.");
            if (!string.Equals(i.Supply.Unit, b.Unit.Trim(), StringComparison.OrdinalIgnoreCase) &&
                (i.Quantity > 0 || await db.InventoryTransactions.AnyAsync(t => t.InventoryId == id)))
                throw new ApiException(400, "Không thể đổi đơn vị của vật tư đã phát sinh giao dịch. Hãy tạo vật tư mới.");
            i.Supply = supply; i.MinimumQuantity = b.MinimumQuantity; i.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(); return Ok(new { id = id.ToString(), message = "Đã cập nhật vật tư." });
        }
        finally { InventoryGate.Lock.Release(); }
    }
    [HttpPost("{id:int}/stock-in"), Authorize(Roles = "Admin,Coordinator")]
    public Task<IActionResult> StockIn(int id, MoveBody b) => Move(id, b, true);
    [HttpPost("{id:int}/stock-out"), Authorize(Roles = "Admin,Coordinator")]
    public Task<IActionResult> StockOut(int id, MoveBody b) => Move(id, b, false);
    private async Task<IActionResult> Move(int id, MoveBody b, bool incoming)
    {
        await InventoryGate.Lock.WaitAsync();
        try
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            var i = await Find(id); await ActiveWarehouse(i.WarehouseId);
            if (!incoming && b.Quantity > i.Quantity) throw new ApiException(400, "Số lượng xuất vượt quá tồn kho.");
            i.Quantity = checked(i.Quantity + (incoming ? b.Quantity : -b.Quantity)); i.UpdatedAt = DateTime.UtcNow;
            AddTransaction(i, incoming ? (byte)0 : (byte)1, b.Quantity, b.ReferenceNo, b.Note);
            await db.SaveChangesAsync(); await tx.CommitAsync();
            return Ok(new { inventoryItemId = id.ToString(), i.Quantity, isLowStock = i.Quantity <= i.MinimumQuantity });
        }
        finally { InventoryGate.Lock.Release(); }
    }
    [HttpPost("{id:int}/transfer"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Transfer(int id, TransferBody b)
    {
        if (!int.TryParse(b.DestinationWarehouseId, out var destination)) throw new ApiException(400, "Mã kho đích không hợp lệ.");
        await InventoryGate.Lock.WaitAsync();
        try
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            var source = await Find(id); await ActiveWarehouse(source.WarehouseId); await ActiveWarehouse(destination);
            if (source.WarehouseId == destination) throw new ApiException(400, "Kho đích phải khác kho nguồn.");
            if (source.Quantity < b.Quantity) throw new ApiException(400, "Số lượng chuyển vượt quá tồn kho.");
            var target = await db.Inventories.SingleOrDefaultAsync(i => i.WarehouseId == destination && i.SupplyId == source.SupplyId);
            if (target is null)
            {
                target = new Inventory { WarehouseId = destination, SupplyId = source.SupplyId, MinimumQuantity = source.MinimumQuantity };
                db.Inventories.Add(target);
            }
            source.Quantity -= b.Quantity; target.Quantity = checked(target.Quantity + b.Quantity);
            source.UpdatedAt = target.UpdatedAt = DateTime.UtcNow;
            var reference = string.IsNullOrWhiteSpace(b.ReferenceNo) ? "TRF-" + Guid.NewGuid().ToString("N")[..12] : b.ReferenceNo;
            AddTransaction(source, 3, b.Quantity, reference, b.Note); AddTransaction(target, 2, b.Quantity, reference, b.Note);
            await db.SaveChangesAsync(); await tx.CommitAsync();
            return Ok(new { inventoryItemId = id.ToString(), destinationInventoryItemId = target.InventoryId.ToString(),
                source.Quantity, destinationQuantity = target.Quantity, message = "Đã chuyển kho và ghi sổ hai đầu." });
        }
        finally { InventoryGate.Lock.Release(); }
    }
    [HttpGet("{id:int}/transactions")]
    public async Task<IActionResult> Transactions(int id, int pageNumber = 1, int pageSize = 20)
    {
        await Find(id);
        var rows = await db.InventoryTransactions.AsNoTracking().Where(t => t.InventoryId == id).OrderByDescending(t => t.CreatedAt).ThenByDescending(t => t.TransactionId).ToListAsync();
        return Ok(Page(rows.Select(t => new { id = t.TransactionId.ToString(), transactionType = t.Type switch { 0 => "StockIn", 1 => "StockOut", 2 => "TransferIn", 3 => "TransferOut", _ => "Unknown" },
            t.Quantity, t.ReferenceNo, t.Note, t.CreatedAt, createdByUserId = t.CreatedByUserId?.ToString() }), pageNumber, pageSize));
    }
    private Task<Inventory> Find(int id) => FindImpl(id);
    private async Task<Inventory> FindImpl(int id) => await Query.SingleOrDefaultAsync(i => i.InventoryId == id) ?? throw new ApiException(404, "Không tìm thấy vật tư.");
    private async Task ActiveWarehouse(int id)
    {
        var w = await db.Warehouses.FindAsync(id) ?? throw new ApiException(404, "Không tìm thấy kho.");
        if (!w.IsActive) throw new ApiException(400, "Kho đã ngưng hoạt động.");
    }
    private async Task<Supply> GetOrCreateSupply(string name, string unit, string category)
    {
        name = name.Trim(); unit = unit.Trim();
        return await db.Supplies.FirstOrDefaultAsync(s => s.SupplyName == name && s.Unit == unit && s.Category == category)
            ?? new Supply { SupplyName = name, Unit = unit, Category = category };
    }
    private void AddTransaction(Inventory i, byte type, int quantity, string? reference, string? note) =>
        db.InventoryTransactions.Add(new InventoryTransaction { Inventory = i, Type = type, Quantity = quantity,
            ReferenceNo = reference, Note = note, CreatedAt = DateTime.UtcNow, CreatedByUserId = CurrentUserId });
    private static void Validate(string name, string unit, string category)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(unit) || !Categories.Contains(category)) throw new ApiException(400, "Tên, đơn vị hoặc nhóm vật tư không hợp lệ.");
    }
}
