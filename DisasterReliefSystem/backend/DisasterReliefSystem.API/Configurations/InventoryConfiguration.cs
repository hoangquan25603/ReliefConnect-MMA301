using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DisasterReliefSystem.API.Configurations
{
    public class InventoryConfiguration : IEntityTypeConfiguration<Inventory>
    {
        public void Configure(EntityTypeBuilder<Inventory> builder)
        {
            builder.ToTable("Inventories");

            builder.HasKey(i => i.InventoryId);

            builder.Property(i => i.Quantity)
                .IsRequired();

            builder.Property(i => i.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.HasOne(i => i.Warehouse)
                .WithMany(w => w.Inventories)
                .HasForeignKey(i => i.WarehouseId);

            builder.HasOne(i => i.Supply)
                .WithMany(s => s.Inventories)
                .HasForeignKey(i => i.SupplyId);

            builder.HasMany(i => i.InventoryTransactions)
                .WithOne(it => it.Inventory)
                .HasForeignKey(it => it.InventoryId);
        }
    }
}