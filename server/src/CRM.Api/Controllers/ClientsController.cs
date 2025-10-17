using System.Collections.Generic;
using CRM.Application.Clients;
using CRM.Application.Clients.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController(IClientService clientService, ILogger<ClientsController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClientDto>>> Get([FromQuery] string? q, CancellationToken cancellationToken)
    {
        var clients = await clientService.SearchAsync(q, cancellationToken);
        return Ok(clients);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClientDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var client = await clientService.GetAsync(id, cancellationToken);
        return client is null ? NotFound() : Ok(client);
    }

    [HttpPost]
    public async Task<ActionResult<ClientDto>> Create([FromBody] CreateClientRequest request, CancellationToken cancellationToken)
    {
        var client = await clientService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = client.Id }, client);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClientDto>> Update(Guid id, [FromBody] UpdateClientRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var client = await clientService.UpdateAsync(id, request, cancellationToken);
            return Ok(client);
        }
        catch (KeyNotFoundException ex)
        {
            logger.LogWarning(ex, "Client {ClientId} not found", id);
            return NotFound();
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await clientService.DeleteAsync(id, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            logger.LogWarning(ex, "Client {ClientId} not found", id);
            return NotFound();
        }
    }
}
