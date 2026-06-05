using HRTMS.Models.DTOs;
using HRTMS.Data;
using HRTMS.Models.Horses;
using HRTMS.Models.Statuss;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public interface IHorseRepository
{
    Task<IReadOnlyList<HorseResponse>> GetResponsesAsync();
    Task<HorseResponse?> GetResponseByIdAsync(string id);
    Task<IReadOnlyList<HorseResponse>> GetResponsesByOwnerAsync(string ownerId);
    Task<bool> ExistsAsync(string horseId);
    Task<bool> OwnerExistsAsync(string ownerId);
    Task<Status?> GetActiveStatusAsync(string statusCode);
    Task<Horse?> GetByIdAsync(string id);
    void Add(Horse horse);
    void Remove(Horse horse);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class HorseRepository : IHorseRepository
{
    private const string HorseEntityName = "Horse";

    private readonly ApplicationDbContext _context;

    public HorseRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<IReadOnlyList<HorseResponse>> GetResponsesAsync()
    {
        return ProjectResponses(_context.Horses.AsNoTracking()).ToListAsync()
            .ContinueWith(task => (IReadOnlyList<HorseResponse>)task.Result);
    }

    public Task<HorseResponse?> GetResponseByIdAsync(string id)
    {
        return ProjectResponses(_context.Horses.AsNoTracking().Where(item => item.HorseId == id))
            .SingleOrDefaultAsync();
    }

    public Task<IReadOnlyList<HorseResponse>> GetResponsesByOwnerAsync(string ownerId)
    {
        return ProjectResponses(_context.Horses.AsNoTracking().Where(horse => horse.OwnerId == ownerId))
            .ToListAsync()
            .ContinueWith(task => (IReadOnlyList<HorseResponse>)task.Result);
    }

    public Task<bool> ExistsAsync(string horseId)
    {
        return _context.Horses.AnyAsync(horse => horse.HorseId == horseId);
    }

    public Task<bool> OwnerExistsAsync(string ownerId)
    {
        return _context.Accounts.AnyAsync(account =>
            account.AccountId == ownerId &&
            account.Role != null &&
            account.Role.RoleCode == "HORSE_OWNER");
    }

    public Task<Status?> GetActiveStatusAsync(string statusCode)
    {
        var normalized = statusCode.Trim().ToUpperInvariant();
        return _context.Statuses.SingleOrDefaultAsync(status =>
            status.EntityName == HorseEntityName &&
            status.StatusCode == normalized &&
            status.IsActive);
    }

    public async Task<Horse?> GetByIdAsync(string id)
    {
        return await _context.Horses.FindAsync(id);
    }

    public void Add(Horse horse)
    {
        _context.Horses.Add(horse);
    }

    public void Remove(Horse horse)
    {
        _context.Horses.Remove(horse);
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

    private static IQueryable<HorseResponse> ProjectResponses(IQueryable<Horse> query)
    {
        return query
            .OrderBy(horse => horse.HourseName)
            .Select(horse => new HorseResponse(
                horse.HorseId,
                horse.HourseName,
                horse.Breed,
                horse.Age,
                horse.Weight,
                horse.Documents,
                horse.Health_Cert_Expiry,
                horse.StatusId,
                horse.Status!.StatusCode,
                horse.OwnerId));
    }
}
