using DisasterReliefSystem.API.Models;

namespace DisasterReliefSystem.API.Repositories.Interfaces
{
    public interface ISupplyRepository
        : IGenericRepository<Supply>
    {
        Task<IEnumerable<Supply>> GetByCategoryAsync(string category);
    }
}