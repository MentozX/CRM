using CRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM.Infrastructure.Data.Configurations;

public class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.Property(x => x.ScheduledAtUtc).IsRequired();
        builder.Property(x => x.DurationMinutes).IsRequired();
        builder.Property(x => x.ServiceType)
            .HasConversion<int>()
            .IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(2000);

        builder.HasOne(x => x.Client)
            .WithMany(x => x.Reservations)
            .HasForeignKey(x => x.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Treatment)
            .WithMany(x => x.Reservations)
            .HasForeignKey(x => x.TreatmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.ScheduledAtUtc);
    }
}
