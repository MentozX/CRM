using CRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM.Infrastructure.Data.Configurations;

public class ClientConfiguration : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(256);
        builder.Property(x => x.Notes).HasMaxLength(2000);
        builder.Property(x => x.Street).HasMaxLength(200);
        builder.Property(x => x.City).HasMaxLength(120);
        builder.Property(x => x.PostalCode).HasMaxLength(12);

        builder.HasIndex(x => x.Phone).IsUnique(false);
        builder.HasIndex(x => x.Email).IsUnique(false);
    }
}
