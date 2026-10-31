using DisasterReliefSystem.API.Models;

namespace DisasterReliefSystem.API.Repositories.Interfaces
{
    public interface IWarehouseRepository
        : IGenericRepository<Warehouse>
    {
        Task<IEnumerable<Warehouse>> GetAvailableAsync();
    }
}