using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("races")]
[Route("api/races")]
public class RacesController : ControllerBase
{
    private readonly IRaceService _raceService;

    public RacesController(IRaceService raceService)
    {
        _raceService = raceService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RaceResponse>>> GetRaces([FromQuery] string? status)
    {
        var result = await _raceService.GetRacesAsync(status);
        return ToActionResult(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RaceResponse>> GetRace(string id)
    {
        var result = await _raceService.GetRaceAsync(id);
        return ToActionResult(result);
    }

    [HttpGet("published")]
    public async Task<ActionResult<IReadOnlyList<RaceResponse>>> GetPublishedRaces()
    {
        return Ok(await _raceService.GetPublishedRacesAsync());
    }

    [HttpPost]
    public async Task<ActionResult<RaceResponse>> CreateRace(CreateRaceRequest request)
    {
        var result = await _raceService.CreateRaceAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? CreatedAtAction(nameof(GetRace), new { id = result.Value!.RaceId }, result.Value)
            : ToActionResult(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RaceResponse>> UpdateRace(string id, UpdateRaceRequest request)
    {
        var result = await _raceService.UpdateRaceAsync(id, request);
        return ToActionResult(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRace(string id)
    {
        var result = await _raceService.DeleteRaceAsync(id);
        return ToActionResult(result);
    }

    [HttpPatch("{id}/publish")]
    public async Task<ActionResult<RaceResponse>> PublishRace(string id)
    {
        var result = await _raceService.PublishRaceAsync(id);
        return ToActionResult(result);
    }

    private ActionResult ToActionResult(ServiceResult<bool> result)
    {
        return result.Status switch
        {
            ServiceResultStatus.Success => NoContent(),
            ServiceResultStatus.NotFound => NotFound(Message(result)),
            ServiceResultStatus.BadRequest => BadRequest(Message(result)),
            ServiceResultStatus.Conflict => Conflict(Message(result)),
            ServiceResultStatus.Problem => Problem(result.Message),
            _ => Problem("Unexpected service result.")
        };
    }

    private ActionResult<T> ToActionResult<T>(ServiceResult<T> result)
    {
        return result.Status switch
        {
            ServiceResultStatus.Success => Ok(result.Value),
            ServiceResultStatus.NotFound => NotFound(Message(result)),
            ServiceResultStatus.BadRequest => BadRequest(Message(result)),
            ServiceResultStatus.Conflict => Conflict(Message(result)),
            ServiceResultStatus.Problem => Problem(result.Message),
            _ => Problem("Unexpected service result.")
        };
    }

    private static object? Message<T>(ServiceResult<T> result)
    {
        return result.Message is null ? null : new { message = result.Message };
    }
}
