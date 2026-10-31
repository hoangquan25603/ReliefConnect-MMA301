using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DisasterReliefSystem.API.Models;

public class User
{

    public int UserId { get; set; }


    public int RoleId { get; set; }


    public string FullName { get; set; } = string.Empty;


    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;


    public string? Phone { get; set; }


    public string? Address { get; set; }

    public byte Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Role Role { get; set; } = null!;

    public virtual Volunteer? Volunteer { get; set; }

    public virtual Requester? Requester { get; set; }

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}