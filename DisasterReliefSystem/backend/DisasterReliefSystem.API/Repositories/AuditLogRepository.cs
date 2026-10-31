using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;

namespace DisasterReliefSystem.API.Repositories
{
    public class AuditLogRepository
        : GenericRepository<AuditLog>, IAuditLogRepository
    {
        public AuditLogRepository(AppDbContext context)
            : base(context)
        {
        }
    }
}