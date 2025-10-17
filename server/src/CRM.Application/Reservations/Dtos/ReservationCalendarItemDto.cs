using CRM.Domain.Enums;

namespace CRM.Application.Reservations.Dtos;

public sealed record ReservationCalendarItemDto(
    Guid Id,
    Guid ClientId,
    string ClientName,
    string ServiceType,
    Guid? TreatmentId,
    string? TreatmentName,
    string Date,
    string StartTime,
    int DurationMinutes,
    string? Notes);
