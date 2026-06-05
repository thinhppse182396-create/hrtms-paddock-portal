using HRTMS.Models.DTOs;
using HRTMS.Models.on_board;
using HRTMS.Repositories;

namespace HRTMS.Services;

public interface IPortalEntityService
{
    Task<ServiceResult<ViolationRecord>> CreateViolationAsync(ViolationRequest request);
    Task<ServiceResult<ViolationRecord>> UpdateViolationAsync(string id, ViolationRequest request);
    Task<ServiceResult<bool>> DeleteViolationAsync(string id);
    Task<ServiceResult<RefereeReport>> CreateRefereeReportAsync(RefereeReportRequest request);
    Task<ServiceResult<RefereeReport>> UpdateRefereeReportAsync(string id, RefereeReportRequest request);
    Task<ServiceResult<AwardCeremony>> CreateAwardCeremonyAsync(AwardCeremonyRequest request);
    Task<ServiceResult<AwardCeremony>> UpdateAwardCeremonyAsync(string raceId, AwardCeremonyRequest request);
    Task<ServiceResult<bool>> DeleteAwardCeremonyAsync(string raceId);
    Task<ServiceResult<string>> GetPreRaceCheckAsync(string raceId);
    Task<ServiceResult<bool>> SavePreRaceCheckAsync(string raceId, object data);
    Task<ServiceResult<string>> GetRaceControlStateAsync(string raceId);
    Task<ServiceResult<bool>> SaveRaceControlStateAsync(string raceId, object data);
    Task<IReadOnlyList<Prediction>> GetPredictionsAsync(string accountId);
    Task<ServiceResult<Prediction>> CreatePredictionAsync(PredictionRequest request);
    Task<ServiceResult<bool>> UpdateJockeyProfileAsync(string jockeyId, JockeyProfileRequest request);
}

public sealed class PortalEntityService : IPortalEntityService
{
    private readonly IPortalEntityRepository _portalEntityRepository;
    private readonly TimeProvider _timeProvider;

    public PortalEntityService(IPortalEntityRepository portalEntityRepository, TimeProvider timeProvider)
    {
        _portalEntityRepository = portalEntityRepository;
        _timeProvider = timeProvider;
    }

    public async Task<ServiceResult<ViolationRecord>> CreateViolationAsync(ViolationRequest request)
    {
        if (await _portalEntityRepository.ViolationExistsAsync(request.Id))
        {
            return ServiceResult<ViolationRecord>.Conflict("Violation ID already exists.");
        }

        var validationError = await ValidateRaceHorseJockeyAsync(request.RaceId, request.HorseId, request.JockeyId);
        if (validationError is not null)
        {
            return ServiceResult<ViolationRecord>.BadRequest(validationError);
        }

        var violation = ToViolation(request);
        _portalEntityRepository.AddViolation(violation);
        await _portalEntityRepository.SaveChangesAsync();
        return ServiceResult<ViolationRecord>.Created(violation);
    }

    public async Task<ServiceResult<ViolationRecord>> UpdateViolationAsync(string id, ViolationRequest request)
    {
        var violation = await _portalEntityRepository.GetViolationAsync(id);
        if (violation is null)
        {
            return ServiceResult<ViolationRecord>.NotFound();
        }

        var validationError = await ValidateRaceHorseJockeyAsync(request.RaceId, request.HorseId, request.JockeyId);
        if (validationError is not null)
        {
            return ServiceResult<ViolationRecord>.BadRequest(validationError);
        }

        violation.RaceId = request.RaceId;
        violation.HorseId = request.HorseId;
        violation.JockeyId = request.JockeyId;
        violation.Type = request.Type.Trim();
        violation.Severity = request.Severity.Trim();
        violation.Description = request.Description.Trim();
        await _portalEntityRepository.SaveChangesAsync();
        return ServiceResult<ViolationRecord>.Success(violation);
    }

    public async Task<ServiceResult<bool>> DeleteViolationAsync(string id)
    {
        var violation = await _portalEntityRepository.GetViolationAsync(id);
        if (violation is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        _portalEntityRepository.RemoveViolation(violation);
        await _portalEntityRepository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<RefereeReport>> CreateRefereeReportAsync(RefereeReportRequest request)
    {
        if (await _portalEntityRepository.RefereeReportExistsAsync(request.Id))
        {
            return ServiceResult<RefereeReport>.Conflict("Referee report ID already exists.");
        }

        if (!await _portalEntityRepository.RaceExistsAsync(request.RaceId) ||
            !await _portalEntityRepository.RefereeExistsAsync(request.RefereeId))
        {
            return ServiceResult<RefereeReport>.BadRequest("Race or referee does not exist.");
        }

        var report = new RefereeReport
        {
            Id = request.Id.Trim(),
            RaceId = request.RaceId.Trim(),
            RefereeId = request.RefereeId.Trim(),
            Status = request.Status.Trim().ToUpperInvariant(),
            Notes = request.Notes.Trim()
        };
        _portalEntityRepository.AddRefereeReport(report);
        await _portalEntityRepository.SaveChangesAsync();
        return ServiceResult<RefereeReport>.Created(report);
    }

    public async Task<ServiceResult<RefereeReport>> UpdateRefereeReportAsync(string id, RefereeReportRequest request)
    {
        var report = await _portalEntityRepository.GetRefereeReportAsync(id);
        if (report is null)
        {
            return ServiceResult<RefereeReport>.NotFound();
        }

        report.Status = request.Status.Trim().ToUpperInvariant();
        report.Notes = request.Notes.Trim();
        await _portalEntityRepository.SaveChangesAsync();
        return ServiceResult<RefereeReport>.Success(report);
    }

    public async Task<ServiceResult<AwardCeremony>> CreateAwardCeremonyAsync(AwardCeremonyRequest request)
    {
        if (!await _portalEntityRepository.RaceExistsAsync(request.RaceId))
        {
            return ServiceResult<AwardCeremony>.BadRequest("Race does not exist.");
        }

        if (await _portalEntityRepository.AwardCeremonyExistsAsync(request.RaceId))
        {
            return ServiceResult<AwardCeremony>.Conflict("Award ceremony already exists for this race.");
        }

        var ceremony = ToAwardCeremony(request);
        _portalEntityRepository.AddAwardCeremony(ceremony);
        await _portalEntityRepository.SaveChangesAsync();
        return ServiceResult<AwardCeremony>.Created(ceremony);
    }

    public async Task<ServiceResult<AwardCeremony>> UpdateAwardCeremonyAsync(string raceId, AwardCeremonyRequest request)
    {
        var ceremony = await _portalEntityRepository.GetAwardCeremonyAsync(raceId);
        if (ceremony is null)
        {
            return ServiceResult<AwardCeremony>.NotFound();
        }

        ceremony.ScheduledAt = request.ScheduledAt;
        ceremony.Status = request.Status.Trim().ToUpperInvariant();
        ceremony.Venue = request.Venue.Trim();
        ceremony.Notes = request.Notes.Trim();
        await _portalEntityRepository.SaveChangesAsync();
        return ServiceResult<AwardCeremony>.Success(ceremony);
    }

    public async Task<ServiceResult<bool>> DeleteAwardCeremonyAsync(string raceId)
    {
        var ceremony = await _portalEntityRepository.GetAwardCeremonyAsync(raceId);
        if (ceremony is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        _portalEntityRepository.RemoveAwardCeremony(ceremony);
        await _portalEntityRepository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<string>> GetPreRaceCheckAsync(string raceId)
    {
        var json = await _portalEntityRepository.GetPreRaceCheckJsonAsync(raceId);
        return json is null
            ? ServiceResult<string>.NotFound()
            : ServiceResult<string>.Success(json);
    }

    public async Task<ServiceResult<bool>> SavePreRaceCheckAsync(string raceId, object data)
    {
        if (!await _portalEntityRepository.RaceExistsAsync(raceId))
        {
            return ServiceResult<bool>.BadRequest("Race does not exist.");
        }

        await _portalEntityRepository.UpsertPreRaceCheckAsync(
            raceId,
            data.ToString() ?? "{}",
            _timeProvider.GetLocalNow().DateTime);
        await _portalEntityRepository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<string>> GetRaceControlStateAsync(string raceId)
    {
        var json = await _portalEntityRepository.GetRaceControlJsonAsync(raceId);
        return json is null
            ? ServiceResult<string>.NotFound()
            : ServiceResult<string>.Success(json);
    }

    public async Task<ServiceResult<bool>> SaveRaceControlStateAsync(string raceId, object data)
    {
        if (!await _portalEntityRepository.RaceExistsAsync(raceId))
        {
            return ServiceResult<bool>.BadRequest("Race does not exist.");
        }

        await _portalEntityRepository.UpsertRaceControlStateAsync(
            raceId,
            data.ToString() ?? "{}",
            _timeProvider.GetLocalNow().DateTime);
        await _portalEntityRepository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    public Task<IReadOnlyList<Prediction>> GetPredictionsAsync(string accountId)
    {
        return _portalEntityRepository.GetPredictionsByAccountAsync(accountId);
    }

    public async Task<ServiceResult<Prediction>> CreatePredictionAsync(PredictionRequest request)
    {
        var raceScheduledAt = await _portalEntityRepository.GetRaceScheduledAtAsync(request.RaceId);
        if (raceScheduledAt is null || raceScheduledAt <= _timeProvider.GetLocalNow().DateTime)
        {
            return ServiceResult<Prediction>.Conflict("Predictions close when the race starts.");
        }

        if (!await _portalEntityRepository.AccountExistsAsync(request.AccountId) ||
            !await _portalEntityRepository.HorseExistsAsync(request.HorseId))
        {
            return ServiceResult<Prediction>.BadRequest("Account or horse does not exist.");
        }

        if (await _portalEntityRepository.PredictionExistsAsync(
                request.AccountId,
                request.RaceId,
                request.HorseId))
        {
            return ServiceResult<Prediction>.Conflict("Prediction already exists for this horse and race.");
        }

        var prediction = new Prediction
        {
            AccountId = request.AccountId,
            RaceId = request.RaceId,
            HorseId = request.HorseId,
            PredictedRank = request.PredictedRank,
            CreatedAt = _timeProvider.GetLocalNow().DateTime
        };
        _portalEntityRepository.AddPrediction(prediction);
        await _portalEntityRepository.SaveChangesAsync();
        return ServiceResult<Prediction>.Created(prediction);
    }

    public async Task<ServiceResult<bool>> UpdateJockeyProfileAsync(string jockeyId, JockeyProfileRequest request)
    {
        var jockey = await _portalEntityRepository.GetJockeyAsync(jockeyId);
        if (jockey is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        jockey.Weight = request.Weight;
        jockey.Contact = request.Contact.Trim();
        await _portalEntityRepository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    private async Task<string?> ValidateRaceHorseJockeyAsync(string raceId, string horseId, string jockeyId)
    {
        if (!await _portalEntityRepository.RaceExistsAsync(raceId))
        {
            return "Race does not exist.";
        }

        if (!await _portalEntityRepository.HorseExistsAsync(horseId))
        {
            return "Horse does not exist.";
        }

        return await _portalEntityRepository.JockeyExistsAsync(jockeyId)
            ? null
            : "Jockey does not exist.";
    }

    private static ViolationRecord ToViolation(ViolationRequest request)
    {
        return new ViolationRecord
        {
            Id = request.Id.Trim(),
            RaceId = request.RaceId.Trim(),
            HorseId = request.HorseId.Trim(),
            JockeyId = request.JockeyId.Trim(),
            Type = request.Type.Trim(),
            Severity = request.Severity.Trim(),
            Description = request.Description.Trim()
        };
    }

    private static AwardCeremony ToAwardCeremony(AwardCeremonyRequest request)
    {
        return new AwardCeremony
        {
            RaceId = request.RaceId.Trim(),
            ScheduledAt = request.ScheduledAt,
            Status = request.Status.Trim().ToUpperInvariant(),
            Venue = request.Venue.Trim(),
            Notes = request.Notes.Trim()
        };
    }
}
