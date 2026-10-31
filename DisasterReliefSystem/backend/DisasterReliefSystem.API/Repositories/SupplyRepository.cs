using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Repositories
{
    public class SupplyRepository
        : GenericRepository<Supply>, ISupplyRepository
    {
        public SupplyRepository(AppDbContext context)
            : base(context)
        {
        }

        public async Task<IEnumerable<Supply>> GetByCategoryAsync(string category)
        {
            return await _context.Supplies
                .Where(x => x.Category == category)
                .ToListAsync();
        }
    }
}