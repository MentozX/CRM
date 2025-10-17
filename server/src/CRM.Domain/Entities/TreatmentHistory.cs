namespace CRM.Domain.Entities;

public sealed class TreatmentHistory : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client? Client { get; set; }

    public Guid TreatmentId { get; set; }
    public Treatment? Treatment { get; set; }

    public DateTime PerformedAtUtc { get; set; }
    public decimal? PriceOverride { get; set; }
    public string? Notes { get; set; }
}
