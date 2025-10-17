using CRM.Domain.Entities;
using CRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CRM.Infrastructure.Services;

internal sealed class DatabaseInitializer(IServiceScopeFactory scopeFactory, ILogger<DatabaseInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<Data.CRMDbContext>();

        await context.Database.MigrateAsync(cancellationToken);

        if (!await context.Clients.AnyAsync(cancellationToken))
        {
            logger.LogInformation("Seeding sample clients (100 records)");

            var random = new Random();

            string[] femaleFirstNames =
            {
                "Anna", "Maria", "Katarzyna", "Joanna", "Agnieszka", "Magdalena", "Karolina", "Paulina", "Aleksandra", "Ewa",
                "Natalia", "Weronika", "Dominika", "Monika", "Zuzanna", "Julia", "Justyna", "Marta", "Patrycja", "Sylwia"
            };

            string[] maleFirstNames =
            {
                "Michał", "Jakub", "Mateusz", "Kamil", "Piotr", "Łukasz", "Paweł", "Tomasz", "Adam", "Damian",
                "Bartosz", "Karol", "Rafał", "Szymon", "Wojciech", "Przemysław", "Maciej", "Konrad", "Adrian", "Sebastian"
            };

            string[] lastNames =
            {
                "Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamińska", "Lewandowski", "Zieliński", "Szymański", "Woźniak",
                "Dąbrowski", "Kozłowska", "Jankowska", "Mazur", "Krawczyk", "Piotrowska", "Kaczmarek", "Grabowski", "Pawłowski", "Michalska"
            };

            string[] streetNames =
            {
                "Kwiatowa", "Lipowa", "Akacjowa", "Słoneczna", "Polna", "Szkolna", "Ogrodowa", "Zielona", "Leśna", "Kościuszki",
                "Sosnowa", "Piękna", "Krótka", "Długa", "Wesoła", "Sportowa", "Łąkowa", "Miodowa", "Promienna", "Rynek"
            };

            string[] cityNames =
            {
                "Warszawa", "Kraków", "Poznań", "Gdańsk", "Wrocław", "Katowice", "Łódź", "Lublin", "Rzeszów", "Białystok",
                "Szczecin", "Bydgoszcz", "Toruń", "Opole", "Gdynia", "Sopot", "Gliwice", "Zielona Góra", "Koszalin", "Bielsko-Biała"
            };

            string[] notes =
            {
                "Lubi poranne wizyty i delikatne zabiegi pielęgnacyjne.",
                "Preferuje konsultacje online przed wizytą.",
                "Posiada alergię na lateks – pamiętać przy zabiegach.",
                "Najczęściej wybiera pakiet anti-aging.",
                "Oczekuje powiadomień SMS dzień przed wizytą.",
                "Zainteresowana programem lojalnościowym.",
                "Klient VIP – konsultacje z dr Kowalską.",
                "Preferuje płatności kartą i wizyty popołudniowe."
            };

            var clients = new List<Client>(100);

            for (var i = 0; i < 100; i++)
            {
                var isFemale = random.NextDouble() > 0.5;
                var firstName = isFemale
                    ? femaleFirstNames[random.Next(femaleFirstNames.Length)]
                    : maleFirstNames[random.Next(maleFirstNames.Length)];
                var lastName = lastNames[random.Next(lastNames.Length)];

                var phone = $"+48 {random.Next(100, 999)} {random.Next(100, 999)} {random.Next(100, 999)}";
                var email = $"{firstName.ToLower().Replace("ł", "l")}.{lastName.ToLower().Replace("ł", "l")}{random.Next(10, 99)}@example.com";

                var birthYear = random.Next(1965, 2004);
                var birthMonth = random.Next(1, 13);
                var birthDay = random.Next(1, DateTime.DaysInMonth(birthYear, birthMonth) + 1);

                var street = streetNames[random.Next(streetNames.Length)];
                var houseNumber = random.Next(1, 120);
                var city = cityNames[random.Next(cityNames.Length)];
                var postalCode = $"{random.Next(10, 99)}-{random.Next(100, 999)}";

                clients.Add(new Client
                {
                    Id = Guid.NewGuid(),
                    FirstName = firstName,
                    LastName = lastName,
                    Phone = phone,
                    Email = email,
                    BirthDate = new DateOnly(birthYear, birthMonth, birthDay),
                    Notes = notes[random.Next(notes.Length)],
                    Street = $"ul. {street} {houseNumber}",
                    City = city,
                    PostalCode = postalCode,
                    AllowEmail = random.NextDouble() > 0.2,
                    AllowSms = random.NextDouble() > 0.1,
                    AllowPhoto = random.NextDouble() > 0.6
                });
            }

            await context.Clients.AddRangeAsync(clients, cancellationToken);
            await context.SaveChangesAsync(cancellationToken);
        }

        if (!await context.Treatments.AnyAsync(cancellationToken))
        {
            logger.LogInformation("Seeding treatments");

            var treatments = new[]
            {
                new Treatment { Id = Guid.NewGuid(), Name = "Mezoterapia igłowa", Description = "Seria zastrzyków rewitalizujących skórę.", Price = 350m, DurationMinutes = 60 },
                new Treatment { Id = Guid.NewGuid(), Name = "Peeling chemiczny", Description = "Delikatny peeling kwasowy", Price = 220m, DurationMinutes = 45 },
                new Treatment { Id = Guid.NewGuid(), Name = "Botoks", Description = "Redukcja zmarszczek mimicznych", Price = 500m, DurationMinutes = 40 },
                new Treatment { Id = Guid.NewGuid(), Name = "Laser frakcyjny", Description = "Zabieg regeneracyjny skóry", Price = 650m, DurationMinutes = 75 },
                new Treatment { Id = Guid.NewGuid(), Name = "Endermologia", Description = "Zabieg modelujący sylwetkę", Price = 180m, DurationMinutes = 50 }
            };

            await context.Treatments.AddRangeAsync(treatments, cancellationToken);
            await context.SaveChangesAsync(cancellationToken);
        }

        if (!await context.Reservations.AnyAsync(cancellationToken))
        {
            logger.LogInformation("Seeding reservations for current month");

            var clients = await context.Clients.ToListAsync(cancellationToken);
            var treatments = await context.Treatments.ToListAsync(cancellationToken);
            if (clients.Count == 0 || treatments.Count == 0)
            {
                logger.LogWarning("Skipping reservation seeding due to missing clients or treatments.");
                return;
            }

            var random = new Random();
            var today = DateTime.Today;
            var endOfMonth = new DateTime(today.Year, today.Month, DateTime.DaysInMonth(today.Year, today.Month));
            var hours = new[] { 9, 11, 13, 15, 17 };

            var reservations = new List<Reservation>();

            for (var date = today; date <= endOfMonth; date = date.AddDays(1))
            {
                var count = random.Next(3, 5); // 3 lub 4 wizyty dziennie
                var shuffledHours = hours.OrderBy(_ => random.Next()).Take(count).ToArray();

                foreach (var hour in shuffledHours)
                {
                    var minute = random.Next(0, 2) * 30;
                    var scheduledLocal = new DateTime(date.Year, date.Month, date.Day, hour, minute, 0, DateTimeKind.Local);
                    var scheduledUtc = scheduledLocal.ToUniversalTime();

                    var client = clients[random.Next(clients.Count)];
                    var serviceType = random.NextDouble() > 0.3 ? ReservationServiceType.Treatment : ReservationServiceType.Consultation;
                    var treatment = serviceType == ReservationServiceType.Treatment
                        ? treatments[random.Next(treatments.Count)]
                        : null;
                    var duration = serviceType == ReservationServiceType.Treatment && treatment is not null
                        ? treatment.DurationMinutes
                        : (random.Next(3, 7) * 10); // 30-60 minut

                    reservations.Add(new Reservation
                    {
                        Id = Guid.NewGuid(),
                        ClientId = client.Id,
                        TreatmentId = treatment?.Id,
                        ServiceType = serviceType,
                        DurationMinutes = duration,
                        ScheduledAtUtc = scheduledUtc,
                        Status = Domain.Enums.ReservationStatus.Scheduled,
                        Notes = random.NextDouble() > 0.7 ? "Lista oczekujących" : null
                    });
                }
            }

            await context.Reservations.AddRangeAsync(reservations, cancellationToken);
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
