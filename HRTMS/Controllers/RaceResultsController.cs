using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("raceResults")]
[Route("api/race-results")]
public class RaceResultsController : ControllerBase
{
    private readonly IRaceResultService _raceResultService;

    public RaceResultsController(IRaceResultService raceResultService)
    {
        _raceResultService = raceResultService;
    }

    [HttpGet("{raceId}")]
    public async Task<ActionResult<IReadOnlyList<RaceResultResponse>>> GetRaceResults(string raceId)
    {
        var result = await _raceResultService.GetRaceResultsAsync(raceId);
        return ToActionResult(result);
    }

    [HttpPost]
    public async Task<ActionResult<RaceResultResponse>> CreateRaceResult(CreateRaceResultRequest request)
    {
        var result = await _raceResultService.CreateRaceResultAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? CreatedAtAction(nameof(GetRaceResults), new { raceId = result.Value!.RaceId }, result.Value)
            : ToActionResult(result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RaceResultResponse>> UpdateRaceResult(
        int id,
        UpdateRaceResultRequest request)
    {
        var result = await _raceResultService.UpdateRaceResultAsync(id, request);
        return ToActionResult(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRaceResult(int id)
    {
        var result = await _raceResultService.DeleteRaceResultAsync(id);
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
