using HRTMS.Models.DTOs;
using HRTMS.Services.Rules;
using HRTMS.Models.Roles;
using HRTMS.Repositories;

namespace HRTMS.Services;

public interface IJockeyInvitationService
{
    Task<ServiceResult<IReadOnlyList<JockeyInvitationResponse>>> CreateJockeyInvitationsAsync(CreateJockeyInvitationsRequest request);
    Task<ServiceResult<JockeyInvitationResponse>> AcceptJockeyInvitationAsync(int id);
    Task<ServiceResult<IReadOnlyList<JockeyInvitationResponse>>> GetJockeyInvitationsAsync(string jockeyId);
}

public sealed class JockeyInvitationService : IJockeyInvitationService
{
    private const string InvitationEntityName = "JockeyInvitation";
    private const string RegistrationEntityName = "Registration";
    private const string AcceptedStatusCode = "ACCEPTED";
    private const string ApprovedStatusCode = "APPROVED";
    private const string PendingStatusCode = "PENDING";

    private readonly IJockeyInvitationRepository _jockeyInvitationRepository;
    private readonly TimeProvider _timeProvider;

    public JockeyInvitationService(
        IJockeyInvitationRepository jockeyInvitationRepository,
        TimeProvider timeProvider)
    {
        _jockeyInvitationRepository = jockeyInvitationRepository;
        _timeProvider = timeProvider;
    }

    public async Task<ServiceResult<IReadOnlyList<JockeyInvitationResponse>>> CreateJockeyInvitationsAsync(
        CreateJockeyInvitationsRequest request)
    {
        var registration = await _jockeyInvitationRepository.GetRegistrationInfoAsync(request.RegistrationId);
        if (registration is null)
        {
            return ServiceResult<IReadOnlyList<JockeyInvitationResponse>>.NotFound("Registration does not exist.");
        }

        if (!await _jockeyInvitationRepository.HasStatusAsync(
                registration.StatusId,
                RegistrationEntityName,
                ApprovedStatusCode))
        {
            return ServiceResult<IReadOnlyList<JockeyInvitationResponse>>.Conflict("Jockey invitations can only be created for an approved registration.");
        }

        if (!SchedulingRules.IsInvitationResponseOpen(
                registration.ScheduledAt,
                SchedulingRules.LocalNow(_timeProvider)))
        {
            return ServiceResult<IReadOnlyList<JockeyInvitationResponse>>.Conflict($"Jockey invitations close {SchedulingRules.InvitationResponseLeadHours} hours before race start.");
        }

        var pendingStatus = await _jockeyInvitationRepository.GetActiveStatusAsync(InvitationEntityName, PendingStatusCode);
        if (pendingStatus is null)
        {
            return ServiceResult<IReadOnlyList<JockeyInvitationResponse>>.Problem("The pending jockey invitation status is not configured.");
        }

        var jockeyIds = new[] { registration.JockeyName, registration.BackupJockeyId }
            .Where(jockeyId => !string.IsNullOrWhiteSpace(jockeyId))
            .Cast<string>()
            .Distinct()
            .ToArray();

        var existingJockeyIds = await _jockeyInvitationRepository.GetExistingJockeyIdsAsync(
            registration.RegistrationId,
            jockeyIds);

        var now = SchedulingRules.LocalNow(_timeProvider);
        var newInvitations = jockeyIds
            .Except(existingJockeyIds)
            .Select(jockeyId => new JockeyInvitations
            {
                RegistrationId = registration.RegistrationId,
                JockeyId = jockeyId,
                StatusId = pendingStatus.StatusId,
                CreatedAt = now
            })
            .ToList();

        if (newInvitations.Count > 0)
        {
            _jockeyInvitationRepository.AddRange(newInvitations);
            await _jockeyInvitationRepository.SaveChangesAsync();
        }

        var invitations = await _jockeyInvitationRepository.GetResponsesByRegistrationAsync(registration.RegistrationId);
        return ServiceResult<IReadOnlyList<JockeyInvitationResponse>>.Created(invitations);
    }

    public async Task<ServiceResult<JockeyInvitationResponse>> AcceptJockeyInvitationAsync(int id)
    {
        var invitation = await _jockeyInvitationRepository.GetByIdWithRegistrationRaceAsync(id);
        if (invitation is null)
        {
            return ServiceResult<JockeyInvitationResponse>.NotFound();
        }

        var acceptedStatus = await _jockeyInvitationRepository.GetActiveStatusAsync(InvitationEntityName, AcceptedStatusCode);
        if (acceptedStatus is null)
        {
            return ServiceResult<JockeyInvitationResponse>.Problem("The accepted jockey invitation status is not configured.");
        }

        if (invitation.StatusId != acceptedStatus.StatusId &&
            !await _jockeyInvitationRepository.HasStatusAsync(invitation.StatusId, InvitationEntityName, PendingStatusCode))
        {
            return ServiceResult<JockeyInvitationResponse>.Conflict("Only pending jockey invitations can be accepted.");
        }

        if (invitation.StatusId != acceptedStatus.StatusId &&
            !SchedulingRules.IsInvitationResponseOpen(
                invitation.Registration!.Race!.ScheduledAt,
                SchedulingRules.LocalNow(_timeProvider)))
        {
            return ServiceResult<JockeyInvitationResponse>.Conflict($"Jockey invitations close {SchedulingRules.InvitationResponseLeadHours} hours before race start.");
        }

        if (invitation.StatusId != acceptedStatus.StatusId)
        {
            invitation.StatusId = acceptedStatus.StatusId;
            await _jockeyInvitationRepository.SaveChangesAsync();
        }

        var response = await _jockeyInvitationRepository.GetResponseByIdAsync(id);
        return response is null
            ? ServiceResult<JockeyInvitationResponse>.Problem("Jockey invitation was saved but could not be read back.")
            : ServiceResult<JockeyInvitationResponse>.Success(response);
    }

    public async Task<ServiceResult<IReadOnlyList<JockeyInvitationResponse>>> GetJockeyInvitationsAsync(string jockeyId)
    {
        if (!await _jockeyInvitationRepository.JockeyExistsAsync(jockeyId))
        {
            return ServiceResult<IReadOnlyList<JockeyInvitationResponse>>.NotFound("Jockey does not exist.");
        }

        var invitations = await _jockeyInvitationRepository.GetResponsesByJockeyAsync(jockeyId);
        return ServiceResult<IReadOnlyList<JockeyInvitationResponse>>.Success(invitations);
    }
}
