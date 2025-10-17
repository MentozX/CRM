namespace CRM.Domain.Entities;

public sealed class Client : BaseEntity
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Phone { get; set; }
    public string? Email { get; set; }
    public DateOnly? BirthDate { get; set; }
    public string? Notes { get; set; }
    public string? Street { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public bool AllowEmail { get; set; }
    public bool AllowSms { get; set; }
    public bool AllowPhoto { get; set; }

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<TreatmentHistory> TreatmentHistory { get; set; } = new List<TreatmentHistory>();
    public ICollection<SmsNotification> Notifications { get; set; } = new List<SmsNotification>();
}
