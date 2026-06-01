using HRTMS.Data;
using HRTMS.Models.on_board;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("api/rounds")]
[Route("rounds")]
public class RoundsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public RoundsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RoundResponse>> GetRound(int id)
    {
        var round = await _context.Rounds
            .AsNoTracking()
            .Where(item => item.RoundId == id)
            .Select(item => new RoundResponse(
                item.RoundId,
                item.RaceID,
                item.RoundName,
                item.StartTime))
            .SingleOrDefaultAsync();

        return round is null ? NotFound() : Ok(round);
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

        return CreatedAtAction(nameof(GetRound), new { id = round.RoundId }, response);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RoundResponse>> UpdateRound(int id, CreateRoundRequest request)
    {
        var round = await _context.Rounds.FindAsync(id);
        if (round is null)
        {
            return NotFound();
        }

        if (!await _context.Races.AnyAsync(race => race.RaceID == request.RaceId))
        {
            return BadRequest(new { message = "Race does not exist." });
        }

        round.RaceID = request.RaceId;
        round.RoundName = request.RoundName;
        round.StartTime = request.StartTime;
        await _context.SaveChangesAsync();

        return Ok(new RoundResponse(round.RoundId, round.RaceID, round.RoundName, round.StartTime));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRound(int id)
    {
        var round = await _context.Rounds.FindAsync(id);
        if (round is null)
        {
            return NotFound();
        }

        _context.Rounds.Remove(round);
        await _context.SaveChangesAsync();
        return NoContent();
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
