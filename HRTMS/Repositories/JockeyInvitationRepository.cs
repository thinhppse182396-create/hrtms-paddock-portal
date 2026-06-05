using HRTMS.Models.DTOs;
using HRTMS.Data;
using HRTMS.Models.Roles;
using HRTMS.Models.Statuss;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public sealed record InvitationRegistrationInfo(
    string RegistrationId,
    int StatusId,
    string JockeyName,
    string? BackupJockeyId,
    DateTime ScheduledAt);

public interface IJockeyInvitationRepository
{
    Task<InvitationRegistrationInfo?> GetRegistrationInfoAsync(string registrationId);
    Task<bool> HasStatusAsync(int statusId, string entityName, string statusCode);
    Task<Status?> GetActiveStatusAsync(string entityName, string statusCode);
    Task<IReadOnlyList<string>> GetExistingJockeyIdsAsync(string registrationId, IReadOnlyCollection<string> jockeyIds);
    void AddRange(IEnumerable<JockeyInvitations> invitations);
    Task<JockeyInvitations?> GetByIdWithRegistrationRaceAsync(int id);
    Task<bool> JockeyExistsAsync(string jockeyId);
    Task<IReadOnlyList<JockeyInvitationResponse>> GetResponsesByJockeyAsync(string jockeyId);
    Task<IReadOnlyList<JockeyInvitationResponse>> GetResponsesByRegistrationAsync(string registrationId);
    Task<JockeyInvitationResponse?> GetResponseByIdAsync(int id);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class JockeyInvitationRepository : IJockeyInvitationRepository
{
    private readonly ApplicationDbContext _context;

    public JockeyInvitationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<InvitationRegistrationInfo?> GetRegistrationInfoAsync(string registrationId)
    {
        return _context.RaceRegistrations
            .AsNoTracking()
            .Where(item => item.RegistrationId == registrationId)
            .Select(item => new InvitationRegistrationInfo(
                item.RegistrationId,
                item.StatusId,
                item.JockeyName,
                item.BackupJockeyId,
                item.Race!.ScheduledAt))
            .SingleOrDefaultAsync();
    }

    public Task<bool> HasStatusAsync(int statusId, string entityName, string statusCode)
    {
        return _context.Statuses.AnyAsync(status =>
            status.StatusId == statusId &&
            status.EntityName == entityName &&
            status.StatusCode == statusCode);
    }

    public Task<Status?> GetActiveStatusAsync(string entityName, string statusCode)
    {
        return _context.Statuses.SingleOrDefaultAsync(status =>
            status.EntityName == entityName &&
            status.StatusCode == statusCode &&
            status.IsActive);
    }

    public Task<IReadOnlyList<string>> GetExistingJockeyIdsAsync(string registrationId, IReadOnlyCollection<string> jockeyIds)
    {
        return _context.JockeyInvitations
            .Where(invitation =>
                invitation.RegistrationId == registrationId &&
                jockeyIds.Contains(invitation.JockeyId))
            .Select(invitation => invitation.JockeyId)
            .ToListAsync()
            .ContinueWith(task => (IReadOnlyList<string>)task.Result);
    }

    public void AddRange(IEnumerable<JockeyInvitations> invitations)
    {
        _context.JockeyInvitations.AddRange(invitations);
    }

    public Task<JockeyInvitations?> GetByIdWithRegistrationRaceAsync(int id)
    {
        return _context.JockeyInvitations
            .Include(item => item.Registration)
            .ThenInclude(registration => registration!.Race)
            .SingleOrDefaultAsync(item => item.Id == id);
    }

    public Task<bool> JockeyExistsAsync(string jockeyId)
    {
        return _context.Jockeys.AnyAsync(jockey => jockey.JockeyId == jockeyId);
    }

    public Task<IReadOnlyList<JockeyInvitationResponse>> GetResponsesByJockeyAsync(string jockeyId)
    {
        return ProjectResponses(_context.JockeyInvitations.AsNoTracking().Where(invitation => invitation.JockeyId == jockeyId))
            .ToListAsync()
            .ContinueWith(task => (IReadOnlyList<JockeyInvitationResponse>)task.Result);
    }

    public Task<IReadOnlyList<JockeyInvitationResponse>> GetResponsesByRegistrationAsync(string registrationId)
    {
        return ProjectResponses(_context.JockeyInvitations.AsNoTracking().Where(invitation => invitation.RegistrationId == registrationId))
            .ToListAsync()
            .ContinueWith(task => (IReadOnlyList<JockeyInvitationResponse>)task.Result);
    }

    public Task<JockeyInvitationResponse?> GetResponseByIdAsync(int id)
    {
        return ProjectResponses(_context.JockeyInvitations.AsNoTracking().Where(invitation => invitation.Id == id))
            .SingleOrDefaultAsync();
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

    private static IQueryable<JockeyInvitationResponse> ProjectResponses(IQueryable<JockeyInvitations> query)
    {
        return query
            .OrderBy(invitation => invitation.Id)
            .Select(invitation => new JockeyInvitationResponse(
                invitation.Id,
                invitation.RegistrationId,
                invitation.JockeyId,
                invitation.StatusId,
                invitation.Status!.StatusCode));
    }
}
