using HRTMS.Models.DTOs;
using HRTMS.Data;
using HRTMS.Models.Roles;
using HRTMS.Models.Statuss;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public interface IAccountRepository
{
    Task<Accounts?> GetByUsernameWithRoleAndStatusAsync(string username);
    Task<Accounts?> GetByUsernameAsync(string username);
    Task<Accounts?> GetByIdAsync(string id);
    Task<Accounts?> GetByIdWithRoleAsync(string id);
    Task<Accounts?> GetByIdWithRoleAndStatusAsync(string id);
    Task<bool> UsernameExistsAsync(string username);
    Task<IReadOnlyList<UserResponse>> GetUserResponsesAsync();
    Task<Roles?> GetActiveRoleAsync(string roleCode);
    Task<Status?> GetActiveAccountStatusAsync(string statusCode);
    void Add(Accounts account);
    void Remove(Accounts account);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class AccountRepository : IAccountRepository
{
    private const string AccountEntityName = "Account";

    private readonly ApplicationDbContext _context;

    public AccountRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<Accounts?> GetByUsernameWithRoleAndStatusAsync(string username)
    {
        return _context.Accounts
            .Include(item => item.Role)
            .Include(item => item.Status)
            .SingleOrDefaultAsync(item => item.Username == username);
    }

    public Task<Accounts?> GetByUsernameAsync(string username)
    {
        return _context.Accounts.SingleOrDefaultAsync(item => item.Username == username);
    }

    public async Task<Accounts?> GetByIdAsync(string id)
    {
        return await _context.Accounts.FindAsync(id);
    }

    public Task<Accounts?> GetByIdWithRoleAsync(string id)
    {
        return _context.Accounts
            .Include(item => item.Role)
            .SingleOrDefaultAsync(item => item.AccountId == id);
    }

    public Task<Accounts?> GetByIdWithRoleAndStatusAsync(string id)
    {
        return _context.Accounts
            .Include(item => item.Role)
            .Include(item => item.Status)
            .SingleOrDefaultAsync(item => item.AccountId == id);
    }

    public Task<bool> UsernameExistsAsync(string username)
    {
        return _context.Accounts.AnyAsync(account => account.Username == username);
    }

    public async Task<IReadOnlyList<UserResponse>> GetUserResponsesAsync()
    {
        return await _context.Accounts
            .AsNoTracking()
            .OrderBy(account => account.Username)
            .Select(account => new UserResponse(
                account.AccountId,
                account.Username,
                account.FullName,
                account.RoleId,
                account.Role!.RoleCode,
                account.Role.RoleName,
                account.StatusId,
                account.Status!.StatusCode))
            .ToListAsync();
    }

    public Task<Roles?> GetActiveRoleAsync(string roleCode)
    {
        var normalized = roleCode.Trim().ToUpperInvariant();
        return _context.Roles.SingleOrDefaultAsync(item => item.RoleCode == normalized && item.IsActive);
    }

    public Task<Status?> GetActiveAccountStatusAsync(string statusCode)
    {
        var normalized = statusCode.Trim().ToUpperInvariant();
        return _context.Statuses.SingleOrDefaultAsync(item =>
            item.EntityName == AccountEntityName &&
            item.StatusCode == normalized &&
            item.IsActive);
    }

    public void Add(Accounts account)
    {
        _context.Accounts.Add(account);
    }

    public void Remove(Accounts account)
    {
        _context.Accounts.Remove(account);
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
