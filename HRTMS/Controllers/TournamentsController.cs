using HRTMS.Data;
using HRTMS.Models.on_board;
using HRTMS.Models.Statuss;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("tournaments")]
[Route("api/tournaments")]
public class TournamentsController : ControllerBase
{
    private const string TournamentEntityName = "Tournament";
    private const string DraftStatusCode = "DRAFT";

    private readonly ApplicationDbContext _context;

    public TournamentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TournamentResponse>>> GetTournaments()
    {
        return Ok(await ProjectResponses(_context.Tournaments.AsNoTracking()).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TournamentResponse>> GetTournament(string id)
    {
        var tournament = await ProjectResponses(
                _context.Tournaments.AsNoTracking().Where(item => item.TournamentId == id))
            .SingleOrDefaultAsync();

        return tournament is null ? NotFound() : Ok(tournament);
    }

    [HttpPost]
    public async Task<ActionResult<TournamentResponse>> CreateTournament(CreateTournamentRequest request)
    {
        var tournamentId = request.TournamentId.Trim();
        if (await _context.Tournaments.AnyAsync(item => item.TournamentId == tournamentId))
        {
            return Conflict(new { message = "Tournament ID already exists." });
        }

        var validationError = await ValidateRequest(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var status = await FindStatus(request.StatusCode);
        if (status is null)
        {
            return BadRequest(new { message = "Tournament status does not exist or is inactive." });
        }

        var tournament = new Tournaments
        {
            TournamentId = tournamentId,
            Name = request.Name.Trim(),
            TrackID = request.TrackId.Trim(),
            Start = request.Start,
            End = request.End,
            StatusId = status.StatusId
        };

        _context.Tournaments.Add(tournament);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetTournament),
            new { id = tournament.TournamentId },
            ToResponse(tournament, status.StatusCode));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TournamentResponse>> UpdateTournament(
        string id,
        UpdateTournamentRequest request)
    {
        var tournament = await _context.Tournaments.FindAsync(id);
        if (tournament is null)
        {
            return NotFound();
        }

        var validationError = await ValidateRequest(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var status = await FindStatus(request.StatusCode);
        if (status is null)
        {
            return BadRequest(new { message = "Tournament status does not exist or is inactive." });
        }

        tournament.Name = request.Name.Trim();
        tournament.TrackID = request.TrackId.Trim();
        tournament.Start = request.Start;
        tournament.End = request.End;
        tournament.StatusId = status.StatusId;

        await _context.SaveChangesAsync();
        return Ok(ToResponse(tournament, status.StatusCode));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTournament(string id)
    {
        var tournament = await _context.Tournaments.FindAsync(id);
        if (tournament is null)
        {
            return NotFound();
        }

        _context.Tournaments.Remove(tournament);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Tournament cannot be deleted because it is in use." });
        }

        return NoContent();
    }

    private async Task<string?> ValidateRequest(TournamentRequest request)
    {
        if (request.End < request.Start)
        {
            return "Tournament end date must be on or after its start date.";
        }

        return await _context.Tracks.AnyAsync(track => track.TrackId == request.TrackId)
            ? null
            : "Track does not exist.";
    }

    private async Task<Status?> FindStatus(string statusCode)
    {
        var normalizedStatusCode = statusCode.Trim().ToUpperInvariant();
        return await _context.Statuses.SingleOrDefaultAsync(status =>
            status.EntityName == TournamentEntityName &&
            status.StatusCode == normalizedStatusCode &&
            status.IsActive);
    }

    private static IQueryable<TournamentResponse> ProjectResponses(IQueryable<Tournaments> query)
    {
        return query
            .OrderBy(tournament => tournament.Start)
            .ThenBy(tournament => tournament.Name)
            .Select(tournament => new TournamentResponse(
                tournament.TournamentId,
                tournament.Name,
                tournament.TrackID,
                tournament.Start,
                tournament.End,
                tournament.StatusId,
                tournament.Status!.StatusCode));
    }

    private static TournamentResponse ToResponse(Tournaments tournament, string statusCode)
    {
        return new TournamentResponse(
            tournament.TournamentId,
            tournament.Name,
            tournament.TrackID,
            tournament.Start,
            tournament.End,
            tournament.StatusId,
            statusCode);
    }

    public abstract record TournamentRequest(
        [Required] string Name,
        [Required] string TrackId,
        DateTime Start,
        DateTime End,
        [Required] string StatusCode);

    public record CreateTournamentRequest(
        [Required] string TournamentId,
        string Name,
        string TrackId,
        DateTime Start,
        DateTime End,
        string StatusCode = DraftStatusCode)
        : TournamentRequest(Name, TrackId, Start, End, StatusCode);

    public record UpdateTournamentRequest(
        string Name,
        string TrackId,
        DateTime Start,
        DateTime End,
        string StatusCode)
        : TournamentRequest(Name, TrackId, Start, End, StatusCode);

    public record TournamentResponse(
        string TournamentId,
        string Name,
        string TrackId,
        DateTime Start,
        DateTime End,
        int StatusId,
        string StatusCode);
}
