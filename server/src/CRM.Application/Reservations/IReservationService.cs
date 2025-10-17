using CRM.Application.Reservations.Dtos;
using CRM.Domain.Enums;

namespace CRM.Application.Reservations;

public interface IReservationService
{
    Task<IReadOnlyList<ReservationCalendarItemDto>> GetForDayAsync(DateOnly day, CancellationToken cancellationToken = default);
    Task<ReservationCalendarItemDto> CreateAsync(CreateReservationRequest request, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateReservationRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ReservationTimelineDto> GetForClientAsync(Guid clientId, CancellationToken cancellationToken = default);
}

public sealed record CreateReservationRequest(
    Guid ClientId,
    ReservationServiceType ServiceType,
    DateOnly Date,
    TimeOnly StartTime,
    int DurationMinutes,
    string? Notes);

public sealed record UpdateReservationRequest(
    ReservationServiceType ServiceType,
    int DurationMinutes,
    string? Notes);

public sealed record ReservationTimelineDto(
    IReadOnlyList<ReservationClientEntryDto> Upcoming,
    IReadOnlyList<ReservationClientEntryDto> Past);

public sealed record ReservationClientEntryDto(
    Guid Id,
    string ServiceType,
    string ServiceLabel,
    string Start,
    int DurationMinutes,
    string Status,
    string? Notes);
