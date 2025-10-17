namespace CRM.Application.Clients.Dtos;

public sealed record ClientDto(
    Guid Id,
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
