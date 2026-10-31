using System.ComponentModel.DataAnnotations;

namespace DisasterReliefSystem.API.Models;

public class Inventory
{

    public int InventoryId { get; set; }

    public int WarehouseId { get; set; }

    public int SupplyId { get; set; }

    public int Quantity { get; set; }

    public int MinimumQuantity { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Warehouse Warehouse { get; set; } = null!;

    public virtual Supply Supply { get; set; } = null!;

    public virtual ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();
}
