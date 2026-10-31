using System.ComponentModel.DataAnnotations.Schema;

namespace DisasterReliefSystem.API.Models;

public class VolunteerSkill
{
    public int VolunteerId { get; set; }

    public int SkillId { get; set; }

    public virtual Volunteer Volunteer { get; set; } = null!;

    public virtual Skill Skill { get; set; } = null!;
}