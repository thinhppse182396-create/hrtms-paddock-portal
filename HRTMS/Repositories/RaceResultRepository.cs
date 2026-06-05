using HRTMS.Models.DTOs;
using HRTMS.Data;
using HRTMS.Models.on_board;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public sealed record RaceSummary(string RaceName, string StatusCode);

public sealed record HorseSummary(string HorseId, string HorseName);

public interface IRaceResultRepository
{
    Task<bool> RaceExistsAsync(string raceId);
    Task<IReadOnlyList<RaceResultResponse>> GetResponsesByRaceIdAsync(string raceId);
    Task<RaceSummary?> GetRaceSummaryAsync(string raceId);
    Task<HorseSummary?> GetHorseSummaryAsync(string horseId);
    Task<bool> HasApprovedRegistrationAsync(string raceId, string horseId, string approvedStatusCode);
    Task<bool> HasResultForHorseAsync(string raceId, string horseId);
    Task<bool> HasResultRankAsync(string raceId, int rank, int? excludingResultId = null);
    Task<RaceResults?> GetByIdAsync(int id);
    Task<RaceResults?> GetByIdWithRaceAsync(int id);
    Task<string?> GetRaceStatusCodeAsync(int statusId);
    Task<RaceResultResponse?> GetResponseByIdAsync(int id);
    void Add(RaceResults result);
    void Remove(RaceResults result);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class RaceResultRepository : IRaceResultRepository
{
    private readonly ApplicationDbContext _context;

    public RaceResultRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<bool> RaceExistsAsync(string raceId)
    {
        return _context.Races.AnyAsync(race => race.RaceID == raceId);
    }

    public async Task<IReadOnlyList<RaceResultResponse>> GetResponsesByRaceIdAsync(string raceId)
    {
        return await ProjectResponses(_context.RaceResults.AsNoTracking())
            .Where(result => result.RaceId == raceId)
            .OrderBy(result => result.Rank)
            .ThenBy(result => result.Id)
            .ToListAsync();
    }

    public Task<RaceSummary?> GetRaceSummaryAsync(string raceId)
    {
        return _context.Races
            .AsNoTracking()
            .Where(item => item.RaceID == raceId)
            .Select(item => new RaceSummary(
                item.RaceName,
                item.Status!.StatusCode))
            .SingleOrDefaultAsync();
    }

    public Task<HorseSummary?> GetHorseSummaryAsync(string horseId)
    {
        return _context.Horses
            .AsNoTracking()
            .Where(item => item.HorseId == horseId)
            .Select(item => new HorseSummary(
                item.HorseId,
                item.HourseName))
            .SingleOrDefaultAsync();
    }

    public Task<bool> HasApprovedRegistrationAsync(string raceId, string horseId, string approvedStatusCode)
    {
        return _context.RaceRegistrations.AnyAsync(registration =>
            registration.RaceId == raceId &&
            registration.HorseId == horseId &&
            registration.Status != null &&
            registration.Status.StatusCode == approvedStatusCode);
    }

    public Task<bool> HasResultForHorseAsync(string raceId, string horseId)
    {
        return _context.RaceResults.AnyAsync(result =>
            result.RaceId == raceId &&
            result.HorseId == horseId);
    }

    public Task<bool> HasResultRankAsync(string raceId, int rank, int? excludingResultId = null)
    {
        return _context.RaceResults.AnyAsync(result =>
            result.RaceId == raceId &&
            result.Rank == rank &&
            (excludingResultId == null || result.Id != excludingResultId));
    }

    public async Task<RaceResults?> GetByIdAsync(int id)
    {
        return await _context.RaceResults.FindAsync(id);
    }

    public Task<RaceResults?> GetByIdWithRaceAsync(int id)
    {
        return _context.RaceResults
            .Include(item => item.Races)
            .SingleOrDefaultAsync(item => item.Id == id);
    }

    public Task<string?> GetRaceStatusCodeAsync(int statusId)
    {
        return _context.Statuses
            .Where(status =>
                status.StatusId == statusId &&
                status.EntityName == "Race")
            .Select(status => status.StatusCode)
            .SingleOrDefaultAsync();
    }

    public Task<RaceResultResponse?> GetResponseByIdAsync(int id)
    {
        return ProjectResponses(_context.RaceResults.AsNoTracking())
            .SingleOrDefaultAsync(result => result.Id == id);
    }

    public void Add(RaceResults result)
    {
        _context.RaceResults.Add(result);
    }

    public void Remove(RaceResults result)
    {
        _context.RaceResults.Remove(result);
    }

    public async Task<PersistenceResult> SaveChangesAsync()
    {
        try
        {
            await _context.SaveChangesAsync();
            return PersistenceResult.Success;
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            return PersistenceResult.Conflict;
        }
    }

    private static IQueryable<RaceResultResponse> ProjectResponses(IQueryable<RaceResults> query)
    {
        return query.Select(result => new RaceResultResponse(
            result.Id,
            result.RaceId,
            result.Races!.RaceName,
            result.HorseId,
            result.Horses!.HourseName,
            result.JockeyId,
            result.Rank,
            result.FinishTime,
            result.Disqualified,
            result.Published,
            result.Violation,
            result.PrizeMoney));
    }
}
