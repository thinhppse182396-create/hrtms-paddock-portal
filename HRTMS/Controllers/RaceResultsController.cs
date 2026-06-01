using HRTMS.Data;
using HRTMS.Models.on_board;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("raceResults")]
public class RaceResultsController : ControllerBase
{
    private const string ApprovedRegistrationStatusCode = "APPROVED";

    private readonly ApplicationDbContext _context;

    public RaceResultsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{raceId}")]
    public async Task<ActionResult<IEnumerable<RaceResultResponse>>> GetRaceResults(string raceId)
    {
        if (!await _context.Races.AnyAsync(race => race.RaceID == raceId))
        {
            return NotFound(new { message = "Race does not exist." });
        }

        var results = await _context.RaceResults
            .AsNoTracking()
            .Where(result => result.RaceId == raceId)
            .OrderBy(result => result.Rank)
            .ThenBy(result => result.Id)
            .Select(result => new RaceResultResponse(
                result.Id,
                result.RaceId,
                result.Races!.RaceName,
                result.HorseId,
                result.Horses!.HourseName,
                result.Rank,
                result.Violation))
            .ToListAsync();

        return Ok(results);
    }

    [HttpPost]
    public async Task<ActionResult<RaceResultResponse>> CreateRaceResult(
        CreateRaceResultRequest request)
    {
        if (!await _context.Races.AnyAsync(race => race.RaceID == request.RaceId))
        {
            return NotFound(new { message = "Race does not exist." });
        }

        var horse = await _context.Horses
            .AsNoTracking()
            .Where(item => item.HorseId == request.HorseId)
            .Select(item => new
            {
                item.HorseId,
                HorseName = item.HourseName
            })
            .SingleOrDefaultAsync();

        if (horse is null)
        {
            return NotFound(new { message = "Horse does not exist." });
        }

        if (!await _context.RaceRegistrations.AnyAsync(registration =>
            registration.RaceId == request.RaceId &&
            registration.HorseId == request.HorseId &&
            registration.Status != null &&
            registration.Status.StatusCode == ApprovedRegistrationStatusCode))
        {
            return BadRequest(new { message = "Horse does not have an approved registration for this race." });
        }

        if (await _context.RaceResults.AnyAsync(result =>
            result.RaceId == request.RaceId &&
            result.HorseId == request.HorseId))
        {
            return Conflict(new { message = "This horse already has a result for this race." });
        }

        var result = new RaceResults
        {
            RaceId = request.RaceId,
            HorseId = request.HorseId,
            Rank = request.Rank,
            Violation = request.Violation
        };

        _context.RaceResults.Add(result);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            return Conflict(new { message = "This horse already has a result for this race." });
        }

        var response = new RaceResultResponse(
            result.Id,
            result.RaceId,
            await _context.Races
                .Where(race => race.RaceID == result.RaceId)
                .Select(race => race.RaceName)
                .SingleAsync(),
            result.HorseId,
            horse.HorseName,
            result.Rank,
            result.Violation);

        return CreatedAtAction(
            nameof(GetRaceResults),
            new { raceId = result.RaceId },
            response);
    }

    public record CreateRaceResultRequest(
        [Required] string RaceId,
        [Required] string HorseId,
        [Range(1, int.MaxValue)] int Rank,
        string Violation = "");

    public record RaceResultResponse(
        int Id,
        string RaceId,
        string RaceName,
        string HorseId,
        string HorseName,
        int Rank,
        string Violation);
}
