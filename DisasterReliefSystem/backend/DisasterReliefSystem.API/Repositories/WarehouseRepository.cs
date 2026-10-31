using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Repositories
{
    public class WarehouseRepository
        : GenericRepository<Warehouse>, IWarehouseRepository
    {
        public WarehouseRepository(AppDbContext context)
            : base(context)
        {
        }

        public async Task<IEnumerable<Warehouse>> GetAvailableAsync()
        {
            return await _context.Warehouses
                .Where(x => x.Capacity > 0)
                .ToListAsync();
        }
    }
}