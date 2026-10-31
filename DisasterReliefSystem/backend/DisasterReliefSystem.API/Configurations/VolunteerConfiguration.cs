using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DisasterReliefSystem.API.Configurations
{
    public class VolunteerConfiguration : IEntityTypeConfiguration<Volunteer>
    {
        public void Configure(EntityTypeBuilder<Volunteer> builder)
        {
            builder.ToTable("Volunteers");

            builder.HasKey(v => v.VolunteerId);

            builder.HasIndex(v => v.UserId)
                .IsUnique();

            builder.Property(v => v.Experience)
                .HasMaxLength(255);

            builder.Property(v => v.AvailabilityStatus);

            builder.Property(v => v.ApprovalStatus);

            builder.Property(v => v.UpdatedAt);

            builder.Property(v => v.ApprovedAt);

            builder.HasOne(v => v.User)
                .WithOne(u => u.Volunteer)
                .HasForeignKey<Volunteer>(v => v.UserId);

            builder.HasMany(v => v.Assignments)
                .WithOne(a => a.Volunteer)
                .HasForeignKey(a => a.VolunteerId);

            builder.HasMany(v => v.VolunteerSkills)
                .WithOne(vs => vs.Volunteer)
                .HasForeignKey(vs => vs.VolunteerId);
        }
    }
}