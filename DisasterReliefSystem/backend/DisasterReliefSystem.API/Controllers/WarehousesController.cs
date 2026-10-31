using System.ComponentModel.DataAnnotations;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using DisasterReliefSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[Authorize, Route("api/warehouses")]
public sealed class WarehousesController(AppDbContext db) : AppController
{
    public record WarehouseBody([Required, MaxLength(100)] string Name, [Required, MaxLength(255)] string Address,
        [Range(-90, 90)] double Latitude, [Range(-180, 180)] double Longitude, [MaxLength(30)] string? ContactPhone, bool IsActive = true);
    public static object Dto(Warehouse w) => new { id = w.WarehouseId.ToString(), name = w.WarehouseName, address = w.Location,
        w.Latitude, w.Longitude, w.ContactPhone, w.IsActive };
    [HttpGet]
    public async Task<IActionResult> List(int pageNumber = 1, int pageSize = 20) => Ok(Page(
        (await db.Warehouses.AsNoTracking().OrderBy(w => w.WarehouseName).ToListAsync()).Select(Dto), pageNumber, pageSize));
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) => Ok(Dto(await db.Warehouses.FindAsync(id) ?? throw new ApiException(404, "Không tìm thấy kho.")));
    [HttpPost, Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Create(WarehouseBody body)
    {
        Validate(body);
        var w = new Warehouse { WarehouseName = body.Name.Trim(), Location = body.Address.Trim(), Latitude = body.Latitude,
            Longitude = body.Longitude, ContactPhone = body.ContactPhone, IsActive = true, UpdatedAt = DateTime.UtcNow };
        db.Warehouses.Add(w); await db.SaveChangesAsync();
        return Ok(new { id = w.WarehouseId.ToString(), message = "Đã tạo kho." });
    }
    [HttpPut("{id:int}"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Update(int id, WarehouseBody body)
    {
        Validate(body); await InventoryGate.Lock.WaitAsync();
        try
        {
            var w = await db.Warehouses.FindAsync(id) ?? throw new ApiException(404, "Không tìm thấy kho.");
            if (!body.IsActive && await db.Inventories.AnyAsync(i => i.WarehouseId == id && i.Quantity > 0))
                throw new ApiException(400, "Kho còn hàng. Chuyển hoặc xuất hết hàng trước khi ngưng hoạt động.");
            w.WarehouseName = body.Name.Trim(); w.Location = body.Address.Trim(); w.Latitude = body.Latitude;
            w.Longitude = body.Longitude; w.ContactPhone = body.ContactPhone; w.IsActive = body.IsActive; w.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(); return Ok(new { id = id.ToString(), message = "Đã cập nhật kho." });
        }
        finally { InventoryGate.Lock.Release(); }
    }
    [HttpDelete("{id:int}"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Deactivate(int id)
    {
        await InventoryGate.Lock.WaitAsync();
        try
        {
            var w = await db.Warehouses.FindAsync(id) ?? throw new ApiException(404, "Không tìm thấy kho.");
            if (await db.Inventories.AnyAsync(i => i.WarehouseId == id && i.Quantity > 0)) throw new ApiException(400, "Kho còn hàng. Chuyển hoặc xuất hết hàng trước khi ngưng hoạt động.");
            w.IsActive = false; w.UpdatedAt = DateTime.UtcNow; await db.SaveChangesAsync();
            return Ok(new { id = id.ToString(), message = "Đã ngưng hoạt động kho." });
        }
        finally { InventoryGate.Lock.Release(); }
    }
    private static void Validate(WarehouseBody b)
    {
        if (string.IsNullOrWhiteSpace(b.Name) || string.IsNullOrWhiteSpace(b.Address)) throw new ApiException(400, "Tên và địa chỉ kho không được để trống.");
    }
}
