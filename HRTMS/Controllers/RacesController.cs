using HRTMS.Data;
using HRTMS.Models.on_board;
using HRTMS.Models.Statuss;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("races")]
public class RacesController : ControllerBase
{
    private const string OpenStatusAlias = "OPEN";
    private const string ScheduledStatusCode = "SCHEDULED";

    private static readonly string[] PublishedStatusCodes =
    [
        ScheduledStatusCode,
        "ONGOING",
        "COMPLETED"
    ];

    private static readonly string[] RaceStatusCodes =
    [
        ScheduledStatusCode,
        "ONGOING",
        "COMPLETED",
        "CANCELLED"
    ];

    private readonly ApplicationDbContext _context;

    public RacesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RaceResponse>>> GetRaces([FromQuery] string? status)
    {
        var query = _context.Races.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var statusCode = NormalizeStatusCode(status);
            if (!RaceStatusCodes.Contains(statusCode))
            {
                return BadRequest(new { message = "Race status does not exist." });
            }

            query = query.Where(race =>
                race.Status != null &&
                race.Status.StatusCode == statusCode);
        }

        return Ok(await ProjectResponses(query).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RaceResponse>> GetRace(string id)
    {
        var race = await ProjectResponses(
                _context.Races
                    .AsNoTracking()
                    .Where(item => item.RaceID == id))
            .SingleOrDefaultAsync();

        return race is null ? NotFound() : Ok(race);
    }

    [HttpGet("published")]
    public async Task<ActionResult<IEnumerable<RaceResponse>>> GetPublishedRaces()
    {
        var races = await ProjectResponses(
                _context.Races
                    .AsNoTracking()
                    .Where(race =>
                        race.Status != null &&
                        race.Status.IsActive &&
                        PublishedStatusCodes.Contains(race.Status.StatusCode)))
            .ToListAsync();

        return Ok(races);
    }

    [HttpPost]
    public async Task<ActionResult<RaceResponse>> CreateRace(CreateRaceRequest request)
    {
        if (await _context.Races.AnyAsync(race => race.RaceID == request.RaceId))
        {
            return Conflict(new { message = "Race ID already exists." });
        }

        if (!await _context.Tournaments.AnyAsync(tournament =>
            tournament.TournamentId == request.TournamentId))
        {
            return BadRequest(new { message = "Tournament does not exist." });
        }

        var status = await FindRaceStatus(request.StatusCode);
        if (status is null)
        {
            return BadRequest(new { message = "Race status does not exist or is inactive." });
        }

        var race = new Races
        {
            RaceID = request.RaceId,
            TournamentId = request.TournamentId,
            RaceName = request.RaceName,
            Distance = request.Distance,
            Lanes = request.Lanes,
            StatusId = status.StatusId
        };

        _context.Races.Add(race);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetRace), new { id = race.RaceID }, ToResponse(race, status.StatusCode));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RaceResponse>> UpdateRace(string id, UpdateRaceRequest request)
    {
        var race = await _context.Races.FindAsync(id);
        if (race is null)
        {
            return NotFound();
        }

        if (!await _context.Tournaments.AnyAsync(tournament =>
            tournament.TournamentId == request.TournamentId))
        {
            return BadRequest(new { message = "Tournament does not exist." });
        }

        var status = await FindRaceStatus(request.StatusCode);
        if (status is null)
        {
            return BadRequest(new { message = "Race status does not exist or is inactive." });
        }

        race.TournamentId = request.TournamentId;
        race.RaceName = request.RaceName;
        race.Distance = request.Distance;
        race.Lanes = request.Lanes;
        race.StatusId = status.StatusId;

        await _context.SaveChangesAsync();

        return Ok(ToResponse(race, status.StatusCode));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRace(string id)
    {
        var race = await _context.Races.FindAsync(id);
        if (race is null)
        {
            return NotFound();
        }

        _context.Races.Remove(race);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Race cannot be deleted because it is in use." });
        }

        return NoContent();
    }

    private async Task<Status?> FindRaceStatus(string statusCode)
    {
        var normalizedStatusCode = NormalizeStatusCode(statusCode);

        return await _context.Statuses.SingleOrDefaultAsync(status =>
            status.EntityName == "Race" &&
            status.StatusCode == normalizedStatusCode &&
            status.IsActive);
    }

    private static string NormalizeStatusCode(string statusCode)
    {
        var normalizedStatusCode = statusCode.Trim().ToUpperInvariant();
        return normalizedStatusCode == OpenStatusAlias
            ? ScheduledStatusCode
            : normalizedStatusCode;
    }

    private static IQueryable<RaceResponse> ProjectResponses(IQueryable<Races> query)
    {
        return query
            .OrderBy(race => race.RaceName)
            .Select(race => new RaceResponse(
                race.RaceID,
                race.TournamentId,
                race.RaceName,
                race.Distance,
                race.Lanes,
                race.StatusId,
                race.Status!.StatusCode));
    }

    private static RaceResponse ToResponse(Races race, string statusCode)
    {
        return new RaceResponse(
            race.RaceID,
            race.TournamentId,
            race.RaceName,
            race.Distance,
            race.Lanes,
            race.StatusId,
            statusCode);
    }

    public record CreateRaceRequest(
        [Required] string RaceId,
        [Required] string TournamentId,
        [Required] string RaceName,
        [Required] string Distance,
        [Range(1, int.MaxValue)] int Lanes,
        string StatusCode = ScheduledStatusCode);

    public record UpdateRaceRequest(
        [Required] string TournamentId,
        [Required] string RaceName,
        [Required] string Distance,
        [Range(1, int.MaxValue)] int Lanes,
        [Required] string StatusCode);

    public record RaceResponse(
        string RaceId,
        string TournamentId,
        string RaceName,
        string Distance,
        int Lanes,
        int StatusId,
        string StatusCode);
}
