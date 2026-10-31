using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DisasterReliefSystem.API.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Users");

            builder.HasKey(u => u.UserId);

            builder.Property(u => u.FullName)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(u => u.Email)
                .HasMaxLength(100)
                .IsRequired();

            builder.HasIndex(u => u.Email)
                .IsUnique();

            builder.Property(u => u.PasswordHash)
                .HasMaxLength(255)
                .IsRequired();

            builder.Property(u => u.Phone)
                .HasMaxLength(20);

            builder.Property(u => u.Address)
                .HasMaxLength(255);

            builder.Property(u => u.Status)
                .HasDefaultValue((byte)1);

            builder.Property(u => u.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(u => u.UpdatedAt);

            builder.HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(u => u.Volunteer)
                .WithOne(v => v.User)
                .HasForeignKey<Volunteer>(v => v.UserId);

            builder.HasOne(u => u.Requester)
                .WithOne(r => r.User)
                .HasForeignKey<Requester>(r => r.UserId);
        }
    }
}