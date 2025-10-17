using System.Collections.Generic;
using System.Linq;
using CRM.Application.Abstractions;
using CRM.Application.Clients.Dtos;
using CRM.Domain.Entities;

namespace CRM.Application.Clients;

internal sealed class ClientService(IUnitOfWork unitOfWork) : IClientService
{
    public async Task<IReadOnlyList<ClientDto>> SearchAsync(string? query, CancellationToken cancellationToken = default)
    {
        var repository = unitOfWork.Repository<Client>();
        IReadOnlyList<Client> clients;

        if (string.IsNullOrWhiteSpace(query))
        {
            clients = await repository.ListAsync(null, cancellationToken: cancellationToken);
        }
        else
        {
            var trimmed = query.Trim();
            clients = await repository.ListAsync(
                c => c.FirstName.Contains(trimmed) ||
                     c.LastName.Contains(trimmed) ||
                     c.Phone.Contains(trimmed) ||
                     (c.Email != null && c.Email.Contains(trimmed)) ||
                     (c.City != null && c.City.Contains(trimmed)) ||
                     (c.Street != null && c.Street.Contains(trimmed)),
                cancellationToken: cancellationToken);
        }

        return clients
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<ClientDto> CreateAsync(CreateClientRequest request, CancellationToken cancellationToken = default)
    {
        var repository = unitOfWork.Repository<Client>();
        var entity = new Client
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            Email = request.Email,
            BirthDate = request.BirthDate,
            Notes = request.Notes,
            Street = request.Street,
            City = request.City,
            PostalCode = request.PostalCode,
            AllowEmail = request.AllowEmail,
            AllowSms = request.AllowSms,
            AllowPhoto = request.AllowPhoto
        };

        await repository.AddAsync(entity, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(entity);
    }

    public async Task<ClientDto> UpdateAsync(Guid id, UpdateClientRequest request, CancellationToken cancellationToken = default)
    {
        var repository = unitOfWork.Repository<Client>();
        var entity = await repository.GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            throw new KeyNotFoundException($"Client {id} not found");
        }

        entity.FirstName = request.FirstName;
        entity.LastName = request.LastName;
        entity.Phone = request.Phone;
        entity.Email = request.Email;
        entity.BirthDate = request.BirthDate;
        entity.Notes = request.Notes;
        entity.Street = request.Street;
        entity.City = request.City;
        entity.PostalCode = request.PostalCode;
        entity.AllowEmail = request.AllowEmail;
        entity.AllowSms = request.AllowSms;
        entity.AllowPhoto = request.AllowPhoto;
        entity.UpdatedAtUtc = DateTime.UtcNow;

        repository.Update(entity);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var repository = unitOfWork.Repository<Client>();
        var entity = await repository.GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            throw new KeyNotFoundException($"Client {id} not found");
        }

        repository.Remove(entity);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<ClientDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var repository = unitOfWork.Repository<Client>();
        var entity = await repository.GetByIdAsync(id, cancellationToken);
        return entity is null ? null : MapToDto(entity);
    }

    private static ClientDto MapToDto(Client client) => new(
        client.Id,
        client.FirstName,
        client.LastName,
        client.Phone,
        client.Email,
        client.BirthDate,
        client.Notes,
        client.Street,
        client.City,
        client.PostalCode,
        client.AllowEmail,
        client.AllowSms,
        client.AllowPhoto);
}
