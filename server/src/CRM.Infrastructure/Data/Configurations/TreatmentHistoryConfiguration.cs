using CRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM.Infrastructure.Data.Configurations;

public class TreatmentHistoryConfiguration : IEntityTypeConfiguration<TreatmentHistory>
{
    public void Configure(EntityTypeBuilder<TreatmentHistory> builder)
    {
        builder.Property(x => x.Notes).HasMaxLength(2000);
        builder.Property(x => x.PriceOverride).HasPrecision(18, 2);

        builder.HasOne(x => x.Client)
            .WithMany(x => x.TreatmentHistory)
            .HasForeignKey(x => x.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Treatment)
            .WithMany(x => x.TreatmentHistory)
            .HasForeignKey(x => x.TreatmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
