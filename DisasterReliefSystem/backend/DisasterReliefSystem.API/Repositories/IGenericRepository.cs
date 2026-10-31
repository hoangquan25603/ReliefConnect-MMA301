using System.Linq.Expressions;

namespace DisasterReliefSystem.API.Repositories.Interfaces
{
	public interface IGenericRepository<T> where T : class
	{
		Task<IEnumerable<T>> GetAllAsync();

		Task<T?> GetByIdAsync(int id);

		Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

		Task AddAsync(T entity);

		Task AddRangeAsync(IEnumerable<T> entities);

		void Update(T entity);

		void Delete(T entity);

		void DeleteRange(IEnumerable<T> entities);

        Task<T?> GetByIdAsync(params object[] keyValues);

        Task<bool> ExistsAsync(params object[] keyValues);
    }
}