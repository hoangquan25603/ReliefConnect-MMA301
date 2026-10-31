using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DisasterReliefSystem.API.Configurations
{
    public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> builder)
        {
            builder.ToTable("Notifications");

            builder.HasKey(n => n.NotificationId);

            builder.Property(n => n.Title)
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(n => n.Content)
                .HasColumnType("TEXT");

            builder.Property(n => n.Type)
                .HasMaxLength(50);

            builder.Property(n => n.IsRead)
                .HasDefaultValue(false);

            builder.Property(n => n.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId);
        }
    }
}