# CRM – plan projektu

## 1. Cel i zakres
- Webowa aplikacja CRM dla branży medycyny estetycznej z możliwością dalszej rozbudowy na inne usługi.
- Obsługa klientów, zabiegów, rezerwacji oraz powiadomień SMS.
- Autoryzacja użytkowników z rolami (administrator, pracownik).
- Backend w .NET, frontend w React/TypeScript, baza danych SQL.

## 2. Architektura systemu
- **Frontend**: React + TypeScript (Vite). Warstwa UI komunikuje się z API za pomocą REST.
- **Backend**: .NET 8 Web API (warstwowa architektura: Application, Domain, Infrastructure, Api).
- **Baza danych**: Relacyjna (SQL Server lub PostgreSQL) z wykorzystaniem Entity Framework Core.
- **Powiadomienia SMS**: Abstrakcyjna usługa (adapter) + możliwość integracji z zewnętrznym API. W fazie MVP – symulacja wysyłki i logowanie wiadomości.
- **Zadania cykliczne**: Hosted Services / Hangfire/Quartz (np. przypomnienia o wizytach, życzenia urodzinowe).

Diagram logiczny (wysoki poziom):
```
┌───────────┐      HTTPS/JSON      ┌──────────────┐        ┌───────────────┐
│  Frontend │ ───────────────────▶ │  API (.NET)  │ ─────▶ │  Database SQL │
└───────────┘                      │  + Background │        └───────────────┘
        ▲                          │  Services     │
        │                          └──────────────┘
        │ REST                                   │
        └────────────────────────────────────────┘
                SMS provider (adapter / stub)
```

## 3. Struktura repozytorium (docelowo)
```
/docs                 – dokumentacja projektowa
/web                  – frontend React (istniejący)
/server               – rozwiązanie .NET
  CRM.sln
  /src
    /CRM.Api          – projekt Web API
    /CRM.Application  – logika aplikacyjna (CQRS, usługi)
    /CRM.Domain       – encje domenowe, interfejsy repozytoriów
    /CRM.Infrastructure – EF Core, implementacje repozytoriów, integracje
  /tests
    /CRM.Tests        – testy jednostkowe/integracyjne
```

## 4. Model danych (zarys)
Tabela | Pola kluczowe
------ | -------------
`Users` | `Id`, `Email`, `PasswordHash`, `Role`, `CreatedAt`, `LastLogin`
`Clients` | `Id`, `FirstName`, `LastName`, `Phone`, `Email`, `BirthDate`, `Notes`, `CreatedAt`
`Treatments` | `Id`, `Name`, `Description`, `Price`, `DurationMinutes`, `IsActive`
`Reservations` | `Id`, `ClientId`, `TreatmentId`, `ScheduledAt` (datetime), `Status`, `Notes`
`ReservationServices` | (opcjonalnie przy relacji wiele-wiele)
`SmsNotifications` | `Id`, `ClientId`, `Type`, `Phone`, `Message`, `ScheduledAt`, `SentAt`, `Status`
`TreatmentHistory` | `Id`, `ClientId`, `TreatmentId`, `PerformedAt`, `Notes`
`AuditLogs` | `Id`, `UserId`, `Action`, `Entity`, `EntityId`, `Timestamp`, `Payload`

Relacje:
- Klient ma wiele rezerwacji i powiadomień, wiele wpisów historii zabiegów.
- Rezerwacja wskazuje na klienta i zabieg (lub listę zabiegów).
- Powiadomienia odwołują się do klienta i potencjalnie rezerwacji.

## 5. Moduły backend
1. **Autoryzacja i uwierzytelnianie**
   - JWT (Access + Refresh), hashowanie haseł (BCrypt), zarządzanie rolami.
   - Endpointy: `/api/auth/login`, `/api/auth/refresh`, `/api/users` (admin-only).
2. **Klienci**
   - CRUD, filtrowanie po imieniu/nazwisku/telefonie, paginacja.
   - Endpointy: `/api/clients`, `/api/clients/{id}`.
3. **Zabiegi**
   - CRUD, oznaczanie aktywności.
   - Endpointy: `/api/treatments`.
4. **Rezerwacje**
   - Tworzenie i edycja z walidacją kolizji terminów.
   - Endpointy: `/api/reservations`, `/api/reservations/{id}/status`.
5. **Powiadomienia SMS**
   - Scheduler + log wysyłek. Wersja MVP: generowanie wpisów bez realnej integracji.
   - Endpointy: `/api/notifications`, `/api/notifications/{id}/resend`.
6. **Raportowanie/Audyty (faza 2)**
   - Przegląd logów, raporty KPI.

## 6. Moduły frontend (roadmapa)
- **Autoryzacja**: logowanie, zarządzanie tokenem, ochrona tras, przełączanie ról.
- **Klienci**: lista z filtrem, formularz dodawania/edycji, karta klienta (zakładki: dane, rezerwacje, historia zabiegów, notatki).
- **Zabiegi**: katalog zabiegów z CRUD.
- **Rezerwacje**: kalendarz/lista, formularz rezerwacji, zmiana statusu (zakończona/odwołana).
- **Powiadomienia**: lista SMS, dodawanie manualnych, status wysyłki.
- **Dashboard**: statystyki (nadchodzące wizyty, urodziny, sumy). 
- **Panel użytkownika**: zarządzanie kontem, info o roli.

## 7. Backlog iteracyjny
- **Iteracja 1**
  1. Skonfigurować projekt .NET (solution, projekty, DI, swagger, EF Core, migracje startowe).
  2. Autoryzacja: modele użytkownika, login, generowanie JWT, seeding admina.
  3. Podłączyć frontendowy login do nowego endpointu.
- **Iteracja 2**
  1. Moduł klientów: encja, DTO, kontroler, walidacja, testy.
  2. Frontend: lista klientów z filtrowaniem i tworzeniem/edycją.
- **Iteracja 3**
  1. Zabiegi + rezerwacje (kolizje terminów, statusy).
  2. Widoki frontu dla zabiegów i rezerwacji.
- **Iteracja 4**
  1. Powiadomienia SMS (Scheduler, logi, API) – na początek symulacja.
  2. Dashboard + raport podstawowy.
- **Iteracja 5**
  1. Audyt działań, logowanie zdarzeń.
  2. Testy E2E / automatyzacja (Playwright/Cypress) + CI/CD pipeline.

## 8. Wymagania niefunkcjonalne
- API zwraca odpowiedzi < 2s dla standardowych operacji (zapytania zoptymalizowane, indeksy).
- Walidacja danych na backendzie i frontendzie.
- Logowanie błędów (Serilog + Sink do pliku/DB).
- Dokumentacja API (Swagger + README).
- Przygotowanie do konteneryzacji (Dockerfile, docker-compose – baza + API + frontend).

## 9. Kolejne kroki
1. Zainstalować .NET SDK 8.0 w środowisku deweloperskim (obecnie brak SDK).
2. Utworzyć strukturę `server/` i wygenerować solution z projektami.
3. Dodać pierwszą migrację bazy danych i konfigurację połączenia.
4. Zaimplementować moduł logowania i spiąć go z aktualnym frontendem.
5. Przygotować makiety UI dla widoków klienta, rezerwacji i zabiegów.

