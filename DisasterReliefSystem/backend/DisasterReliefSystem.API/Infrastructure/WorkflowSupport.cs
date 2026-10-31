using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;

namespace DisasterReliefSystem.API.Infrastructure;

public static class WorkflowSupport
{
    public static readonly SemaphoreSlim Gate = new(1, 1);
    public static readonly string[] RequestStatuses = ["Pending", "Approved", "Assigned", "InProgress", "Completed", "Cancelled"];
    public static readonly string[] AssignmentStatuses = ["Assigned", "Accepted", "OnTheWay", "Completed", "Cancelled"];
    public static readonly string[] ApprovalStatuses = ["Pending", "Approved", "Rejected"];
    public static bool Active(Assignment a) => a.Status < 3;
    public static string Status(string[] values, byte status) => status < values.Length ? values[status] : values[0];
    public static int Id(string? text) => int.TryParse(text, out var id) && id > 0 ? id : throw new ApiException(400, "ID không hợp lệ.");
    public static string Text(string? value, string name, int max = 2000)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length > max) throw new ApiException(400, $"{name} bắt buộc và tối đa {max} ký tự.");
        return value.Trim();
    }
    public static void Coordinates(decimal latitude, decimal longitude)
    {
        if (latitude is < -90 or > 90 || longitude is < -180 or > 180) throw new ApiException(400, "Tọa độ không hợp lệ.");
    }
    public static void Notify(AppDbContext db, int userId, string title, string content, string type) => db.Notifications.Add(new Notification
    {
        UserId = userId, Title = title, Content = content, Type = type, CreatedAt = DateTime.UtcNow
    });
    public static void Audit(AppDbContext db, int userId, string action, string entity, int id) => db.AuditLogs.Add(new AuditLog
    {
        UserId = userId, Action = action, Entity = entity, EntityId = id, CreatedAt = DateTime.UtcNow
    });
    public static object RequestDto(ReliefRequest r) => new
    {
        id = r.RequestId.ToString(), title = r.Title, description = r.Description ?? "", address = r.Location ?? "",
        r.Region, r.Latitude, r.Longitude, r.EmergencyLevel, r.AffectedPeople, r.ContactPhone,
        r.NeedFood, r.NeedWater, r.NeedMedicine, r.NeedBlanket, r.NeedShelter,
        r.FoodQuantity, r.WaterQuantity, r.MedicineQuantity, r.BlanketQuantity, r.ShelterQuantity, r.PhotoDataUrl,
        status = Status(RequestStatuses, r.Status), r.CreatedAt, r.TargetHeadcount,
        inventoryIssues = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(r.InventoryIssuesJson ?? "[]"),
        suggestedHeadcountMin = r.EmergencyLevel == 3 ? 5 : r.EmergencyLevel == 2 ? 3 : 1,
        suggestedHeadcountMax = r.EmergencyLevel == 3 ? 10 : r.EmergencyLevel == 2 ? 6 : 3
    };
    public static object VolunteerDto(Volunteer v) => new
    {
        id = v.VolunteerId.ToString(), userId = v.UserId.ToString(), v.User.FullName, v.User.Email,
        phoneNumber = v.User.Phone ?? "", v.Address, v.Latitude, v.Longitude, v.ExperienceYears, v.Bio,
        status = Status(ApprovalStatuses, v.ApprovalStatus),
        skills = v.VolunteerSkills.Where(s => !s.Skill.IsDeleted).Select(s => new { id = s.SkillId.ToString(), skillId = s.SkillId.ToString(), name = s.Skill.SkillName })
    };
    public static object AssignmentDto(Assignment a) => new
    {
        id = a.AssignmentId.ToString(), reliefRequestId = a.RequestId.ToString(), reliefRequestTitle = a.ReliefRequest.Title,
        volunteerProfileId = a.VolunteerId.ToString(), volunteerFullName = a.Volunteer.User.FullName,
        assignedByUserId = a.UserId.ToString(), a.AssignedAt, a.AcceptedAt, a.CompletedAt, a.CancelledAt,
        status = Status(AssignmentStatuses, a.Status), a.Note, a.CancellationRequested, a.CancellationReason,
        a.CancellationRequestedAt, a.IsTeamLead, address = a.ReliefRequest.Location, a.ReliefRequest.Region,
        a.ReliefRequest.Latitude, a.ReliefRequest.Longitude, a.ReliefRequest.AffectedPeople,
        a.ReliefRequest.EmergencyLevel, a.ReliefRequest.ContactPhone, a.ReliefRequest.Description,
        progress = a.Status switch { 1 => 25, 2 => 60, 3 => 100, _ => 0 }
    };
    public static object DonationDto(Donation d) => new
    {
        id = d.Id.ToString(), donorId = d.DonorId.ToString(), donorName = d.Donor.FullName, d.Note,
        d.Status, d.RejectReason, d.CreatedAt,
        items = d.Items.Select(i => new { id = i.Id.ToString(), i.ItemName, i.Unit, i.Quantity, inventoryItemId = i.InventoryItemId?.ToString() })
    };
    public static object RoleRequestDto(RoleUpgradeRequest r) => new
    {
        id = r.Id.ToString(), userId = r.UserId.ToString(), userFullName = r.User.FullName, userEmail = r.User.Email,
        r.CurrentRoleName, r.RequestedRoleName, r.Reason, r.Status, reviewedByUserId = r.ReviewedByUserId?.ToString(),
        r.ReviewedByUserName, r.ReviewNote, r.CreatedAt, r.ReviewedAt
    };
}
