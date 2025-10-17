namespace CRM.Application.Auth;

public interface ILoginService
{
    Task<LoginResult> LoginAsync(string email, string password, string ipAddress, CancellationToken cancellationToken = default);
    Task<LoginResult> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default);
}
