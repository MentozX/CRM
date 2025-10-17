using System.Collections.Concurrent;
using CRM.Application.Abstractions;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;

namespace CRM.Infrastructure.Repositories;

internal sealed class UnitOfWork(CRMDbContext context) : IUnitOfWork
{
    private readonly ConcurrentDictionary<Type, object> _repositories = new();

    public IRepository<TEntity> Repository<TEntity>() where TEntity : BaseEntity
    {
        var repo = _repositories.GetOrAdd(typeof(TEntity), static (_, ctx) => new Repository<TEntity>(ctx), context);
        return (IRepository<TEntity>)repo;
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => context.SaveChangesAsync(cancellationToken);
}
