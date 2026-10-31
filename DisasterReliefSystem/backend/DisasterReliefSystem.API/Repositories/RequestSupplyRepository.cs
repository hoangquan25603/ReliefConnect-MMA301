using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Repositories
{
    public class RequestSupplyRepository
        : GenericRepository<RequestSupply>, IRequestSupplyRepository
    {
        public RequestSupplyRepository(AppDbContext context)
            : base(context)
        {
        }

        public async Task<IEnumerable<RequestSupply>> GetByRequestIdAsync(int requestId)
        {
            return await _context.RequestSupplies
                .Where(x => x.RequestId == requestId)
                .ToListAsync();
        }
    }
}