namespace CRM.Domain.Entities;

public sealed class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? Payload { get; set; }
    public string? IpAddress { get; set; }
}
