namespace CRM.Application.Services;

public interface IClock
{
    DateTime UtcNow { get; }
    DateOnly Today { get; }
}
