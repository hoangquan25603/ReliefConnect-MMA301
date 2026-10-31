using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Repositories
{
    public class SkillRepository
        : GenericRepository<Skill>, ISkillRepository
    {
        public SkillRepository(AppDbContext context)
            : base(context)
        {
        }

        public async Task<Skill?> GetByNameAsync(string skillName)
        {
            return await _context.Skills
                .FirstOrDefaultAsync(x => x.SkillName == skillName);
        }
    }
}