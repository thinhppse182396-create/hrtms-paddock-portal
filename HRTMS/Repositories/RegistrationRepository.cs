using HRTMS.Models.DTOs;
using HRTMS.Data;
using HRTMS.Models.on_board;
using HRTMS.Models.Statuss;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public sealed record RegistrationRaceInfo(string StatusCode, bool IsActive, DateTime ScheduledAt);

public sealed record RegistrationHorseInfo(DateTime HealthCertExpiry, string StatusCode, bool IsActive);

public interface IRegistrationRepository
{
    Task<IReadOnlyList<RegistrationResponse>> GetResponsesAsync(string? raceId, string? statusCode);
    Task<bool> ExistsAsync(string id);
    Task<RegistrationRaceInfo?> GetRaceInfoAsync(string raceId);
    Task<RegistrationHorseInfo?> GetHorseInfoAsync(string horseId);
    Task<bool> ExistsForRaceHorseAsync(string raceId, string horseId);
    Task<IReadOnlyList<string>> GetActiveJockeyIdsAsync(IReadOnlyCollection<string> jockeyIds);
    Task<bool> ActiveJockeyExistsAsync(string jockeyId);
    Task<Status?> GetActiveStatusAsync(string statusCode);
    Task<string> GetStatusCodeAsync(int statusId);
    Task<Registration?> GetByIdAsync(string id);
    void Add(Registration registration);
    void Remove(Registration registration);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class RegistrationRepository : IRegistrationRepository
{
    private const string RegistrationEntityName = "Registration";

    private readonly ApplicationDbContext _context;

    public RegistrationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<RegistrationResponse>> GetResponsesAsync(string? raceId, string? statusCode)
    {
        var query = _context.RaceRegistrations.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(raceId))
        {
            query = query.Where(registration => registration.RaceId == raceId);
        }

        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            query = query.Where(registration =>
                registration.Status != null &&
                registration.Status.StatusCode == statusCode);
        }

        return await query
            .OrderBy(registration => registration.RegistrationId)
            .Select(registration => ToResponse(registration, registration.Status!.StatusCode))
            .ToListAsync();
    }

    public Task<bool> ExistsAsync(string id)
    {
        return _context.RaceRegistrations.AnyAsync(registration => registration.RegistrationId == id);
    }

    public Task<RegistrationRaceInfo?> GetRaceInfoAsync(string raceId)
    {
        return _context.Races
            .AsNoTracking()
            .Where(item => item.RaceID == raceId)
            .Select(item => new RegistrationRaceInfo(
                item.Status!.StatusCode,
                item.Status.IsActive,
                item.ScheduledAt))
            .SingleOrDefaultAsync();
    }

    public Task<RegistrationHorseInfo?> GetHorseInfoAsync(string horseId)
    {
        return _context.Horses
            .Where(item => item.HorseId == horseId)
            .Select(item => new RegistrationHorseInfo(
                item.Health_Cert_Expiry,
                item.Status!.StatusCode,
                item.Status.IsActive))
            .SingleOrDefaultAsync();
    }

    public Task<bool> ExistsForRaceHorseAsync(string raceId, string horseId)
    {
        return _context.RaceRegistrations.AnyAsync(registration =>
            registration.RaceId == raceId &&
            registration.HorseId == horseId);
    }

    public Task<IReadOnlyList<string>> GetActiveJockeyIdsAsync(IReadOnlyCollection<string> jockeyIds)
    {
        return _context.Jockeys
            .Where(jockey =>
                jockeyIds.Contains(jockey.JockeyId) &&
                jockey.Status != null &&
                jockey.Status.IsActive &&
                jockey.Status.StatusCode == "ACTIVE")
            .Select(jockey => jockey.JockeyId)
            .ToListAsync()
            .ContinueWith(task => (IReadOnlyList<string>)task.Result);
    }

    public Task<bool> ActiveJockeyExistsAsync(string jockeyId)
    {
        return _context.Jockeys.AnyAsync(jockey =>
            jockey.JockeyId == jockeyId &&
            jockey.Status != null &&
            jockey.Status.IsActive &&
            jockey.Status.StatusCode == "ACTIVE");
    }

    public Task<Status?> GetActiveStatusAsync(string statusCode)
    {
        var normalized = statusCode.Trim().ToUpperInvariant();
        return _context.Statuses.SingleOrDefaultAsync(status =>
            status.EntityName == RegistrationEntityName &&
            status.StatusCode == normalized &&
            status.IsActive);
    }

    public Task<string> GetStatusCodeAsync(int statusId)
    {
        return _context.Statuses
            .Where(status => status.StatusId == statusId)
            .Select(status => status.StatusCode)
            .SingleAsync();
    }

    public async Task<Registration?> GetByIdAsync(string id)
    {
        return await _context.RaceRegistrations.FindAsync(id);
    }

    public void Add(Registration registration)
    {
        _context.RaceRegistrations.Add(registration);
    }

    public void Remove(Registration registration)
    {
        _context.RaceRegistrations.Remove(registration);
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
        catch (DbUpdateException)
        {
            return PersistenceResult.Conflict;
        }
    }

    private static RegistrationResponse ToResponse(Registration registration, string statusCode)
    {
        return new RegistrationResponse(
            registration.RegistrationId,
            registration.RaceId,
            registration.HorseId,
            registration.JockeyName,
            registration.BackupJockeyId,
            registration.StatusId,
            statusCode);
    }
}
