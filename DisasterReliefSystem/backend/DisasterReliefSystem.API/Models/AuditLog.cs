using System.ComponentModel.DataAnnotations;

namespace DisasterReliefSystem.API.Models;

public class AuditLog
{
   
    public int AuditId { get; set; }

    public int UserId { get; set; }

    
   
    public string Action { get; set; } = string.Empty;

  
    public string Entity { get; set; } = string.Empty;

    public int EntityId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}