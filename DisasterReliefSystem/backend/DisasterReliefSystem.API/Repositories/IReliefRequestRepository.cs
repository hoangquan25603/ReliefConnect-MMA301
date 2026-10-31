using DisasterReliefSystem.API.Models;

namespace DisasterReliefSystem.API.Repositories.Interfaces
{
    public interface IReliefRequestRepository
        : IGenericRepository<ReliefRequest>
    {
        Task<IEnumerable<ReliefRequest>> GetByRequesterAsync(int requesterId);

        Task<IEnumerable<ReliefRequest>> GetByStatusAsync(byte status);
    }
}