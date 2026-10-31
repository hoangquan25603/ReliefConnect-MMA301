using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;

namespace DisasterReliefSystem.API.Repositories
{
    public class InventoryTransactionRepository
        : GenericRepository<InventoryTransaction>, IInventoryTransactionRepository
    {
        public InventoryTransactionRepository(AppDbContext context)
            : base(context)
        {
        }
    }
}