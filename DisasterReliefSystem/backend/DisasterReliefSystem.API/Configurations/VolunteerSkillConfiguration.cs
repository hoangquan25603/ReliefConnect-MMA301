using DisasterReliefSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DisasterReliefSystem.API.Configurations
{
    public class VolunteerSkillConfiguration : IEntityTypeConfiguration<VolunteerSkill>
    {
        public void Configure(EntityTypeBuilder<VolunteerSkill> builder)
        {
            builder.ToTable("VolunteerSkills");

            builder.HasKey(vs => new { vs.VolunteerId, vs.SkillId });

            builder.HasOne(vs => vs.Volunteer)
                .WithMany(v => v.VolunteerSkills)
                .HasForeignKey(vs => vs.VolunteerId);

            builder.HasOne(vs => vs.Skill)
                .WithMany(s => s.VolunteerSkills)
                .HasForeignKey(vs => vs.SkillId);
        }
    }
}