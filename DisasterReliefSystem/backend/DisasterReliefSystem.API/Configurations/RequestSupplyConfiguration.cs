using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DisasterReliefSystem.API.Configurations
{
    public class RequestSupplyConfiguration : IEntityTypeConfiguration<RequestSupply>
    {
        public void Configure(EntityTypeBuilder<RequestSupply> builder)
        {
            builder.ToTable("RequestSupply");

            builder.HasKey(rs => rs.RequestSupplyId);

            builder.Property(rs => rs.QuantityRequested)
                .IsRequired();

            builder.Property(rs => rs.Status);

            builder.HasOne(rs => rs.ReliefRequest)
                .WithMany(r => r.RequestSupplies)
                .HasForeignKey(rs => rs.RequestId);

            builder.HasOne(rs => rs.Supply)
                .WithMany(s => s.RequestSupplies)
                .HasForeignKey(rs => rs.SupplyId);
        }
    }
}