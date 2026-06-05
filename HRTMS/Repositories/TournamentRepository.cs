using HRTMS.Models.DTOs;
using HRTMS.Data;
using HRTMS.Models.on_board;
using HRTMS.Models.Statuss;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public interface ITournamentRepository
{
    Task<IReadOnlyList<TournamentResponse>> GetResponsesAsync();
    Task<TournamentResponse?> GetResponseByIdAsync(string id);
    Task<bool> ExistsAsync(string id);
    Task<bool> TrackExistsAsync(string trackId);
    Task<bool> HasRaceOutsideRangeAsync(string tournamentId, DateTime start, DateTime end);
    Task<Status?> GetActiveStatusAsync(string statusCode);
    Task<Tournaments?> GetByIdAsync(string id);
    void Add(Tournaments tournament);
    void Remove(Tournaments tournament);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class TournamentRepository : ITournamentRepository
{
    private const string TournamentEntityName = "Tournament";

    private readonly ApplicationDbContext _context;

    public TournamentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<IReadOnlyList<TournamentResponse>> GetResponsesAsync()
    {
        return ProjectResponses(_context.Tournaments.AsNoTracking()).ToListAsync()
            .ContinueWith(task => (IReadOnlyList<TournamentResponse>)task.Result);
    }

    public Task<TournamentResponse?> GetResponseByIdAsync(string id)
    {
        return ProjectResponses(_context.Tournaments.AsNoTracking().Where(item => item.TournamentId == id))
            .SingleOrDefaultAsync();
    }

    public Task<bool> ExistsAsync(string id)
    {
        return _context.Tournaments.AnyAsync(item => item.TournamentId == id);
    }

    public Task<bool> TrackExistsAsync(string trackId)
    {
        return _context.Tracks.AnyAsync(track => track.TrackId == trackId);
    }

    public Task<bool> HasRaceOutsideRangeAsync(string tournamentId, DateTime start, DateTime end)
    {
        return _context.Races.AnyAsync(race =>
            race.TournamentId == tournamentId &&
            (race.ScheduledAt.Date < start.Date || race.ScheduledAt.Date > end.Date));
    }

    public Task<Status?> GetActiveStatusAsync(string statusCode)
    {
        var normalized = statusCode.Trim().ToUpperInvariant();
        return _context.Statuses.SingleOrDefaultAsync(status =>
            status.EntityName == TournamentEntityName &&
            status.StatusCode == normalized &&
            status.IsActive);
    }

    public async Task<Tournaments?> GetByIdAsync(string id)
    {
        return await _context.Tournaments.FindAsync(id);
    }

    public void Add(Tournaments tournament)
    {
        _context.Tournaments.Add(tournament);
    }

    public void Remove(Tournaments tournament)
    {
        _context.Tournaments.Remove(tournament);
    }

    public async Task<PersistenceResult> SaveChangesAsync()
    {
        try
        {
            await _context.SaveChangesAsync();
            return PersistenceResult.Success;
        }
        catch (DbUpdateException)
        {
            return PersistenceResult.Conflict;
        }
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
}
