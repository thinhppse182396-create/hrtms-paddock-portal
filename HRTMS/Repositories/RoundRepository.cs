using HRTMS.Models.DTOs;
using HRTMS.Data;
using HRTMS.Models.on_board;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public sealed record RaceSchedule(DateTime ScheduledAt);

public interface IRoundRepository
{
    Task<RoundResponse?> GetResponseByIdAsync(int id);
    Task<IReadOnlyList<RoundResponse>> GetResponsesAsync();
    Task<RaceSchedule?> GetRaceScheduleAsync(string raceId);
    Task<bool> HasRoundNearStartAsync(string raceId, DateTime earliest, DateTime latest, int? excludingRoundId);
    Task<Rounds?> GetByIdAsync(int id);
    void Add(Rounds round);
    void Remove(Rounds round);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class RoundRepository : IRoundRepository
{
    private readonly ApplicationDbContext _context;

    public RoundRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<RoundResponse?> GetResponseByIdAsync(int id)
    {
        return ProjectResponses(_context.Rounds.AsNoTracking().Where(item => item.RoundId == id))
            .SingleOrDefaultAsync();
    }

    public Task<IReadOnlyList<RoundResponse>> GetResponsesAsync()
    {
        return ProjectResponses(_context.Rounds.AsNoTracking())
            .ToListAsync()
            .ContinueWith(task => (IReadOnlyList<RoundResponse>)task.Result);
    }

    public Task<RaceSchedule?> GetRaceScheduleAsync(string raceId)
    {
        return _context.Races
            .AsNoTracking()
            .Where(item => item.RaceID == raceId)
            .Select(item => new RaceSchedule(item.ScheduledAt))
            .SingleOrDefaultAsync();
    }

    public Task<bool> HasRoundNearStartAsync(string raceId, DateTime earliest, DateTime latest, int? excludingRoundId)
    {
        return _context.Rounds.AnyAsync(round =>
            round.RaceID == raceId &&
            round.RoundId != excludingRoundId &&
            round.StartTime > earliest &&
            round.StartTime < latest);
    }

    public async Task<Rounds?> GetByIdAsync(int id)
    {
        return await _context.Rounds.FindAsync(id);
    }

    public void Add(Rounds round)
    {
        _context.Rounds.Add(round);
    }

    public void Remove(Rounds round)
    {
        _context.Rounds.Remove(round);
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

    private static IQueryable<RoundResponse> ProjectResponses(IQueryable<Rounds> query)
    {
        return query
            .OrderBy(round => round.StartTime)
            .Select(round => new RoundResponse(
                round.RoundId,
                round.RaceID,
                round.RoundName,
                round.StartTime));
    }
}
