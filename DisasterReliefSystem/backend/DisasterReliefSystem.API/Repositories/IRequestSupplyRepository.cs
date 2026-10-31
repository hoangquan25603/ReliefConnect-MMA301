using DisasterReliefSystem.API.Models;

namespace DisasterReliefSystem.API.Repositories.Interfaces
{
    public interface IRequestSupplyRepository
        : IGenericRepository<RequestSupply>
    {
        Task<IEnumerable<RequestSupply>> GetByRequestIdAsync(int requestId);
    }
}