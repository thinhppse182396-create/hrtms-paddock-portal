using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("registrations")]
[Route("api/registrations")]
public class RegistrationsController : ApiControllerBase
{
    private readonly IRegistrationService _registrationService;

    public RegistrationsController(IRegistrationService registrationService)
    {
        _registrationService = registrationService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RegistrationResponse>>> GetRegistrations(
        [FromQuery] string? raceId,
        [FromQuery] string? status)
    {
        return Ok(await _registrationService.GetRegistrationsAsync(raceId, status));
    }

    [HttpPost]
    public async Task<ActionResult<RegistrationResponse>> CreateRegistration(
        CreateRegistrationRequest request)
    {
        var result = await _registrationService.CreateRegistrationAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? CreatedAtAction(nameof(GetRegistrations), new { raceId = result.Value!.RaceId }, result.Value)
            : ToActionResult(result);
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<RegistrationResponse>> UpdateRegistrationStatus(
        string id,
        UpdateRegistrationStatusRequest request)
    {
        var result = await _registrationService.UpdateRegistrationStatusAsync(id, request);
        return ToActionResult(result);
    }

    [HttpPatch("{id}/jockey")]
    public async Task<ActionResult<RegistrationResponse>> UpdateRegistrationJockey(
        string id,
        UpdateRegistrationJockeyRequest request)
    {
        var result = await _registrationService.UpdateRegistrationJockeyAsync(id, request);
        return ToActionResult(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRegistration(string id)
    {
        var result = await _registrationService.DeleteRegistrationAsync(id);
        return ToNoContentResult(result);
    }
}
