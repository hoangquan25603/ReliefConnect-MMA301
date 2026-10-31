using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;

namespace DisasterReliefSystem.API.Repositories
{
    public class NotificationRepository
        : GenericRepository<Notification>, INotificationRepository
    {
        public NotificationRepository(AppDbContext context)
            : base(context)
        {
        }
    }
}