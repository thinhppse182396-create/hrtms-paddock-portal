using HRTMS.Data;
using HRTMS.Models.on_board;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("raceResults")]
[Route("api/race-results")]
public class RaceResultsController : ControllerBase
{
    private const string ApprovedRegistrationStatusCode = "APPROVED";
    private const string FinishedRaceStatusCode = "FINISHED";
    private const string OngoingRaceStatusCode = "ONGOING";

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
                result.Violation,
                result.PrizeMoney))
            .ToListAsync();

        return Ok(results);
    }

    [HttpPost]
    public async Task<ActionResult<RaceResultResponse>> CreateRaceResult(
        CreateRaceResultRequest request)
    {
        var race = await _context.Races
            .AsNoTracking()
            .Where(item => item.RaceID == request.RaceId)
            .Select(item => new
            {
                item.RaceName,
                StatusCode = item.Status!.StatusCode
            })
            .SingleOrDefaultAsync();

        if (race is null)
        {
            return NotFound(new { message = "Race does not exist." });
        }

        if (!CanRecordResults(race.StatusCode))
        {
            return Conflict(new { message = "Race results can only be entered for an ongoing or finished race." });
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

        if (await _context.RaceResults.AnyAsync(result =>
            result.RaceId == request.RaceId &&
            result.Rank == request.Rank))
        {
            return Conflict(new { message = "This rank is already used for this race." });
        }

        var result = new RaceResults
        {
            RaceId = request.RaceId,
            HorseId = request.HorseId,
            Rank = request.Rank,
            Violation = request.Violation,
            PrizeMoney = request.PrizeMoney
        };

        _context.RaceResults.Add(result);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            return Conflict(new { message = "This horse or rank already has a result for this race." });
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
            result.Violation,
            result.PrizeMoney);

        return CreatedAtAction(
            nameof(GetRaceResults),
            new { raceId = result.RaceId },
            response);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RaceResultResponse>> UpdateRaceResult(
        int id,
        UpdateRaceResultRequest request)
    {
        var result = await _context.RaceResults
            .Include(item => item.Races)
            .SingleOrDefaultAsync(item => item.Id == id);

        if (result is null)
        {
            return NotFound();
        }

        if (result.Races?.StatusId is null)
        {
            return Conflict(new { message = "Race results can only be edited for an ongoing or finished race." });
        }

        var raceStatusCode = await _context.Statuses
            .Where(status =>
                status.StatusId == result.Races.StatusId &&
                status.EntityName == "Race")
            .Select(status => status.StatusCode)
            .SingleOrDefaultAsync();

        if (!CanRecordResults(raceStatusCode))
        {
            return Conflict(new { message = "Race results can only be edited for an ongoing or finished race." });
        }

        if (await _context.RaceResults.AnyAsync(item =>
            item.Id != id &&
            item.RaceId == result.RaceId &&
            item.Rank == request.Rank))
        {
            return Conflict(new { message = "This rank is already used for this race." });
        }

        result.Rank = request.Rank;
        result.Violation = request.Violation;
        result.PrizeMoney = request.PrizeMoney;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            return Conflict(new { message = "This rank is already used for this race." });
        }

        var response = await GetRaceResult(id);
        return Ok(response);
    }

    private async Task<RaceResultResponse?> GetRaceResult(int id)
    {
        return await _context.RaceResults
            .AsNoTracking()
            .Where(result => result.Id == id)
            .Select(result => new RaceResultResponse(
                result.Id,
                result.RaceId,
                result.Races!.RaceName,
                result.HorseId,
                result.Horses!.HourseName,
                result.Rank,
                result.Violation,
                result.PrizeMoney))
            .SingleOrDefaultAsync();
    }

    private static bool CanRecordResults(string? statusCode)
    {
        return statusCode is OngoingRaceStatusCode or FinishedRaceStatusCode;
    }

    public record CreateRaceResultRequest(
        [Required] string RaceId,
        [Required] string HorseId,
        [Range(1, int.MaxValue)] int Rank,
        string Violation = "",
        [Range(typeof(decimal), "0", "9999999999999999.99")]
        decimal? PrizeMoney = null);

    public record UpdateRaceResultRequest(
        [Range(1, int.MaxValue)] int Rank,
        string Violation = "",
        [Range(typeof(decimal), "0", "9999999999999999.99")]
        decimal? PrizeMoney = null);

    public record RaceResultResponse(
        int Id,
        string RaceId,
        string RaceName,
        string HorseId,
        string HorseName,
        int Rank,
        string Violation,
        decimal? PrizeMoney);
}
