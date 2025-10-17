using CRM.Application.Abstractions;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Linq.Expressions;

namespace CRM.Infrastructure.Repositories;

internal class Repository<TEntity>(CRMDbContext context) : IRepository<TEntity> where TEntity : BaseEntity
{
    private readonly DbSet<TEntity> _set = context.Set<TEntity>();

    public async Task AddAsync(TEntity entity, CancellationToken cancellationToken = default)
    {
        await _set.AddAsync(entity, cancellationToken);
    }

    public Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => _set.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

    public void Remove(TEntity entity) => _set.Remove(entity);

    public void Update(TEntity entity) => _set.Update(entity);

    public async Task<IReadOnlyList<TEntity>> ListAsync(
        Expression<Func<TEntity, bool>>? predicate = null,
        Func<IQueryable<TEntity>, IQueryable<TEntity>>? configureQuery = null,
        CancellationToken cancellationToken = default)
    {
        IQueryable<TEntity> query = _set.AsQueryable();
        if (predicate is not null)
        {
            query = query.Where(predicate);
        }

        if (configureQuery is not null)
        {
            query = configureQuery(query);
        }

        return await query.ToListAsync(cancellationToken);
    }
}
