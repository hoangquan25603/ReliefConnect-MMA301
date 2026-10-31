using System.ComponentModel.DataAnnotations;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using DisasterReliefSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[ApiController, Authorize, Route("api/volunteers")]
public class VolunteersController(AppDbContext db) : AppController
{
    public record ProfileBody([Required, StringLength(255)] string Address, decimal Latitude, decimal Longitude,
        [Range(0, 80)] int ExperienceYears, [StringLength(3000)] string? Bio);
    public record SkillsBody([Required] string[] SkillIds);
    private IQueryable<Volunteer> Profiles() => db.Volunteers.Include(v => v.User).Include(v => v.VolunteerSkills).ThenInclude(s => s.Skill);

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var v = await Profiles().SingleOrDefaultAsync(v => v.UserId == CurrentUserId) ?? throw new ApiException(404, "Chưa có hồ sơ tình nguyện viên.");
        return Ok(WorkflowSupport.VolunteerDto(v));
    }

    [HttpPost("profile"), Authorize(Roles = "Requester,Volunteer,Admin")]
    public async Task<IActionResult> Create(ProfileBody body)
    {
        WorkflowSupport.Coordinates(body.Latitude, body.Longitude);
        if (await db.Volunteers.AnyAsync(v => v.UserId == CurrentUserId)) throw new ApiException(409, "Hồ sơ đã tồn tại.");
        var v = new Volunteer { UserId = CurrentUserId, ApprovalStatus = 0 };
        Apply(v, body);
        db.Volunteers.Add(v);
        await db.SaveChangesAsync();
        return StatusCode(201, new { id = v.VolunteerId.ToString(), message = "Đã gửi hồ sơ chờ quản trị viên duyệt." });
    }

    [HttpPut("profile"), Authorize(Roles = "Requester,Volunteer,Admin")]
    public async Task<IActionResult> Update(ProfileBody body)
    {
        WorkflowSupport.Coordinates(body.Latitude, body.Longitude);
        var v = await db.Volunteers.SingleOrDefaultAsync(v => v.UserId == CurrentUserId) ?? throw new ApiException(404, "Chưa có hồ sơ.");
        Apply(v, body);
        if (v.ApprovalStatus == 2) v.ApprovalStatus = 0;
        await db.SaveChangesAsync();
        return Ok(new { id = v.VolunteerId.ToString(), message = "Đã lưu hồ sơ." });
    }

    private static void Apply(Volunteer v, ProfileBody b)
    {
        v.Address = WorkflowSupport.Text(b.Address, "Địa chỉ", 255); v.Latitude = b.Latitude; v.Longitude = b.Longitude;
        v.ExperienceYears = b.ExperienceYears; v.Bio = b.Bio?.Trim(); v.UpdatedAt = DateTime.UtcNow;
    }

    [HttpPost("skills")]
    public async Task<IActionResult> AddSkills(SkillsBody body)
    {
        if (body.SkillIds.Length is < 1 or > 100) throw new ApiException(400, "Chọn từ 1 đến 100 kỹ năng.");
        var v = await db.Volunteers.Include(v => v.VolunteerSkills).SingleOrDefaultAsync(v => v.UserId == CurrentUserId) ?? throw new ApiException(404, "Chưa có hồ sơ.");
        var ids = body.SkillIds.Select(WorkflowSupport.Id).Distinct().ToArray();
        if (await db.Skills.CountAsync(s => ids.Contains(s.SkillId) && !s.IsDeleted) != ids.Length) throw new ApiException(400, "Kỹ năng không tồn tại.");
        var added = ids.Except(v.VolunteerSkills.Select(s => s.SkillId)).ToArray();
        foreach (var id in added) v.VolunteerSkills.Add(new VolunteerSkill { SkillId = id });
        await db.SaveChangesAsync();
        return Ok(new { addedCount = added.Length, message = "Đã cập nhật kỹ năng." });
    }

    [HttpDelete("skills/{id:int}")]
    public async Task<IActionResult> DeleteSkill(int id)
    {
        var skill = await db.VolunteerSkills.SingleOrDefaultAsync(s => s.Volunteer.UserId == CurrentUserId && s.SkillId == id) ?? throw new ApiException(404, "Không tìm thấy kỹ năng trong hồ sơ.");
        db.VolunteerSkills.Remove(skill); await db.SaveChangesAsync();
        return Ok(new { message = "Đã xóa kỹ năng khỏi hồ sơ." });
    }

    [HttpGet("/api/admin/volunteers"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> List() => Ok((await Profiles().OrderBy(v => v.ApprovalStatus).ToListAsync()).Select(WorkflowSupport.VolunteerDto));

    [HttpGet("/api/admin/volunteers/{id:int}"), Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> Detail(int id) => Ok(WorkflowSupport.VolunteerDto(await Profiles().SingleOrDefaultAsync(v => v.VolunteerId == id) ?? throw new ApiException(404, "Không tìm thấy hồ sơ.")));

    [HttpPut("/api/admin/volunteers/{id:int}/approve"), Authorize(Roles = "Admin")]
    public Task<IActionResult> Approve(int id) => Review(id, true);

    [HttpPut("/api/admin/volunteers/{id:int}/reject"), Authorize(Roles = "Admin")]
    public Task<IActionResult> Reject(int id) => Review(id, false);

    private async Task<IActionResult> Review(int id, bool approve)
    {
        var v = await db.Volunteers.Include(v => v.User).ThenInclude(u => u.Role).SingleOrDefaultAsync(v => v.VolunteerId == id) ?? throw new ApiException(404, "Không tìm thấy hồ sơ.");
        if (v.ApprovalStatus != 0) throw new ApiException(409, "Hồ sơ đã được xét duyệt.");
        v.ApprovalStatus = (byte)(approve ? 1 : 2); v.ApprovedAt = DateTime.UtcNow; v.ApprovedBy = CurrentUserId;
        if (approve && v.User.Role.RoleName == "Requester") v.User.RoleId = (await db.Roles.SingleAsync(r => r.RoleName == "Volunteer")).RoleId;
        WorkflowSupport.Notify(db, v.UserId, approve ? "Hồ sơ được duyệt" : "Hồ sơ chưa được duyệt", approve ? "Bạn có thể đăng nhập lại để sử dụng chức năng tình nguyện viên." : "Vui lòng cập nhật hồ sơ để gửi lại.", approve ? "VolunteerApproved" : "VolunteerRejected");
        WorkflowSupport.Audit(db, CurrentUserId, approve ? "Approve" : "Reject", "Volunteer", id);
        await db.SaveChangesAsync(); return Ok(new { message = "Đã xét duyệt hồ sơ." });
    }
}

[ApiController, Route("api/skills")]
public class SkillsController(AppDbContext db) : AppController
{
    public record SkillBody([Required, StringLength(100)] string Name, [StringLength(1000)] string? Description);
    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> List() => Ok(await db.Skills.Where(s => !s.IsDeleted).OrderBy(s => s.SkillName).Select(s => new { id = s.SkillId.ToString(), name = s.SkillName, description = s.Description ?? "" }).ToListAsync());
    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(SkillBody body)
    {
        var name = WorkflowSupport.Text(body.Name, "Tên kỹ năng", 100);
        if (await db.Skills.AnyAsync(s => !s.IsDeleted && s.SkillName.ToLower() == name.ToLower())) throw new ApiException(409, "Kỹ năng đã tồn tại.");
        var s = new Skill { SkillName = name, Description = body.Description?.Trim() };
        db.Skills.Add(s); await db.SaveChangesAsync(); return StatusCode(201, new { id = s.SkillId.ToString(), message = "Đã tạo kỹ năng." });
    }
    [HttpPut("{id:int}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, SkillBody body)
    {
        var s = await db.Skills.SingleOrDefaultAsync(s => s.SkillId == id && !s.IsDeleted) ?? throw new ApiException(404, "Không tìm thấy kỹ năng.");
        var name = WorkflowSupport.Text(body.Name, "Tên kỹ năng", 100);
        if (await db.Skills.AnyAsync(s => s.SkillId != id && !s.IsDeleted && s.SkillName.ToLower() == name.ToLower())) throw new ApiException(409, "Kỹ năng đã tồn tại.");
        s.SkillName = name; s.Description = body.Description?.Trim(); await db.SaveChangesAsync(); return Ok(new { id = id.ToString(), message = "Đã lưu kỹ năng." });
    }
    [HttpDelete("{id:int}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var s = await db.Skills.SingleOrDefaultAsync(s => s.SkillId == id && !s.IsDeleted) ?? throw new ApiException(404, "Không tìm thấy kỹ năng.");
        s.IsDeleted = true; await db.SaveChangesAsync(); return Ok(new { id = id.ToString(), message = "Đã xóa kỹ năng." });
    }
}
