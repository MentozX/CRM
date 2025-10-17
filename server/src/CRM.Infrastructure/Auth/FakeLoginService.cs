using CRM.Application.Auth;
using CRM.Application.Services;
using CRM.Domain.Enums;
using Microsoft.Extensions.Configuration;

namespace CRM.Infrastructure.Auth;

internal sealed class FakeLoginService(IClock clock, IConfiguration configuration) : ILoginService
{
    private readonly string _adminEmail = configuration["Auth:AdminEmail"] ?? "admin@crm.local";
    private readonly string _adminPassword = configuration["Auth:AdminPassword"] ?? "admin123";

    public Task<LoginResult> LoginAsync(string email, string password, string ipAddress, CancellationToken cancellationToken = default)
    {
        if (!string.Equals(email, _adminEmail, StringComparison.OrdinalIgnoreCase) || password != _adminPassword)
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        return Task.FromResult(CreateResult(email, UserRole.Administrator));
    }

    public Task<LoginResult> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        // In MVP environment tokens are not persisted; simply issue a new pair.
        return Task.FromResult(CreateResult(_adminEmail, UserRole.Administrator));
    }

    private LoginResult CreateResult(string email, UserRole role)
    {
        var expiresAt = clock.UtcNow.AddHours(1);
        return new LoginResult(
            AccessToken: Guid.NewGuid().ToString("N"),
            RefreshToken: Guid.NewGuid().ToString("N"),
            ExpiresAtUtc: expiresAt,
            Email: email,
            Role: role.ToString());
    }
}
