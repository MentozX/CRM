using CRM.Domain.Enums;

namespace CRM.Domain.Entities;

public sealed class SmsNotification : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client? Client { get; set; }

    public Guid? ReservationId { get; set; }
    public Reservation? Reservation { get; set; }

    public required string Phone { get; set; }
    public required string Message { get; set; }
    public NotificationType Type { get; set; }
    public NotificationStatus Status { get; set; } = NotificationStatus.Pending;
    public DateTime ScheduledAtUtc { get; set; }
    public DateTime? SentAtUtc { get; set; }
    public string? Error { get; set; }
}
