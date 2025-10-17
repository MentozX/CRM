using CRM.Application.Clients.Dtos;

namespace CRM.Application.Clients;

public interface IClientService
{
    Task<IReadOnlyList<ClientDto>> SearchAsync(string? query, CancellationToken cancellationToken = default);
    Task<ClientDto> CreateAsync(CreateClientRequest request, CancellationToken cancellationToken = default);
    Task<ClientDto> UpdateAsync(Guid id, UpdateClientRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ClientDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed record CreateClientRequest(
    string FirstName,
    string LastName,
    string Phone,
    string? Email,
    DateOnly? BirthDate,
    string? Notes,
    string? Street,
    string? City,
    string? PostalCode,
    bool AllowEmail,
    bool AllowSms,
    bool AllowPhoto);

public sealed record UpdateClientRequest(
    string FirstName,
    string LastName,
    string Phone,
    string? Email,
    DateOnly? BirthDate,
    string? Notes,
    string? Street,
    string? City,
    string? PostalCode,
    bool AllowEmail,
    bool AllowSms,
    bool AllowPhoto);
