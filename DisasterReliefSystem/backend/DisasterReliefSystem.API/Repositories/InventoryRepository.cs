using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;

namespace DisasterReliefSystem.API.Repositories
{
    public class InventoryRepository
        : GenericRepository<Inventory>, IInventoryRepository
    {
        public InventoryRepository(AppDbContext context)
            : base(context)
        {
        }
    }
}