using CRM.Application.Abstractions;
using CRM.Application.Auth;
using CRM.Application.Services;
using CRM.Infrastructure.Data;
using CRM.Infrastructure.Auth;
using CRM.Infrastructure.Repositories;
using CRM.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CRM.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<CRMDbContext>(options =>
        {
            var connectionString = configuration.GetConnectionString("Database") ??
                throw new InvalidOperationException("Connection string 'Database' is not configured.");

            options.UseSqlServer(connectionString);
        });

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IClock, SystemClock>();
        services.AddScoped<ILoginService, FakeLoginService>();
        services.AddHostedService<Services.DatabaseInitializer>();

        return services;
    }
}
