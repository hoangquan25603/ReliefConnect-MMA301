using System.ComponentModel.DataAnnotations;

namespace DisasterReliefSystem.API.Models;

public class Assignment
{
   
    public int AssignmentId { get; set; }

    public int VolunteerId { get; set; }

    public int RequestId { get; set; }

    public int UserId { get; set; }

    public DateTime AssignedAt { get; set; }

    public byte Status { get; set; }

    public DateTime? AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? Note { get; set; }
    public bool CancellationRequested { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime? CancellationRequestedAt { get; set; }
    public bool IsTeamLead { get; set; }

    public virtual Volunteer Volunteer { get; set; } = null!;

    public virtual ReliefRequest ReliefRequest { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
