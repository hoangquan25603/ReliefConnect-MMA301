using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;

namespace DisasterReliefSystem.API.Repositories
{
    public class AssignmentRepository
        : GenericRepository<Assignment>, IAssignmentRepository
    {
        public AssignmentRepository(AppDbContext context)
            : base(context)
        {
        }
    }
}