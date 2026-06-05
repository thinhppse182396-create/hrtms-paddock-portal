using HRTMS.Models.DTOs;
using HRTMS.Data;
using HRTMS.Models.on_board;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public interface ITrackRepository
{
    Task<IReadOnlyList<TrackResponse>> GetResponsesAsync();
    Task<TrackResponse?> GetResponseByIdAsync(string id);
    Task<bool> ExistsAsync(string id);
    Task<Tracks?> GetByIdAsync(string id);
    void Add(Tracks track);
    void Remove(Tracks track);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class TrackRepository : ITrackRepository
{
    private readonly ApplicationDbContext _context;

    public TrackRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<IReadOnlyList<TrackResponse>> GetResponsesAsync()
    {
        return _context.Tracks
            .AsNoTracking()
            .OrderBy(track => track.TrackName)
            .Select(track => ToResponse(track))
            .ToListAsync()
            .ContinueWith(task => (IReadOnlyList<TrackResponse>)task.Result);
    }

    public Task<TrackResponse?> GetResponseByIdAsync(string id)
    {
        return _context.Tracks
            .AsNoTracking()
            .Where(item => item.TrackId == id)
            .Select(track => ToResponse(track))
            .SingleOrDefaultAsync();
    }

    public Task<bool> ExistsAsync(string id)
    {
        return _context.Tracks.AnyAsync(track => track.TrackId == id);
    }

    public async Task<Tracks?> GetByIdAsync(string id)
    {
        return await _context.Tracks.FindAsync(id);
    }

    public void Add(Tracks track)
    {
        _context.Tracks.Add(track);
    }

    public void Remove(Tracks track)
    {
        _context.Tracks.Remove(track);
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

    private static TrackResponse ToResponse(Tracks track)
    {
        return new TrackResponse(
            track.TrackId,
            track.TrackName,
            track.Length,
            track.Width,
            track.MaxLanes,
            track.AvailableDistances);
    }
}
