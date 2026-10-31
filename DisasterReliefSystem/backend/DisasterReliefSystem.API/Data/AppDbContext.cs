using DisasterReliefSystem.API.Configurations;
using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    #region DbSets

    public DbSet<Role> Roles => Set<Role>();

    public DbSet<User> Users => Set<User>();

    public DbSet<Volunteer> Volunteers => Set<Volunteer>();

    public DbSet<Requester> Requesters => Set<Requester>();

    public DbSet<Skill> Skills => Set<Skill>();

    public DbSet<VolunteerSkill> VolunteerSkills => Set<VolunteerSkill>();

    public DbSet<ReliefRequest> ReliefRequests => Set<ReliefRequest>();

    public DbSet<RequestSupply> RequestSupplies => Set<RequestSupply>();

    public DbSet<Assignment> Assignments => Set<Assignment>();

    public DbSet<Warehouse> Warehouses => Set<Warehouse>();

    public DbSet<Supply> Supplies => Set<Supply>();

    public DbSet<Inventory> Inventories => Set<Inventory>();

    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();

    public DbSet<Notification> Notifications => Set<Notification>();

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<DonationItem> DonationItems => Set<DonationItem>();
    public DbSet<RoleUpgradeRequest> RoleUpgradeRequests => Set<RoleUpgradeRequest>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<RequestAllocation> RequestAllocations => Set<RequestAllocation>();

    #endregion

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.Entity<Inventory>().HasIndex(i => new { i.WarehouseId, i.SupplyId }).IsUnique();
        modelBuilder.Entity<Inventory>().Property(i => i.Quantity).IsConcurrencyToken();
        modelBuilder.Entity<Donation>().Property(d => d.Status).IsConcurrencyToken();
        modelBuilder.Entity<ReliefRequest>().Property(r => r.Status).IsConcurrencyToken();
        modelBuilder.Entity<Assignment>().Property(a => a.Status).IsConcurrencyToken();
        modelBuilder.Entity<Volunteer>().Property(v => v.ApprovalStatus).IsConcurrencyToken();
        modelBuilder.Entity<RoleUpgradeRequest>().Property(r => r.Status).IsConcurrencyToken();
        modelBuilder.Entity<Donation>().HasOne(d => d.Donor).WithMany().HasForeignKey(d => d.DonorId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<RoleUpgradeRequest>().HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Restrict);
        base.OnModelCreating(modelBuilder);

        // Apply all Fluent API configurations automatically
       
    }
}
