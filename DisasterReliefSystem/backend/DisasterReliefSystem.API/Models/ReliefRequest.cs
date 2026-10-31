using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DisasterReliefSystem.API.Models;

public class ReliefRequest
{
   
    public int RequestId { get; set; }

    public int RequesterId { get; set; }

   
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

 
    public string? Priority { get; set; }

    public byte Status { get; set; }


    public string? Location { get; set; }

 
    public decimal Latitude { get; set; }


    public decimal Longitude { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string Region { get; set; } = string.Empty;
    public int EmergencyLevel { get; set; } = 1;
    public int AffectedPeople { get; set; } = 1;
    public string ContactPhone { get; set; } = string.Empty;
    public bool NeedFood { get; set; }
    public bool NeedWater { get; set; }
    public bool NeedMedicine { get; set; }
    public bool NeedBlanket { get; set; }
    public bool NeedShelter { get; set; }
    public int? FoodQuantity { get; set; }
    public int? WaterQuantity { get; set; }
    public int? MedicineQuantity { get; set; }
    public int? BlanketQuantity { get; set; }
    public int? ShelterQuantity { get; set; }
    public int? TargetHeadcount { get; set; }
    public string? ReviewNote { get; set; }
    public string? PhotoDataUrl { get; set; }
    public string? InventoryIssuesJson { get; set; }

    public virtual Requester Requester { get; set; } = null!;

    public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();

    public virtual ICollection<RequestSupply> RequestSupplies { get; set; } = new List<RequestSupply>();
}
