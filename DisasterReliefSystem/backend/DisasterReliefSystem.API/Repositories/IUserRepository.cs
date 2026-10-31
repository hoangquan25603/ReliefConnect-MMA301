using DisasterReliefSystem.API.Models;

namespace DisasterReliefSystem.API.Repositories.Interfaces
{
    public interface IUserRepository : IGenericRepository<User>
    {
        Task<User?> GetByEmailAsync(string email);

        Task<IEnumerable<User>> GetByRoleAsync(int roleId);
    }
}