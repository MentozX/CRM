using CRM.Domain.Enums;

namespace CRM.Domain.Entities;

public sealed class Reservation : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client? Client { get; set; }

    public Guid? TreatmentId { get; set; }
    public Treatment? Treatment { get; set; }

    public ReservationServiceType ServiceType { get; set; } = ReservationServiceType.Treatment;
    public int DurationMinutes { get; set; }
    public DateTime ScheduledAtUtc { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Scheduled;
    public string? Notes { get; set; }

    public ICollection<SmsNotification> Notifications { get; set; } = new List<SmsNotification>();
}
