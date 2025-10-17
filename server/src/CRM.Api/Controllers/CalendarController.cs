using CRM.Application.Reservations;
using CRM.Application.Reservations.Dtos;
using CRM.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CalendarController(IReservationService reservationService, ILogger<CalendarController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ReservationCalendarItemDto>>> Get([FromQuery] string? date, CancellationToken cancellationToken)
    {
        var day = ParseDateOrToday(date);
        var reservations = await reservationService.GetForDayAsync(day, cancellationToken);
        return Ok(reservations);
    }

    [HttpPost]
    public async Task<ActionResult<ReservationCalendarItemDto>> Create([FromBody] CreateCalendarReservationRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var day = ParseRequiredDate(request.Date);
            var startTime = ParseRequiredTime(request.StartTime);
            var serviceType = ParseServiceType(request.ServiceType);

            var created = await reservationService.CreateAsync(
                new CreateReservationRequest(
                    request.ClientId,
                    serviceType,
                    day,
                    startTime,
                    request.DurationMinutes,
                    request.Notes),
                cancellationToken);

            return CreatedAtAction(nameof(Get), new { date = created.Date }, created);
        }
        catch (KeyNotFoundException ex)
        {
            logger.LogWarning(ex, "Unable to create reservation for client {ClientId}", request.ClientId);
            return NotFound();
        }
        catch (ArgumentOutOfRangeException ex)
        {
            logger.LogWarning(ex, "Validation error while creating reservation");
            return ValidationProblem(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Reservation conflict for date {Date} at {Time}", request.Date, request.StartTime);
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpGet("range")]
    public async Task<ActionResult<IReadOnlyList<ReservationCalendarItemDto>>> GetRange([FromQuery] string? start, [FromQuery] string? end, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var startDay = string.IsNullOrWhiteSpace(start) ? StartOfWeek(today) : ParseRequiredDate(start);
        var endDay = string.IsNullOrWhiteSpace(end) ? startDay.AddDays(6) : ParseRequiredDate(end);

        if (endDay < startDay)
        {
            return BadRequest(new { message = "Parametr 'end' musi być datą późniejszą niż 'start'." });
        }

        var items = await reservationService.GetForRangeAsync(startDay, endDay, cancellationToken);
        return Ok(items);
    }

    [HttpGet("client/{clientId:guid}")]
    public async Task<ActionResult<ReservationTimelineDto>> GetForClient(Guid clientId, CancellationToken cancellationToken)
    {
        var timeline = await reservationService.GetForClientAsync(clientId, cancellationToken);
        return Ok(timeline);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCalendarReservationRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var serviceType = ParseServiceType(request.ServiceType);
            await reservationService.UpdateAsync(id, new UpdateReservationRequest(serviceType, request.DurationMinutes, request.Notes), cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            logger.LogWarning(ex, "Reservation {ReservationId} not found", id);
            return NotFound();
        }
        catch (ArgumentOutOfRangeException ex)
        {
            logger.LogWarning(ex, "Validation error while updating reservation {ReservationId}", id);
            return ValidationProblem(ex.Message);
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await reservationService.DeleteAsync(id, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            logger.LogWarning(ex, "Reservation {ReservationId} not found", id);
            return NotFound();
        }
    }

    private static DateOnly ParseDateOrToday(string? value)
    {
        if (!string.IsNullOrWhiteSpace(value) && DateOnly.TryParse(value, out var parsed))
        {
            return parsed;
        }

        return DateOnly.FromDateTime(DateTime.Today);
    }

    private static DateOnly ParseRequiredDate(string value)
    {
        if (DateOnly.TryParse(value, out var parsed))
        {
            return parsed;
        }

        throw new ArgumentOutOfRangeException(nameof(value), "Nieprawidłowy format daty.");
    }

    private static TimeOnly ParseRequiredTime(string value)
    {
        if (TimeOnly.TryParse(value, out var parsed))
        {
            return parsed;
        }

        throw new ArgumentOutOfRangeException(nameof(value), "Nieprawidłowy format godziny.");
    }

    private static ReservationServiceType ParseServiceType(string value)
    {
        return value.ToLowerInvariant() switch
        {
            "treatment" or "zabieg" => ReservationServiceType.Treatment,
            "consultation" or "konsultacja" => ReservationServiceType.Consultation,
            _ => throw new ArgumentOutOfRangeException(nameof(value), "Nieprawidłowy typ wizyty.")
        };
    }

    private static DateOnly StartOfWeek(DateOnly date)
    {
        var dayOfWeek = (int)date.DayOfWeek;
        var offset = dayOfWeek == 0 ? 6 : dayOfWeek - 1; // Monday start
        return date.AddDays(-offset);
    }
}

public sealed record CreateCalendarReservationRequest(
    Guid ClientId,
    string ServiceType,
    string Date,
    string StartTime,
    int DurationMinutes,
    string? Notes);

public sealed record UpdateCalendarReservationRequest(
    string ServiceType,
    int DurationMinutes,
    string? Notes);
