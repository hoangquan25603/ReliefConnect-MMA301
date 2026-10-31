using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;

namespace DisasterReliefSystem.API.Repositories
{
    public class RequesterRepository
        : GenericRepository<Requester>, IRequesterRepository
    {
        public RequesterRepository(AppDbContext context)
            : base(context)
        {
        }
    }
}