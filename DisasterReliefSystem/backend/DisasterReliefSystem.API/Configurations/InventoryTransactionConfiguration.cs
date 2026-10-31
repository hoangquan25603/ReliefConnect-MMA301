using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DisasterReliefSystem.API.Configurations
{
    public class InventoryTransactionConfiguration : IEntityTypeConfiguration<InventoryTransaction>
    {
        public void Configure(EntityTypeBuilder<InventoryTransaction> builder)
        {
            builder.ToTable("InventoryTransactions");

            builder.HasKey(it => it.TransactionId);

            builder.Property(it => it.Type)
                .IsRequired();

            builder.Property(it => it.Quantity)
                .IsRequired();

            builder.Property(it => it.ReferenceId);

            builder.Property(it => it.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.HasOne(it => it.Inventory)
                .WithMany(i => i.InventoryTransactions)
                .HasForeignKey(it => it.InventoryId);
        }
    }
}