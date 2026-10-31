using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DisasterReliefSystem.API.Configurations
{
    public class SkillConfiguration : IEntityTypeConfiguration<Skill>
    {
        public void Configure(EntityTypeBuilder<Skill> builder)
        {
            builder.ToTable("Skills");

            builder.HasKey(s => s.SkillId);

            builder.Property(s => s.SkillName)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(s => s.Description)
                .HasMaxLength(255);

            builder.HasMany(s => s.VolunteerSkills)
                .WithOne(vs => vs.Skill)
                .HasForeignKey(vs => vs.SkillId);
        }
    }
}