using System.Linq;
using System.Linq.Expressions;
using CRM.Domain.Entities;

namespace CRM.Application.Abstractions;

public interface IRepository<TEntity> where TEntity : BaseEntity
{
    Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TEntity>> ListAsync(
        Expression<Func<TEntity, bool>>? predicate = null,
        Func<IQueryable<TEntity>, IQueryable<TEntity>>? configureQuery = null,
        CancellationToken cancellationToken = default);
    Task AddAsync(TEntity entity, CancellationToken cancellationToken = default);
    void Update(TEntity entity);
    void Remove(TEntity entity);
}

public interface IUnitOfWork
{
    IRepository<TEntity> Repository<TEntity>() where TEntity : BaseEntity;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
