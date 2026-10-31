using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DisasterReliefSystem.API.Configurations
{
    public class SupplyConfiguration : IEntityTypeConfiguration<Supply>
    {
        public void Configure(EntityTypeBuilder<Supply> builder)
        {
            builder.ToTable("Supplies");

            builder.HasKey(s => s.SupplyId);

            builder.Property(s => s.SupplyName)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(s => s.Unit)
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(s => s.Category)
                .HasMaxLength(50);

            builder.HasMany(s => s.RequestSupplies)
                .WithOne(rs => rs.Supply)
                .HasForeignKey(rs => rs.SupplyId);

            builder.HasMany(s => s.Inventories)
                .WithOne(i => i.Supply)
                .HasForeignKey(i => i.SupplyId);
        }
    }
}