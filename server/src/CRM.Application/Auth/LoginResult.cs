namespace CRM.Application.Auth;

public sealed record LoginResult(string AccessToken, string RefreshToken, DateTime ExpiresAtUtc, string Email, string Role);
