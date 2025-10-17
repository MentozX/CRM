using CRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM.Infrastructure.Data.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.Property(x => x.Action).HasMaxLength(200).IsRequired();
        builder.Property(x => x.EntityName).HasMaxLength(200);
        builder.Property(x => x.Payload).HasMaxLength(4000);
        builder.Property(x => x.IpAddress).HasMaxLength(64);
    }
}
