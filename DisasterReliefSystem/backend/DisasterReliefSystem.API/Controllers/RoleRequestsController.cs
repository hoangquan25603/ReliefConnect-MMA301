using System.ComponentModel.DataAnnotations;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using DisasterReliefSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[ApiController, Authorize, Route("api/role-requests")]
public class RoleRequestsController(AppDbContext db) : AppController
{
    public record CreateBody([Required] string RequestedRoleName, [Required, StringLength(2000)] string Reason);
    public record RejectBody([Required, StringLength(2000)] string ReviewNote);

    [HttpPost]
    public async Task<IActionResult> Create(CreateBody body)
    {
        if (body.RequestedRoleName is not ("Coordinator" or "Organization")) throw new ApiException(400, "Chỉ được đề nghị vai trò điều phối viên hoặc tổ chức.");
        await WorkflowSupport.Gate.WaitAsync();
        try
        {
            var user = await db.Users.Include(u => u.Role).SingleAsync(u => u.UserId == CurrentUserId);
            if (user.Role.RoleName == body.RequestedRoleName || user.Role.RoleName == "Admin") throw new ApiException(400, "Vai trò hiện tại không cần đề nghị này.");
            if (await db.RoleUpgradeRequests.AnyAsync(r => r.UserId == CurrentUserId && r.Status == "Pending")) throw new ApiException(409, "Bạn đã có đề nghị đang chờ duyệt.");
            var r = new RoleUpgradeRequest { UserId = CurrentUserId, CurrentRoleName = user.Role.RoleName, RequestedRoleName = body.RequestedRoleName, Reason = WorkflowSupport.Text(body.Reason, "Lý do", 2000) };
            db.RoleUpgradeRequests.Add(r); await db.SaveChangesAsync(); return StatusCode(201, new { id = r.Id.ToString(), message = "Đã gửi đề nghị nâng quyền." });
        }
        finally { WorkflowSupport.Gate.Release(); }
    }
    [HttpGet("my")]
    public async Task<IActionResult> My() => Ok((await db.RoleUpgradeRequests.Include(r => r.User).Where(r => r.UserId == CurrentUserId).OrderByDescending(r => r.CreatedAt).ToListAsync()).Select(WorkflowSupport.RoleRequestDto));
    [HttpGet("/api/admin/role-requests"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> List(string? status = "Pending", int pageNumber = 1, int pageSize = 20)
    {
        var q = db.RoleUpgradeRequests.Include(r => r.User).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(r => r.Status == status);
        return Ok(Page((await q.OrderBy(r => r.CreatedAt).ToListAsync()).Select(WorkflowSupport.RoleRequestDto), pageNumber, pageSize));
    }
    [HttpPut("/api/admin/role-requests/{id:int}/approve"), Authorize(Roles = "Admin")]
    public Task<IActionResult> Approve(int id) => Review(id, null, true);
    [HttpPut("/api/admin/role-requests/{id:int}/reject"), Authorize(Roles = "Admin")]
    public Task<IActionResult> Reject(int id, RejectBody body) => Review(id, WorkflowSupport.Text(body.ReviewNote, "Lý do", 2000), false);

    private async Task<IActionResult> Review(int id, string? note, bool approve)
    {
        await WorkflowSupport.Gate.WaitAsync();
        try
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            var r = await db.RoleUpgradeRequests.Include(r => r.User).SingleOrDefaultAsync(r => r.Id == id) ?? throw new ApiException(404, "Không tìm thấy đề nghị.");
            if (r.Status != "Pending") throw new ApiException(409, "Đề nghị đã được xử lý.");
            if (approve)
            {
                if (await db.Assignments.AnyAsync(a => a.Volunteer.UserId == r.UserId && a.Status < 3)) throw new ApiException(409, "Tài khoản đang có nhiệm vụ chưa hoàn thành; hãy xử lý nhiệm vụ trước khi đổi vai trò.");
                r.User.RoleId = (await db.Roles.SingleAsync(role => role.RoleName == r.RequestedRoleName)).RoleId;
            }
            r.Status = approve ? "Approved" : "Rejected"; r.ReviewNote = note; r.ReviewedAt = DateTime.UtcNow;
            r.ReviewedByUserId = CurrentUserId; r.ReviewedByUserName = (await db.Users.SingleAsync(u => u.UserId == CurrentUserId)).FullName;
            WorkflowSupport.Notify(db, r.UserId, approve ? "Đề nghị nâng quyền được duyệt" : "Đề nghị nâng quyền bị từ chối", note ?? $"Vai trò mới: {r.RequestedRoleName}. Vui lòng đăng nhập lại.", approve ? "RoleApproved" : "RoleRejected");
            WorkflowSupport.Audit(db, CurrentUserId, r.Status, "RoleUpgradeRequest", id);
            await db.SaveChangesAsync(); await tx.CommitAsync();
            return Ok(new { id = id.ToString(), message = "Đã xét duyệt đề nghị." });
        }
        finally { WorkflowSupport.Gate.Release(); }
    }
}
