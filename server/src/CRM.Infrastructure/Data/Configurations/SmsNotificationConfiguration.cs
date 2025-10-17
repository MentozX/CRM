using CRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM.Infrastructure.Data.Configurations;

public class SmsNotificationConfiguration : IEntityTypeConfiguration<SmsNotification>
{
    public void Configure(EntityTypeBuilder<SmsNotification> builder)
    {
        builder.Property(x => x.Phone).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Message).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.Error).HasMaxLength(1000);

        builder.HasOne(x => x.Client)
            .WithMany(x => x.Notifications)
            .HasForeignKey(x => x.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Reservation)
            .WithMany(x => x.Notifications)
            .HasForeignKey(x => x.ReservationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => new { x.Type, x.ScheduledAtUtc });
    }
}
