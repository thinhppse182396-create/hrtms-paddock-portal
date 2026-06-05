using HRTMS.Data;
using HRTMS.Models.on_board;
using HRTMS.Models.Roles;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public interface IPortalEntityRepository
{
    Task<bool> ViolationExistsAsync(string id);
    Task<ViolationRecord?> GetViolationAsync(string id);
    void AddViolation(ViolationRecord violation);
    void RemoveViolation(ViolationRecord violation);
    Task<bool> RaceExistsAsync(string raceId);
    Task<bool> HorseExistsAsync(string horseId);
    Task<bool> JockeyExistsAsync(string jockeyId);
    Task<bool> RefereeExistsAsync(string refereeId);
    Task<bool> RefereeReportExistsAsync(string id);
    Task<RefereeReport?> GetRefereeReportAsync(string id);
    void AddRefereeReport(RefereeReport report);
    Task<bool> AwardCeremonyExistsAsync(string raceId);
    Task<AwardCeremony?> GetAwardCeremonyAsync(string raceId);
    void AddAwardCeremony(AwardCeremony ceremony);
    void RemoveAwardCeremony(AwardCeremony ceremony);
    Task<string?> GetPreRaceCheckJsonAsync(string raceId);
    Task UpsertPreRaceCheckAsync(string raceId, string jsonData, DateTime updatedAt);
    Task<string?> GetRaceControlJsonAsync(string raceId);
    Task UpsertRaceControlStateAsync(string raceId, string jsonData, DateTime updatedAt);
    Task<IReadOnlyList<Prediction>> GetPredictionsByAccountAsync(string accountId);
    Task<DateTime?> GetRaceScheduledAtAsync(string raceId);
    Task<bool> AccountExistsAsync(string accountId);
    Task<bool> PredictionExistsAsync(string accountId, string raceId, string horseId);
    void AddPrediction(Prediction prediction);
    Task<Jockeys?> GetJockeyAsync(string jockeyId);
    Task<PersistenceResult> SaveChangesAsync();
}

public sealed class PortalEntityRepository : IPortalEntityRepository
{
    private readonly ApplicationDbContext _context;

    public PortalEntityRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<bool> ViolationExistsAsync(string id) => _context.Violations.AnyAsync(item => item.Id == id);

    public async Task<ViolationRecord?> GetViolationAsync(string id) => await _context.Violations.FindAsync(id);

    public void AddViolation(ViolationRecord violation) => _context.Violations.Add(violation);

    public void RemoveViolation(ViolationRecord violation) => _context.Violations.Remove(violation);

    public Task<bool> RaceExistsAsync(string raceId) => _context.Races.AnyAsync(item => item.RaceID == raceId);

    public Task<bool> HorseExistsAsync(string horseId) => _context.Horses.AnyAsync(item => item.HorseId == horseId);

    public Task<bool> JockeyExistsAsync(string jockeyId) => _context.Jockeys.AnyAsync(item => item.JockeyId == jockeyId);

    public Task<bool> RefereeExistsAsync(string refereeId) => _context.Referees.AnyAsync(item => item.RefereeId == refereeId);

    public Task<bool> RefereeReportExistsAsync(string id) => _context.RefereeReports.AnyAsync(item => item.Id == id);

    public async Task<RefereeReport?> GetRefereeReportAsync(string id) => await _context.RefereeReports.FindAsync(id);

    public void AddRefereeReport(RefereeReport report) => _context.RefereeReports.Add(report);

    public Task<bool> AwardCeremonyExistsAsync(string raceId) =>
        _context.AwardCeremonies.AnyAsync(item => item.RaceId == raceId);

    public async Task<AwardCeremony?> GetAwardCeremonyAsync(string raceId) =>
        await _context.AwardCeremonies.FindAsync(raceId);

    public void AddAwardCeremony(AwardCeremony ceremony) => _context.AwardCeremonies.Add(ceremony);

    public void RemoveAwardCeremony(AwardCeremony ceremony) => _context.AwardCeremonies.Remove(ceremony);

    public Task<string?> GetPreRaceCheckJsonAsync(string raceId)
    {
        return _context.PreRaceChecks
            .AsNoTracking()
            .Where(item => item.RaceId == raceId)
            .Select(item => item.JsonData)
            .SingleOrDefaultAsync();
    }

    public async Task UpsertPreRaceCheckAsync(string raceId, string jsonData, DateTime updatedAt)
    {
        var check = await _context.PreRaceChecks.FindAsync(raceId);
        if (check is null)
        {
            check = new PreRaceCheck { RaceId = raceId };
            _context.PreRaceChecks.Add(check);
        }

        check.JsonData = jsonData;
        check.UpdatedAt = updatedAt;
    }

    public Task<string?> GetRaceControlJsonAsync(string raceId)
    {
        return _context.RaceControlStates
            .AsNoTracking()
            .Where(item => item.RaceId == raceId)
            .Select(item => item.JsonData)
            .SingleOrDefaultAsync();
    }

    public async Task UpsertRaceControlStateAsync(string raceId, string jsonData, DateTime updatedAt)
    {
        var state = await _context.RaceControlStates.FindAsync(raceId);
        if (state is null)
        {
            state = new RaceControlState { RaceId = raceId };
            _context.RaceControlStates.Add(state);
        }

        state.JsonData = jsonData;
        state.UpdatedAt = updatedAt;
    }

    public Task<IReadOnlyList<Prediction>> GetPredictionsByAccountAsync(string accountId)
    {
        return _context.Predictions
            .AsNoTracking()
            .Where(item => item.AccountId == accountId)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync()
            .ContinueWith(task => (IReadOnlyList<Prediction>)task.Result);
    }

    public Task<DateTime?> GetRaceScheduledAtAsync(string raceId)
    {
        return _context.Races
            .AsNoTracking()
            .Where(item => item.RaceID == raceId)
            .Select(item => (DateTime?)item.ScheduledAt)
            .SingleOrDefaultAsync();
    }

    public Task<bool> AccountExistsAsync(string accountId) => _context.Accounts.AnyAsync(item => item.AccountId == accountId);

    public Task<bool> PredictionExistsAsync(string accountId, string raceId, string horseId)
    {
        return _context.Predictions.AnyAsync(item =>
            item.AccountId == accountId &&
            item.RaceId == raceId &&
            item.HorseId == horseId);
    }

    public void AddPrediction(Prediction prediction) => _context.Predictions.Add(prediction);

    public async Task<Jockeys?> GetJockeyAsync(string jockeyId) => await _context.Jockeys.FindAsync(jockeyId);

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
