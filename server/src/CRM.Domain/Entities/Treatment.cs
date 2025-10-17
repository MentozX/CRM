namespace CRM.Domain.Entities;

public sealed class Treatment : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int DurationMinutes { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<TreatmentHistory> TreatmentHistory { get; set; } = new List<TreatmentHistory>();
}
