using System.ComponentModel.DataAnnotations;

namespace DisasterReliefSystem.API.Models;

public class Donation
{
    public int Id { get; set; }
    public int DonorId { get; set; }
    public User Donor { get; set; } = null!;
    [MaxLength(2000)] public string Note { get; set; } = "";
    [MaxLength(20)] public string Status { get; set; } = "Pending";
    [MaxLength(2000)] public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public int? ReviewedBy { get; set; }
    public List<DonationItem> Items { get; set; } = [];
}

public class DonationItem
{
    public int Id { get; set; }
    public int DonationId { get; set; }
    public Donation Donation { get; set; } = null!;
    [MaxLength(200)] public string ItemName { get; set; } = "";
    [MaxLength(50)] public string Unit { get; set; } = "";
    public int Quantity { get; set; }
    public int? InventoryItemId { get; set; }
}

public class RoleUpgradeRequest
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    [MaxLength(30)] public string CurrentRoleName { get; set; } = "";
    [MaxLength(30)] public string RequestedRoleName { get; set; } = "";
    [MaxLength(2000)] public string Reason { get; set; } = "";
    [MaxLength(20)] public string Status { get; set; } = "Pending";
    public int? ReviewedByUserId { get; set; }
    [MaxLength(200)] public string? ReviewedByUserName { get; set; }
    [MaxLength(2000)] public string? ReviewNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
}

public class ContactMessage
{
    public int Id { get; set; }
    [MaxLength(200)] public string FullName { get; set; } = "";
    [MaxLength(254)] public string Email { get; set; } = "";
    [MaxLength(30)] public string PhoneNumber { get; set; } = "";
    [MaxLength(4000)] public string Content { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
