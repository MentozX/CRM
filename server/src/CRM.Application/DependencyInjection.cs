using CRM.Application.Clients;
using CRM.Application.Reservations;
using Microsoft.Extensions.DependencyInjection;

namespace CRM.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IClientService, ClientService>();
        services.AddScoped<IReservationService, ReservationService>();

        // TODO: register application services (MediatR, validators, domain services).
        return services;
    }
}
