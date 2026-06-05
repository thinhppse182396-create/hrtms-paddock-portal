using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("api/rounds")]
[Route("rounds")]
public class RoundsController : ApiControllerBase
{
    private readonly IRoundService _roundService;

    public RoundsController(IRoundService roundService)
    {
        _roundService = roundService;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RoundResponse>> GetRound(int id)
    {
        var result = await _roundService.GetRoundAsync(id);
        return ToActionResult(result);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RoundResponse>>> GetRounds()
    {
        return Ok(await _roundService.GetRoundsAsync());
    }

    [HttpPost]
    public async Task<ActionResult<RoundResponse>> CreateRound(CreateRoundRequest request)
    {
        var result = await _roundService.CreateRoundAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? CreatedAtAction(nameof(GetRound), new { id = result.Value!.RoundId }, result.Value)
            : ToActionResult(result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RoundResponse>> UpdateRound(int id, CreateRoundRequest request)
    {
        var result = await _roundService.UpdateRoundAsync(id, request);
        return ToActionResult(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRound(int id)
    {
        var result = await _roundService.DeleteRoundAsync(id);
        return ToNoContentResult(result);
    }
}
