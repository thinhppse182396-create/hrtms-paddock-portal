using HRTMS.Models.DTOs;
using HRTMS.Services.Rules;
using HRTMS.Models.on_board;
using HRTMS.Repositories;

namespace HRTMS.Services;

public interface IRegistrationService
{
    Task<IReadOnlyList<RegistrationResponse>> GetRegistrationsAsync(string? raceId, string? status);
    Task<ServiceResult<RegistrationResponse>> CreateRegistrationAsync(CreateRegistrationRequest request);
    Task<ServiceResult<RegistrationResponse>> UpdateRegistrationStatusAsync(string id, UpdateRegistrationStatusRequest request);
    Task<ServiceResult<RegistrationResponse>> UpdateRegistrationJockeyAsync(string id, UpdateRegistrationJockeyRequest request);
    Task<ServiceResult<bool>> DeleteRegistrationAsync(string id);
}

public sealed class RegistrationService : IRegistrationService
{
    private const string ScheduledRaceStatusCode = "SCHEDULED";
    private const string PendingStatusCode = "PENDING";

    private readonly IRegistrationRepository _registrationRepository;
    private readonly TimeProvider _timeProvider;

    public RegistrationService(IRegistrationRepository registrationRepository, TimeProvider timeProvider)
    {
        _registrationRepository = registrationRepository;
        _timeProvider = timeProvider;
    }

    public Task<IReadOnlyList<RegistrationResponse>> GetRegistrationsAsync(string? raceId, string? status)
    {
        return _registrationRepository.GetResponsesAsync(
            raceId,
            string.IsNullOrWhiteSpace(status) ? null : status.Trim().ToUpperInvariant());
    }

    public async Task<ServiceResult<RegistrationResponse>> CreateRegistrationAsync(CreateRegistrationRequest request)
    {
        if (await _registrationRepository.ExistsAsync(request.RegistrationId))
        {
            return ServiceResult<RegistrationResponse>.Conflict("Registration ID already exists.");
        }

        var race = await _registrationRepository.GetRaceInfoAsync(request.RaceId);
        if (race is null)
        {
            return ServiceResult<RegistrationResponse>.NotFound("Race does not exist.");
        }

        if (!race.IsActive || race.StatusCode != ScheduledRaceStatusCode)
        {
            return ServiceResult<RegistrationResponse>.Conflict("Registrations can only be created for an open race.");
        }

        if (!SchedulingRules.IsRegistrationOpen(race.ScheduledAt, SchedulingRules.LocalNow(_timeProvider).Date))
        {
            return ServiceResult<RegistrationResponse>.Conflict($"Registrations close {SchedulingRules.RegistrationLeadDays} days before race day.");
        }

        var validationError = await ValidateReferencesAsync(request, race.ScheduledAt);
        if (validationError is not null)
        {
            return ServiceResult<RegistrationResponse>.BadRequest(validationError);
        }

        if (await _registrationRepository.ExistsForRaceHorseAsync(request.RaceId, request.HorseId))
        {
            return ServiceResult<RegistrationResponse>.Conflict("This horse is already registered for this race.");
        }

        var pendingStatus = await _registrationRepository.GetActiveStatusAsync(PendingStatusCode);
        if (pendingStatus is null)
        {
            return ServiceResult<RegistrationResponse>.Problem("The pending registration status is not configured.");
        }

        var registration = new Registration
        {
            RegistrationId = request.RegistrationId,
            RaceId = request.RaceId,
            HorseId = request.HorseId,
            JockeyName = request.JockeyId,
            BackupJockeyId = request.BackupJockeyId,
            StatusId = pendingStatus.StatusId
        };

        _registrationRepository.Add(registration);
        var saved = await _registrationRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<RegistrationResponse>.Conflict("This horse is already registered for this race.");
        }

        return ServiceResult<RegistrationResponse>.Created(ToResponse(registration, pendingStatus.StatusCode));
    }

    public async Task<ServiceResult<RegistrationResponse>> UpdateRegistrationStatusAsync(
        string id,
        UpdateRegistrationStatusRequest request)
    {
        var registration = await _registrationRepository.GetByIdAsync(id);
        if (registration is null)
        {
            return ServiceResult<RegistrationResponse>.NotFound();
        }

        var status = await _registrationRepository.GetActiveStatusAsync(request.StatusCode);
        if (status is null)
        {
            return ServiceResult<RegistrationResponse>.BadRequest("Registration status does not exist or is inactive.");
        }

        registration.StatusId = status.StatusId;
        await _registrationRepository.SaveChangesAsync();

        return ServiceResult<RegistrationResponse>.Success(ToResponse(registration, status.StatusCode));
    }

    public async Task<ServiceResult<RegistrationResponse>> UpdateRegistrationJockeyAsync(
        string id,
        UpdateRegistrationJockeyRequest request)
    {
        var registration = await _registrationRepository.GetByIdAsync(id);
        if (registration is null)
        {
            return ServiceResult<RegistrationResponse>.NotFound();
        }

        if (!await _registrationRepository.ActiveJockeyExistsAsync(request.JockeyId))
        {
            return ServiceResult<RegistrationResponse>.BadRequest("Jockey does not exist or is inactive.");
        }

        registration.JockeyName = request.JockeyId;
        registration.BackupJockeyId = request.BackupJockeyId;
        await _registrationRepository.SaveChangesAsync();
        var statusCode = await _registrationRepository.GetStatusCodeAsync(registration.StatusId);

        return ServiceResult<RegistrationResponse>.Success(ToResponse(registration, statusCode));
    }

    public async Task<ServiceResult<bool>> DeleteRegistrationAsync(string id)
    {
        var registration = await _registrationRepository.GetByIdAsync(id);
        if (registration is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        _registrationRepository.Remove(registration);
        var saved = await _registrationRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<bool>.Conflict("Registration cannot be deleted because it is in use.");
        }

        return ServiceResult<bool>.Success(true);
    }

    private async Task<string?> ValidateReferencesAsync(CreateRegistrationRequest request, DateTime scheduledAt)
    {
        var horse = await _registrationRepository.GetHorseInfoAsync(request.HorseId);
        if (horse is null)
        {
            return "Horse does not exist.";
        }

        if (!horse.IsActive || horse.StatusCode != "ELIGIBLE")
        {
            return "Horse is not eligible to race.";
        }

        if (!SchedulingRules.IsCertificateValidFor(horse.HealthCertExpiry, scheduledAt))
        {
            return "Horse health certificate expires before race day.";
        }

        var jockeyIds = new[] { request.JockeyId, request.BackupJockeyId }
            .Where(jockeyId => !string.IsNullOrWhiteSpace(jockeyId))
            .Cast<string>()
            .ToArray();

        if (jockeyIds.Distinct().Count() != jockeyIds.Length)
        {
            return "Primary and backup jockey must be different.";
        }

        var activeJockeyIds = await _registrationRepository.GetActiveJockeyIdsAsync(jockeyIds);
        var unavailableJockeyIds = jockeyIds.Except(activeJockeyIds).ToArray();
        return unavailableJockeyIds.Length == 0
            ? null
            : $"Jockey does not exist or is inactive: {string.Join(", ", unavailableJockeyIds)}.";
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
