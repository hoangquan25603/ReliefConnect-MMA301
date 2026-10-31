using System.ComponentModel.DataAnnotations;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using DisasterReliefSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[ApiController, Authorize, Route("api/donations")]
public class DonationsController(AppDbContext db) : AppController
{
    public record ItemBody([Required, StringLength(200)] string ItemName, [Required, StringLength(50)] string Unit, [Range(1, 1000000)] int Quantity);
    public record CreateBody([Required, MinLength(1), MaxLength(100)] ItemBody[] Items, [StringLength(2000)] string? Note);
    public record MappingBody([Required] string DonationItemId, bool CreateNewItem, string? InventoryItemId, string? WarehouseId, [Range(0, 1000000)] int? NewItemMinimumQuantity);
    public record ApproveBody([Required, MinLength(1), MaxLength(100)] MappingBody[] ItemMappings);
    public record RejectBody([Required, StringLength(2000)] string Reason);

    [HttpPost, Authorize(Roles = "Organization,Admin")]
    public async Task<IActionResult> Create(CreateBody body)
    {
        var d = new Donation { DonorId = CurrentUserId, Note = body.Note?.Trim() ?? "", Items = body.Items.Select(i => new DonationItem
        { ItemName = WorkflowSupport.Text(i.ItemName, "Tên vật tư", 200), Unit = WorkflowSupport.Text(i.Unit, "Đơn vị", 50), Quantity = i.Quantity }).ToList() };
        db.Donations.Add(d);
        foreach (var uid in await db.Users.Where(u => u.Role.RoleName == "Admin" || u.Role.RoleName == "Coordinator").Select(u => u.UserId).ToListAsync())
            WorkflowSupport.Notify(db, uid, "Quyên góp mới chờ duyệt", $"{d.Items.Count} loại vật tư đang chờ tiếp nhận.", "DonationCreated");
        await db.SaveChangesAsync(); return StatusCode(201, new { id = d.Id.ToString(), message = "Đã gửi quyên góp chờ tiếp nhận." });
    }

    [HttpGet("my"), Authorize(Roles = "Organization,Admin")]
    public async Task<IActionResult> My(int pageNumber = 1, int pageSize = 20) => Ok(Page((await db.Donations.Include(d => d.Donor).Include(d => d.Items).Where(d => d.DonorId == CurrentUserId).OrderByDescending(d => d.CreatedAt).ToListAsync()).Select(WorkflowSupport.DonationDto), pageNumber, pageSize));

    [HttpGet("pending"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Pending(int pageNumber = 1, int pageSize = 20) => Ok(Page((await db.Donations.Include(d => d.Donor).Include(d => d.Items).Where(d => d.Status == "Pending").OrderBy(d => d.CreatedAt).ToListAsync()).Select(WorkflowSupport.DonationDto), pageNumber, pageSize));

    [HttpPut("{id:int}/approve"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Approve(int id, ApproveBody body)
    {
        await InventoryGate.Lock.WaitAsync();
        try
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            var d = await db.Donations.Include(d => d.Items).SingleOrDefaultAsync(d => d.Id == id) ?? throw new ApiException(404, "Không tìm thấy quyên góp.");
            if (d.Status != "Pending") throw new ApiException(409, "Quyên góp đã được xử lý.");
            var ids = body.ItemMappings.Select(m => WorkflowSupport.Id(m.DonationItemId)).ToArray();
            if (ids.Distinct().Count() != d.Items.Count || ids.Length != d.Items.Count || ids.Except(d.Items.Select(i => i.Id)).Any()) throw new ApiException(400, "Phải ánh xạ đủ mỗi vật tư đúng một lần.");
            foreach (var mapping in body.ItemMappings)
            {
                var item = d.Items.Single(i => i.Id == WorkflowSupport.Id(mapping.DonationItemId));
                Inventory stock;
                if (mapping.CreateNewItem)
                {
                    var wid = WorkflowSupport.Id(mapping.WarehouseId);
                    if (!await db.Warehouses.AnyAsync(w => w.WarehouseId == wid && w.IsActive)) throw new ApiException(400, "Kho không tồn tại hoặc đã ngừng hoạt động.");
                    var supply = await db.Supplies.FirstOrDefaultAsync(s => s.SupplyName.ToLower() == item.ItemName.ToLower() && s.Unit == item.Unit);
                    if (supply == null) { supply = new Supply { SupplyName = item.ItemName, Unit = item.Unit, Category = "Other" }; db.Supplies.Add(supply); await db.SaveChangesAsync(); }
                    stock = await db.Inventories.SingleOrDefaultAsync(i => i.WarehouseId == wid && i.SupplyId == supply.SupplyId)
                        ?? new Inventory { WarehouseId = wid, SupplyId = supply.SupplyId, MinimumQuantity = mapping.NewItemMinimumQuantity ?? 0 };
                    if (stock.InventoryId == 0) db.Inventories.Add(stock);
                }
                else
                {
                    var iid = WorkflowSupport.Id(mapping.InventoryItemId);
                    stock = await db.Inventories.Include(i => i.Supply).SingleOrDefaultAsync(i => i.InventoryId == iid && i.Warehouse.IsActive) ?? throw new ApiException(400, "Vật tư đích không tồn tại.");
                    if (!string.Equals(stock.Supply.Unit?.Trim(), item.Unit.Trim(), StringComparison.OrdinalIgnoreCase)) throw new ApiException(400, "Đơn vị quyên góp phải trùng với đơn vị vật tư trong kho.");
                }
                stock.Quantity = checked(stock.Quantity + item.Quantity); stock.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(); item.InventoryItemId = stock.InventoryId;
                db.InventoryTransactions.Add(new InventoryTransaction { InventoryId = stock.InventoryId, Type = 0, Quantity = item.Quantity, ReferenceId = id, ReferenceNo = $"DON-{id}", Note = "Tiếp nhận quyên góp", CreatedByUserId = CurrentUserId, CreatedAt = DateTime.UtcNow });
            }
            d.Status = "Approved"; d.ReviewedAt = DateTime.UtcNow; d.ReviewedBy = CurrentUserId;
            WorkflowSupport.Notify(db, d.DonorId, "Đã tiếp nhận quyên góp", "Vật tư đã được nhập kho. Cảm ơn sự hỗ trợ của bạn.", "DonationApproved");
            WorkflowSupport.Audit(db, CurrentUserId, "Approve", "Donation", id);
            await db.SaveChangesAsync(); await tx.CommitAsync();
            return Ok(new { id = id.ToString(), message = "Đã nhập toàn bộ vật tư quyên góp vào kho." });
        }
        finally { InventoryGate.Lock.Release(); }
    }

    [HttpPut("{id:int}/reject"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Reject(int id, RejectBody body)
    {
        var d = await db.Donations.FindAsync(id) ?? throw new ApiException(404, "Không tìm thấy quyên góp.");
        if (d.Status != "Pending") throw new ApiException(409, "Quyên góp đã được xử lý.");
        d.RejectReason = WorkflowSupport.Text(body.Reason, "Lý do", 2000); d.Status = "Rejected"; d.ReviewedAt = DateTime.UtcNow; d.ReviewedBy = CurrentUserId;
        WorkflowSupport.Notify(db, d.DonorId, "Quyên góp chưa được tiếp nhận", d.RejectReason, "DonationRejected");
        WorkflowSupport.Audit(db, CurrentUserId, "Reject", "Donation", id);
        await db.SaveChangesAsync(); return Ok(new { id = id.ToString(), message = "Đã từ chối quyên góp." });
    }
}
