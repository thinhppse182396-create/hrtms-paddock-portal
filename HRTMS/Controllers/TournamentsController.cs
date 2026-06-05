using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("tournaments")]
[Route("api/tournaments")]
public class TournamentsController : ApiControllerBase
{
    private readonly ITournamentService _tournamentService;

    public TournamentsController(ITournamentService tournamentService)
    {
        _tournamentService = tournamentService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TournamentResponse>>> GetTournaments()
    {
        return Ok(await _tournamentService.GetTournamentsAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TournamentResponse>> GetTournament(string id)
    {
        var result = await _tournamentService.GetTournamentAsync(id);
        return ToActionResult(result);
    }

    [HttpPost]
    public async Task<ActionResult<TournamentResponse>> CreateTournament(CreateTournamentRequest request)
    {
        var result = await _tournamentService.CreateTournamentAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? CreatedAtAction(nameof(GetTournament), new { id = result.Value!.TournamentId }, result.Value)
            : ToActionResult(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TournamentResponse>> UpdateTournament(
        string id,
        UpdateTournamentRequest request)
    {
        var result = await _tournamentService.UpdateTournamentAsync(id, request);
        return ToActionResult(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTournament(string id)
    {
        var result = await _tournamentService.DeleteTournamentAsync(id);
        return ToNoContentResult(result);
    }
}
