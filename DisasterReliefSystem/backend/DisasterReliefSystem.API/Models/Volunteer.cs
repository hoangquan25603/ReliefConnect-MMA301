using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DisasterReliefSystem.API.Models;

public class Volunteer
{

    public int VolunteerId { get; set; }

    public int UserId { get; set; }


    public string? Experience { get; set; }

    public byte AvailabilityStatus { get; set; }

    public byte ApprovalStatus { get; set; }

    public int? ApprovedBy { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string Address { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public int ExperienceYears { get; set; }
    public string? Bio { get; set; }

    public virtual User User { get; set; } = null!;

    public virtual ICollection<VolunteerSkill> VolunteerSkills { get; set; } = new List<VolunteerSkill>();

    public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
