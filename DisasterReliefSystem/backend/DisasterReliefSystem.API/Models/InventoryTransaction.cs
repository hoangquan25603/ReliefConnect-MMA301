using System.ComponentModel.DataAnnotations;

namespace DisasterReliefSystem.API.Models;

public class InventoryTransaction
{
  
    public int TransactionId { get; set; }

    public int InventoryId { get; set; }


    public byte Type { get; set; }

    public int Quantity { get; set; }

    public int ReferenceId { get; set; }

    public string? ReferenceNo { get; set; }
    public string? Note { get; set; }
    public int? CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Inventory Inventory { get; set; } = null!;
}
