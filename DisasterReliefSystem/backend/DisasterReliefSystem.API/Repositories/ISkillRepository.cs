using DisasterReliefSystem.API.Models;

namespace DisasterReliefSystem.API.Repositories.Interfaces
{
    public interface ISkillRepository
        : IGenericRepository<Skill>
    {
        Task<Skill?> GetByNameAsync(string skillName);
    }
}