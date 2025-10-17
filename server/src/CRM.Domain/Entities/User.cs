using CRM.Domain.Enums;

namespace CRM.Domain.Entities;

public sealed class User : BaseEntity
{
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public UserRole Role { get; set; } = UserRole.Employee;
    public DateTime? LastLoginAtUtc { get; set; }
}
