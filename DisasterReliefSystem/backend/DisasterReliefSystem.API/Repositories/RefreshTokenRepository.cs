using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Models;
using DisasterReliefSystem.API.Repositories.Interfaces;

namespace DisasterReliefSystem.API.Repositories
{
    public class RefreshTokenRepository
        : GenericRepository<RefreshToken>, IRefreshTokenRepository
    {
        public RefreshTokenRepository(AppDbContext context)
            : base(context)
        {
        }
    }
}