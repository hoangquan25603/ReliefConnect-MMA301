using DisasterReliefSystem.API.Models;

namespace DisasterReliefSystem.API.Repositories.Interfaces
{
    public interface IRoleRepository
        : IGenericRepository<Role>
    {
        Task<Role?> GetByNameAsync(string roleName);
    }
}