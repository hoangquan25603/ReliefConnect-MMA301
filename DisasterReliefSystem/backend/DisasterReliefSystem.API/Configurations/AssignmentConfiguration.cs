
using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DisasterReliefSystem.API.Configurations
{
    public class AssignmentConfiguration : IEntityTypeConfiguration<Assignment>
    {
        public void Configure(EntityTypeBuilder<Assignment> builder)
        {
            builder.ToTable("Assignments");

            builder.HasKey(a => a.AssignmentId);

            builder.Property(a => a.AssignedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(a => a.Status)
                .HasDefaultValue((byte)0);

            builder.HasOne(a => a.Volunteer)
                .WithMany(v => v.Assignments)
                .HasForeignKey(a => a.VolunteerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.ReliefRequest)
                .WithMany(r => r.Assignments)
                .HasForeignKey(a => a.RequestId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.User)
                .WithMany(u => u.Assignments)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}