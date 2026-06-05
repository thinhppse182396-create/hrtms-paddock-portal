using HRTMS.Models.DTOs;
using HRTMS.Data;
using HRTMS.Models.Roles;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public interface IRefereePanelRepository
{
    Task<IReadOnlyList<RefereePanelResponse>> GetResponsesAsync();
    Task<RefereePanelResponse?> GetResponseByIdAsync(string id);
    Task<bool> ExistsAsync(string id);
    Task<bool> RaceExistsAsync(string raceId);
    Task<IReadOnlyList<string>> GetExistingRefereeIdsAsync(IReadOnlyCollection<string> refereeIds);
    Task<RefereePanel?> GetByIdAsync(string id);
    void Add(RefereePanel panel);
    void Remove(RefereePanel panel);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class RefereePanelRepository : IRefereePanelRepository
{
    private readonly ApplicationDbContext _context;

    public RefereePanelRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<IReadOnlyList<RefereePanelResponse>> GetResponsesAsync()
    {
        return ProjectResponses(_context.RefereePanels.AsNoTracking())
            .ToListAsync()
            .ContinueWith(task => (IReadOnlyList<RefereePanelResponse>)task.Result);
    }

    public Task<RefereePanelResponse?> GetResponseByIdAsync(string id)
    {
        return ProjectResponses(_context.RefereePanels.AsNoTracking().Where(panel => panel.RefereePanelId == id))
            .SingleOrDefaultAsync();
    }

    public Task<bool> ExistsAsync(string id)
    {
        return _context.RefereePanels.AnyAsync(panel => panel.RefereePanelId == id);
    }

    public Task<bool> RaceExistsAsync(string raceId)
    {
        return _context.Races.AnyAsync(race => race.RaceID == raceId);
    }

    public Task<IReadOnlyList<string>> GetExistingRefereeIdsAsync(IReadOnlyCollection<string> refereeIds)
    {
        return _context.Referees
            .Where(referee => refereeIds.Contains(referee.RefereeId))
            .Select(referee => referee.RefereeId)
            .ToListAsync()
            .ContinueWith(task => (IReadOnlyList<string>)task.Result);
    }

    public async Task<RefereePanel?> GetByIdAsync(string id)
    {
        return await _context.RefereePanels.FindAsync(id);
    }

    public void Add(RefereePanel panel)
    {
        _context.RefereePanels.Add(panel);
    }

    public void Remove(RefereePanel panel)
    {
        _context.RefereePanels.Remove(panel);
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

    private static IQueryable<RefereePanelResponse> ProjectResponses(IQueryable<RefereePanel> query)
    {
        return query
            .OrderBy(panel => panel.RefereePanelId)
            .Select(panel => new RefereePanelResponse(
                panel.RefereePanelId,
                panel.RaceId,
                panel.LeadID,
                panel.Member1ID,
                panel.Member2ID));
    }
}
