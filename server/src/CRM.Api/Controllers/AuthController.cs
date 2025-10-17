using CRM.Application.Auth;
using Microsoft.AspNetCore.Mvc;

namespace CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(ILoginService loginService, ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResult>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await loginService.LoginAsync(request.Email, request.Password, HttpContext.Connection.RemoteIpAddress?.ToString() ?? "", cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Login failed for {Email}", request.Email);
            return Unauthorized();
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResult>> Refresh([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await loginService.RefreshAsync(request.RefreshToken, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Refresh token failed");
            return Unauthorized();
        }
    }

    public sealed record LoginRequest(string Email, string Password);
    public sealed record RefreshRequest(string RefreshToken);
}
