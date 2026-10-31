using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Repositories
{
    public class RoleRepository
        : GenericRepository<Role>, IRoleRepository
    {
        public RoleRepository(AppDbContext context)
            : base(context)
        {
        }

        public async Task<Role?> GetByNameAsync(string roleName)
        {
            return await _context.Roles
                .FirstOrDefaultAsync(x => x.RoleName == roleName);
        }
    }
}