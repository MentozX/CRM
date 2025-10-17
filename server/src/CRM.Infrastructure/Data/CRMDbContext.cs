using CRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRM.Infrastructure.Data;

public class CRMDbContext(DbContextOptions<CRMDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Treatment> Treatments => Set<Treatment>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<SmsNotification> SmsNotifications => Set<SmsNotification>();
    public DbSet<TreatmentHistory> TreatmentHistory => Set<TreatmentHistory>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CRMDbContext).Assembly);
    }
}
