using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Repositories
{
    public class VolunteerSkillRepository
        : GenericRepository<VolunteerSkill>, IVolunteerSkillRepository
    {
        public VolunteerSkillRepository(AppDbContext context)
            : base(context)
        {
        }

        public async Task<IEnumerable<VolunteerSkill>> GetByVolunteerAsync(int volunteerId)
        {
            return await _context.VolunteerSkills
                .Where(x => x.VolunteerId == volunteerId)
                .ToListAsync();
        }

        public async Task<IEnumerable<VolunteerSkill>> GetBySkillAsync(int skillId)
        {
            return await _context.VolunteerSkills
                .Where(x => x.SkillId == skillId)
                .ToListAsync();
        }
    }
}