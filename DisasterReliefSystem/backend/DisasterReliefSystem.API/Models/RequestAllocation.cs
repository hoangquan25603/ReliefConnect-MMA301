namespace DisasterReliefSystem.API.Models;

// Separate from requested quantities: records exact stock reserved at approval for safe cancellation.
public class RequestAllocation
{
    public int Id { get; set; }
    public int RequestId { get; set; }
    public int InventoryId { get; set; }
    public int Quantity { get; set; }
    public bool Returned { get; set; }
}
