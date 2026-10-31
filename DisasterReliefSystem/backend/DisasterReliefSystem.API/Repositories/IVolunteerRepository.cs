using DisasterReliefSystem.API.Models;

namespace DisasterReliefSystem.API.Repositories.Interfaces
{
    public interface IVolunteerRepository
        : IGenericRepository<Volunteer>
    {
        Task<IEnumerable<Volunteer>> GetApprovedAsync();

        Task<IEnumerable<Volunteer>> GetAvailableAsync();
    }
}