using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Repositories
{
    public class VolunteerRepository
        : GenericRepository<Volunteer>, IVolunteerRepository
    {
        public VolunteerRepository(AppDbContext context)
            : base(context)
        {
        }

        public async Task<IEnumerable<Volunteer>> GetApprovedAsync()
        {
            return await _context.Volunteers
                .Where(x => x.ApprovalStatus == 1)
                .ToListAsync();
        }

        public async Task<IEnumerable<Volunteer>> GetAvailableAsync()
        {
            return await _context.Volunteers
                .Where(x => x.AvailabilityStatus == 1)
                .ToListAsync();
        }
    }
}