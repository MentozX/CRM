using System.Globalization;
using System.Linq;
using CRM.Application.Abstractions;
using CRM.Application.Reservations.Dtos;
using CRM.Domain.Entities;
using CRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CRM.Application.Reservations;

internal sealed class ReservationService(IUnitOfWork unitOfWork) : IReservationService
{
    private const int SlotMinutes = 10;
    private const int MaxDurationMinutes = 120;
    private const int WorkStartMinutes = 8 * 60;
    private const int WorkEndMinutes = 20 * 60;

    public async Task<IReadOnlyList<ReservationCalendarItemDto>> GetForDayAsync(DateOnly day, CancellationToken cancellationToken = default)
    {
        var repository = unitOfWork.Repository<Reservation>();
        var (startUtc, endUtc) = GetUtcRange(day);

        var reservations = await repository.ListAsync(
            r => r.ScheduledAtUtc >= startUtc && r.ScheduledAtUtc < endUtc,
            query => query
                .Include(r => r.Client)
                .Include(r => r.Treatment),
            cancellationToken);

        return reservations
            .OrderBy(r => r.ScheduledAtUtc)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<ReservationCalendarItemDto> CreateAsync(CreateReservationRequest request, CancellationToken cancellationToken = default)
    {
        ValidateRequest(request);

        var reservationRepository = unitOfWork.Repository<Reservation>();
        var clientRepository = unitOfWork.Repository<Client>();

        var client = await clientRepository.GetByIdAsync(request.ClientId, cancellationToken)
            ?? throw new KeyNotFoundException($"Client {request.ClientId} not found");

        var startLocal = DateTime.SpecifyKind(request.Date.ToDateTime(request.StartTime), DateTimeKind.Local);
        var startUtc = startLocal.ToUniversalTime();
        var endUtc = startUtc.AddMinutes(request.DurationMinutes);

        var (dayStartUtc, dayEndUtc) = GetUtcRange(request.Date);
        var sameDayReservations = await reservationRepository.ListAsync(
            r => r.ScheduledAtUtc >= dayStartUtc && r.ScheduledAtUtc < dayEndUtc,
            cancellationToken: cancellationToken);

        if (sameDayReservations.Any(existing => IsOverlapping(existing, startUtc, endUtc)))
        {
            throw new InvalidOperationException("Termin jest już zajęty w tym przedziale czasowym.");
        }

        var entity = new Reservation
        {
            Id = Guid.NewGuid(),
            ClientId = request.ClientId,
            Client = client,
            ServiceType = request.ServiceType,
            ScheduledAtUtc = startUtc,
            DurationMinutes = request.DurationMinutes,
            Status = ReservationStatus.Scheduled,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        };

        await reservationRepository.AddAsync(entity, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(entity);
    }

    public async Task UpdateAsync(Guid id, UpdateReservationRequest request, CancellationToken cancellationToken = default)
    {
        ValidateDuration(request.DurationMinutes);

        var reservationRepository = unitOfWork.Repository<Reservation>();
        var entity = await reservationRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Reservation {id} not found");

        entity.ServiceType = request.ServiceType;
        entity.DurationMinutes = request.DurationMinutes;
        entity.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        entity.UpdatedAtUtc = DateTime.UtcNow;

        reservationRepository.Update(entity);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var reservationRepository = unitOfWork.Repository<Reservation>();
        var entity = await reservationRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Reservation {id} not found");

        reservationRepository.Remove(entity);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<ReservationTimelineDto> GetForClientAsync(Guid clientId, CancellationToken cancellationToken = default)
    {
        var reservationRepository = unitOfWork.Repository<Reservation>();
        var reservations = await reservationRepository.ListAsync(
            r => r.ClientId == clientId,
            query => query.Include(r => r.Treatment).OrderBy(r => r.ScheduledAtUtc),
            cancellationToken);

        var nowUtc = DateTime.UtcNow;
        var upcoming = new List<ReservationClientEntryDto>();
        var past = new List<ReservationClientEntryDto>();

        foreach (var reservation in reservations)
        {
            var entry = MapToClientEntry(reservation);
            if (reservation.ScheduledAtUtc >= nowUtc)
            {
                upcoming.Add(entry);
            }
            else
            {
                past.Add(entry);
            }
        }

        return new ReservationTimelineDto(upcoming, past.OrderByDescending(item => item.Start).ToList());
    }

    private static (DateTime StartUtc, DateTime EndUtc) GetUtcRange(DateOnly day)
    {
        var localStart = DateTime.SpecifyKind(day.ToDateTime(TimeOnly.MinValue), DateTimeKind.Local);
        var localEnd = localStart.AddDays(1);
        return (localStart.ToUniversalTime(), localEnd.ToUniversalTime());
    }

    private static void ValidateRequest(CreateReservationRequest request)
    {
        ValidateDuration(request.DurationMinutes);

        if (request.ServiceType is not ReservationServiceType.Treatment and not ReservationServiceType.Consultation)
        {
            throw new ArgumentOutOfRangeException(nameof(request.ServiceType), "Nieobsługiwany typ wizyty.");
        }

        var startMinutes = request.StartTime.Hour * 60 + request.StartTime.Minute;
        var endMinutes = startMinutes + request.DurationMinutes;

        if (startMinutes < WorkStartMinutes || endMinutes > WorkEndMinutes)
        {
            throw new ArgumentOutOfRangeException(nameof(request.StartTime), "Godzina wizyty musi mieścić się w zakresie 08:00 - 20:00.");
        }
    }

    private static void ValidateDuration(int durationMinutes)
    {
        if (durationMinutes < SlotMinutes || durationMinutes > MaxDurationMinutes || durationMinutes % SlotMinutes != 0)
        {
            throw new ArgumentOutOfRangeException(nameof(durationMinutes), "Czas trwania musi być wielokrotnością 10 minut i nie może przekraczać 120 minut.");
        }
    }

    private static bool IsOverlapping(Reservation existing, DateTime newStartUtc, DateTime newEndUtc)
    {
        var existingStart = existing.ScheduledAtUtc;
        var existingEnd = existingStart.AddMinutes(existing.DurationMinutes);
        return newStartUtc < existingEnd && newEndUtc > existingStart;
    }

    private static ReservationCalendarItemDto MapToDto(Reservation reservation)
    {
        var localStart = reservation.ScheduledAtUtc.ToLocalTime();
        var date = DateOnly.FromDateTime(localStart).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var time = TimeOnly.FromDateTime(localStart).ToString("HH:mm", CultureInfo.InvariantCulture);
        var clientName = reservation.Client is null
            ? string.Empty
            : $"{reservation.Client.FirstName} {reservation.Client.LastName}".Trim();

        return new ReservationCalendarItemDto(
            reservation.Id,
            reservation.ClientId,
            clientName,
            MapServiceType(reservation.ServiceType),
            reservation.TreatmentId,
            reservation.Treatment?.Name,
            date,
            time,
            reservation.DurationMinutes,
            reservation.Notes);
    }

    private static string MapServiceType(ReservationServiceType type) => type switch
    {
        ReservationServiceType.Consultation => "consultation",
        _ => "treatment"
    };

    private static ReservationClientEntryDto MapToClientEntry(Reservation reservation)
    {
        var localStart = reservation.ScheduledAtUtc.ToLocalTime();
        var startIso = localStart.ToString("yyyy-MM-dd'T'HH:mm", CultureInfo.InvariantCulture);
        var serviceLabel = reservation.ServiceType == ReservationServiceType.Treatment
            ? reservation.Treatment?.Name ?? "Zabieg"
            : "Konsultacja";

        return new ReservationClientEntryDto(
            reservation.Id,
            MapServiceType(reservation.ServiceType),
            serviceLabel,
            startIso,
            reservation.DurationMinutes,
            reservation.Status.ToString(),
            reservation.Notes);
    }
}
