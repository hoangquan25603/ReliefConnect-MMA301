using System.ComponentModel.DataAnnotations;

namespace DisasterReliefSystem.API.Models;

public class Warehouse
{

    public int WarehouseId { get; set; }


    public string WarehouseName { get; set; } = string.Empty;


    public string? Location { get; set; }

    public int Capacity { get; set; }

    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? ContactPhone { get; set; }
    public bool IsActive { get; set; } = true;

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();
}
