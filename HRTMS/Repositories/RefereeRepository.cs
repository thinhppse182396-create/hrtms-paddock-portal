using HRTMS.Data;
using HRTMS.Models.Roles;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public interface IRefereeRepository
{
    Task<bool> IsIdentityInUseAsync(string refereeId, string licenseNo, string accountId);
    Task<bool> IsIdentityInUseByOtherAsync(string refereeId, string licenseNo, string accountId);
    Task<bool> AccountIsRefereeAsync(string accountId);
    Task<Referee?> GetByIdAsync(string id);
    void Add(Referee referee);
    void Remove(Referee referee);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class RefereeRepository : IRefereeRepository
{
    private readonly ApplicationDbContext _context;

    public RefereeRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<bool> IsIdentityInUseAsync(string refereeId, string licenseNo, string accountId)
    {
        return _context.Referees.AnyAsync(item =>
            item.RefereeId == refereeId ||
            item.RefereeLicenseNumber == licenseNo ||
            item.AccountId == accountId);
    }

    public Task<bool> IsIdentityInUseByOtherAsync(string refereeId, string licenseNo, string accountId)
    {
        return _context.Referees.AnyAsync(item =>
            item.RefereeId != refereeId &&
            (item.RefereeLicenseNumber == licenseNo || item.AccountId == accountId));
    }

    public async Task<bool> AccountIsRefereeAsync(string accountId)
    {
        var account = await _context.Accounts
            .AsNoTracking()
            .Include(item => item.Role)
            .SingleOrDefaultAsync(item => item.AccountId == accountId);

        return account?.Role?.RoleCode == "REFEREE";
    }

    public async Task<Referee?> GetByIdAsync(string id)
    {
        return await _context.Referees.FindAsync(id);
    }

    public void Add(Referee referee)
    {
        _context.Referees.Add(referee);
    }

    public void Remove(Referee referee)
    {
        _context.Referees.Remove(referee);
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
}
