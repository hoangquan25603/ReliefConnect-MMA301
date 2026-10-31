using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DisasterReliefSystem.API.Configurations
{
    public class RequesterConfiguration : IEntityTypeConfiguration<Requester>
    {
        public void Configure(EntityTypeBuilder<Requester> builder)
        {
            builder.ToTable("Requesters");

            builder.HasKey(r => r.RequesterId);

            builder.HasIndex(r => r.UserId)
                .IsUnique();

            builder.HasOne(r => r.User)
                .WithOne(u => u.Requester)
                .HasForeignKey<Requester>(r => r.UserId);

            builder.HasMany(r => r.ReliefRequests)
                .WithOne(rr => rr.Requester)
                .HasForeignKey(rr => rr.RequesterId);
        }
    }
}