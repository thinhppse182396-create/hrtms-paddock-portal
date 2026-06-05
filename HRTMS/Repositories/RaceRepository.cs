using HRTMS.Models.DTOs;
using HRTMS.Data;
using HRTMS.Models.on_board;
using HRTMS.Models.Statuss;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public interface IRaceRepository
{
    Task<IReadOnlyList<RaceResponse>> GetResponsesAsync(string? statusCode);
    Task<RaceResponse?> GetResponseByIdAsync(string id);
    Task<IReadOnlyList<RaceResponse>> GetPublishedResponsesAsync(IReadOnlyCollection<string> publishedStatusCodes);
    Task<bool> ExistsAsync(string id);
    Task<Tournaments?> GetTournamentAsync(string tournamentId);
    Task<Status?> GetActiveStatusAsync(string statusCode);
    Task<bool> HasStatusAsync(int statusId, string statusCode);
    Task<Races?> GetByIdAsync(string id);
    Task<Races?> GetByIdWithStatusAsync(string id);
    void Add(Races race);
    void Remove(Races race);
    Task PublishUnpublishedResultsAsync(string raceId);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class RaceRepository : IRaceRepository
{
    private readonly ApplicationDbContext _context;

    public RaceRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<RaceResponse>> GetResponsesAsync(string? statusCode)
    {
        var query = _context.Races.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            query = query.Where(race =>
                race.Status != null &&
                race.Status.StatusCode == statusCode);
        }

        return await ProjectResponses(query).ToListAsync();
    }

    public async Task<RaceResponse?> GetResponseByIdAsync(string id)
    {
        return await ProjectResponses(
                _context.Races
                    .AsNoTracking()
                    .Where(item => item.RaceID == id))
            .SingleOrDefaultAsync();
    }

    public async Task<IReadOnlyList<RaceResponse>> GetPublishedResponsesAsync(IReadOnlyCollection<string> publishedStatusCodes)
    {
        return await ProjectResponses(
                _context.Races
                    .AsNoTracking()
                    .Where(race =>
                        race.Status != null &&
                        race.Status.IsActive &&
                        publishedStatusCodes.Contains(race.Status.StatusCode)))
            .ToListAsync();
    }

    public Task<bool> ExistsAsync(string id)
    {
        return _context.Races.AnyAsync(race => race.RaceID == id);
    }

    public Task<Tournaments?> GetTournamentAsync(string tournamentId)
    {
        return _context.Tournaments.SingleOrDefaultAsync(item =>
            item.TournamentId == tournamentId);
    }

    public Task<Status?> GetActiveStatusAsync(string statusCode)
    {
        return _context.Statuses.SingleOrDefaultAsync(status =>
            status.EntityName == "Race" &&
            status.StatusCode == statusCode &&
            status.IsActive);
    }

    public Task<bool> HasStatusAsync(int statusId, string statusCode)
    {
        return _context.Statuses.AnyAsync(status =>
            status.StatusId == statusId &&
            status.EntityName == "Race" &&
            status.StatusCode == statusCode);
    }

    public async Task<Races?> GetByIdAsync(string id)
    {
        return await _context.Races.FindAsync(id);
    }

    public Task<Races?> GetByIdWithStatusAsync(string id)
    {
        return _context.Races
            .Include(item => item.Status)
            .SingleOrDefaultAsync(item => item.RaceID == id);
    }

    public void Add(Races race)
    {
        _context.Races.Add(race);
    }

    public void Remove(Races race)
    {
        _context.Races.Remove(race);
    }

    public async Task PublishUnpublishedResultsAsync(string raceId)
    {
        var results = await _context.RaceResults
            .Where(result => result.RaceId == raceId && !result.Published)
            .ToListAsync();

        foreach (var result in results)
        {
            result.Published = true;
        }
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

    private static IQueryable<RaceResponse> ProjectResponses(IQueryable<Races> query)
    {
        return query
            .OrderBy(race => race.RaceName)
            .Select(race => new RaceResponse(
                race.RaceID,
                race.TournamentId,
                race.RaceName,
                race.ScheduledAt,
                race.RoundNumber,
                race.MinAge,
                race.MaxAge,
                race.MinWeight,
                race.MaxWeight,
                race.AllowedBreeds,
                race.RequiresValidHealthCert,
                race.Distance,
                race.Lanes,
                race.StatusId,
                race.Status!.StatusCode));
    }
}
