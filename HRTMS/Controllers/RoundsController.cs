using HRTMS.Data;
using HRTMS.Models.on_board;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("api/rounds")]
public class RoundsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public RoundsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoundResponse>>> GetRounds()
    {
        var rounds = await _context.Rounds
            .AsNoTracking()
            .OrderBy(round => round.StartTime)
            .Select(round => new RoundResponse(
                round.RoundId,
                round.RaceID,
                round.RoundName,
                round.StartTime))
            .ToListAsync();

        return Ok(rounds);
    }

    [HttpPost]
    public async Task<ActionResult<RoundResponse>> CreateRound(CreateRoundRequest request)
    {
        if (!await _context.Races.AnyAsync(race => race.RaceID == request.RaceId))
        {
            return BadRequest(new { message = "Race does not exist." });
        }

        var round = new Rounds
        {
            RaceID = request.RaceId,
            RoundName = request.RoundName,
            StartTime = request.StartTime
        };

        _context.Rounds.Add(round);
        await _context.SaveChangesAsync();

        var response = new RoundResponse(
            round.RoundId,
            round.RaceID,
            round.RoundName,
            round.StartTime);

        return Created("/api/rounds", response);
    }

    public record CreateRoundRequest(
        [Required] string RaceId,
        [Required] string RoundName,
        DateTime StartTime);

    public record RoundResponse(
        int RoundId,
        string RaceId,
        string RoundName,
        DateTime StartTime);
}
