using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Repositories
{
    public class UserRepository
        : GenericRepository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context)
            : base(context)
        {
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .Include(x => x.Role)
                .FirstOrDefaultAsync(x => x.Email == email);
        }

        public async Task<IEnumerable<User>> GetByRoleAsync(int roleId)
        {
            return await _context.Users
                .Where(x => x.RoleId == roleId)
                .ToListAsync();
        }
    }
}