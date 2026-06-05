using HRTMS.Models.DTOs;
using HRTMS.Data;
using HRTMS.Models.on_board;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public interface IAwardRepository
{
    Task<bool> RaceExistsAsync(string raceId);
    Task<IReadOnlyList<AwardResponse>> GetResponsesByRaceAsync(string raceId);
    Task<bool> ExistsForRaceRankAsync(string raceId, int rank);
    Task<Awards?> GetByIdAsync(int id);
    void Add(Awards award);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class AwardRepository : IAwardRepository
{
    private readonly ApplicationDbContext _context;

    public AwardRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<bool> RaceExistsAsync(string raceId)
    {
        return _context.Races.AnyAsync(race => race.RaceID == raceId);
    }

    public Task<IReadOnlyList<AwardResponse>> GetResponsesByRaceAsync(string raceId)
    {
        return _context.Awards
            .AsNoTracking()
            .Where(award => award.RaceID == raceId)
            .OrderBy(award => award.Rank)
            .Select(award => ToResponse(award))
            .ToListAsync()
            .ContinueWith(task => (IReadOnlyList<AwardResponse>)task.Result);
    }

    public Task<bool> ExistsForRaceRankAsync(string raceId, int rank)
    {
        return _context.Awards.AnyAsync(award =>
            award.RaceID == raceId &&
            award.Rank == rank);
    }

    public async Task<Awards?> GetByIdAsync(int id)
    {
        return await _context.Awards.FindAsync(id);
    }

    public void Add(Awards award)
    {
        _context.Awards.Add(award);
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

    private static AwardResponse ToResponse(Awards award)
    {
        return new AwardResponse(award.Id, award.RaceID, award.Rank, award.PriceMoney);
    }
}
