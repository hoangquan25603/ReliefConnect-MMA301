using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DisasterReliefSystem.API.Configurations
{
    public class ReliefRequestConfiguration : IEntityTypeConfiguration<ReliefRequest>
    {
        public void Configure(EntityTypeBuilder<ReliefRequest> builder)
        {
            builder.ToTable("ReliefRequests");

            builder.HasKey(r => r.RequestId);

            builder.Property(r => r.Title)
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(r => r.Description)
                .HasColumnType("TEXT");

            builder.Property(r => r.Priority)
                .HasMaxLength(20);

            builder.Property(r => r.Location)
                .HasMaxLength(255);

            builder.Property(r => r.Latitude)
                .HasColumnType("decimal(10,7)");

            builder.Property(r => r.Longitude)
                .HasColumnType("decimal(10,7)");

            builder.Property(r => r.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.HasOne(r => r.Requester)
                .WithMany(req => req.ReliefRequests)
                .HasForeignKey(r => r.RequesterId);

            builder.HasMany(r => r.Assignments)
                .WithOne(a => a.ReliefRequest)
                .HasForeignKey(a => a.RequestId);

            builder.HasMany(r => r.RequestSupplies)
                .WithOne(rs => rs.ReliefRequest)
                .HasForeignKey(rs => rs.RequestId);
        }
    }
}