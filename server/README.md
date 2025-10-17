# CRM Backend

Minimalny szkielet backendu w .NET 8 dla projektu CRM.

## Wymagania wstępne
- Zainstalowany .NET SDK 8.0 (polecenie `dotnet --list-sdks` powinno zwracać wersję 8.x).
- SQL Server (LocalDB / Express) lub inna baza kompatybilna z EF Core.

## Struktura
```
server/
  src/
    CRM.Api/             # Projekt Web API (endpoints)
    CRM.Application/     # Kontrakty i logika aplikacji
    CRM.Domain/          # Encje i logika domenowa
    CRM.Infrastructure/  # EF Core, implementacje repozytoriów, usługi
  tests/
    CRM.Tests/           # Testy jednostkowe (xUnit)
```

## Pierwsze kroki
1. Utwórz solution:
   ```bash
   dotnet new sln -n CRM
   dotnet sln add src/CRM.Domain/CRM.Domain.csproj
   dotnet sln add src/CRM.Application/CRM.Application.csproj
   dotnet sln add src/CRM.Infrastructure/CRM.Infrastructure.csproj
   dotnet sln add src/CRM.Api/CRM.Api.csproj
   dotnet sln add tests/CRM.Tests/CRM.Tests.csproj
   ```
2. Przygotuj migracje bazy:
   ```bash
   dotnet ef migrations add InitialCreate -p src/CRM.Infrastructure/CRM.Infrastructure.csproj -s src/CRM.Api/CRM.Api.csproj
   dotnet ef database update -p src/CRM.Infrastructure/CRM.Infrastructure.csproj -s src/CRM.Api/CRM.Api.csproj
   ```
3. Uruchom API:
   ```bash
   dotnet run --project src/CRM.Api/CRM.Api.csproj
   ```

## Uwierzytelnianie (MVP)
Aktualnie zaimplementowana jest prosta usługa `FakeLoginService`, która przyjmuje dane logowania z konfiguracji (`appsettings.json`). Domyślnie:
- Email: `admin@crm.local`
- Hasło: `admin123`

W przyszłych iteracjach należy zastąpić to pełnoprawną obsługą JWT, hashowaniem haseł, rolami i refresh tokenami zapisanymi w bazie.

## Kolejne kroki
- Dodać migracje oraz konfigurację EF Core (DbContext, seedy).
- Zaimplementować `ILoginService` z obsługą JWT i bazą użytkowników.
- Dodać kontrolery dla klientów, zabiegów, rezerwacji i powiadomień.
- Pokryć logikę testami jednostkowymi i integracyjnymi.
- Przygotować konteneryzację (`Dockerfile`, `docker-compose`).
