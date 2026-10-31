using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Infrastructure;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext db, IConfiguration configuration, IWebHostEnvironment environment)
    {
        foreach (var name in new[] { "Admin", "Coordinator", "Requester", "Volunteer", "Organization" })
            if (!await db.Roles.AnyAsync(r => r.RoleName == name)) db.Roles.Add(new Role { RoleName = name });
        await db.SaveChangesAsync();
        if (await db.Users.AnyAsync()) return;
        var demo = environment.IsDevelopment() && configuration.GetValue<bool>("SeedDemo");
        var password = demo ? "Relief@123456" : configuration["Bootstrap:Password"];
        var email = demo ? "admin@relief.local" : configuration["Bootstrap:Email"];
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(email)) return;
        Security.ValidatePassword(password);
        var roles = await db.Roles.ToListAsync();
        var accounts = demo ? new[] {
            ("Admin", "admin@relief.local", "Quản trị demo"), ("Coordinator", "warehouse@relief.local", "Quản lý kho demo"),
            ("Requester", "requester@relief.local", "Người yêu cầu demo"), ("Volunteer", "volunteer@relief.local", "Tình nguyện viên demo"),
            ("Organization", "organization@relief.local", "Tổ chức demo") } : [("Admin", email, "Quản trị viên")];
        foreach (var (role, address, name) in accounts)
        {
            var user = new User { RoleId = roles.Single(r => r.RoleName == role).RoleId, FullName = name, Email = address,
                Status = 1, CreatedAt = DateTime.UtcNow, Phone = "0900000000" };
            user.PasswordHash = Security.HashPassword(user, password);
            user.Requester = new Requester { User = user };
            if (role == "Volunteer") user.Volunteer = new Volunteer { User = user, ApprovalStatus = 1, AvailabilityStatus = 1, ApprovedAt = DateTime.UtcNow };
            db.Users.Add(user);
        }
        if (demo)
        {
            var warehouse = new Warehouse { WarehouseName = "Kho cứu trợ Đà Nẵng", Location = "Hải Châu, Đà Nẵng",
                Latitude = 16.0544, Longitude = 108.2022, ContactPhone = "02363888888", IsActive = true, UpdatedAt = DateTime.UtcNow };
            db.Warehouses.Add(warehouse);
            db.Warehouses.Add(new Warehouse { WarehouseName = "Kho tiếp nhận Huế", Location = "Thuận Hóa, Huế",
                Latitude = 16.4637, Longitude = 107.5909, IsActive = true, UpdatedAt = DateTime.UtcNow });
            var seed = new[] { ("Gạo", "kg", "Food", 500, 100), ("Nước uống", "chai", "Water", 600, 100),
                ("Bộ sơ cứu", "bộ", "Medicine", 15, 20), ("Chăn ấm", "cái", "Blanket", 80, 20), ("Lều tạm", "cái", "Shelter", 30, 10) };
            foreach (var (name, unit, category, quantity, minimum) in seed)
            {
                var stock = new Inventory { Warehouse = warehouse, Supply = new Supply { SupplyName = name, Unit = unit, Category = category },
                    Quantity = quantity, MinimumQuantity = minimum, UpdatedAt = DateTime.UtcNow };
                stock.InventoryTransactions.Add(new InventoryTransaction { Type = 0, Quantity = quantity, ReferenceNo = "DEMO-INITIAL", Note = "Dữ liệu minh họa", CreatedAt = DateTime.UtcNow });
                db.Inventories.Add(stock);
            }
            foreach (var name in new[] { "Sơ cứu", "Vận chuyển", "Nấu ăn", "Cứu hộ", "Hậu cần" })
                db.Skills.Add(new Skill { SkillName = name, Description = "Kỹ năng hỗ trợ cứu trợ" });
        }
        await db.SaveChangesAsync();
    }
}
