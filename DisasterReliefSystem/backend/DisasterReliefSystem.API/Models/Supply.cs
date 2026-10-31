using System.ComponentModel.DataAnnotations;

namespace DisasterReliefSystem.API.Models;

public class Supply
{
 
    public int SupplyId { get; set; }


    public string SupplyName { get; set; } = string.Empty;


    public string? Unit { get; set; }


    public string? Category { get; set; }

    public virtual ICollection<RequestSupply> RequestSupplies { get; set; } = new List<RequestSupply>();

    public virtual ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();
}