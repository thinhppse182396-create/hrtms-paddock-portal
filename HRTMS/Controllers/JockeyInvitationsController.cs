using HRTMS.Data;
using HRTMS.Models.Roles;
using HRTMS.Models.Statuss;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("jockeyInvitations")]
public class JockeyInvitationsController : ControllerBase
{
    private const string InvitationEntityName = "JockeyInvitation";
    private const string RegistrationEntityName = "Registration";
    private const string AcceptedStatusCode = "ACCEPTED";
    private const string ApprovedStatusCode = "APPROVED";
    private const string PendingStatusCode = "PENDING";

    private readonly ApplicationDbContext _context;

    public JockeyInvitationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<IEnumerable<JockeyInvitationResponse>>> CreateJockeyInvitations(
        CreateJockeyInvitationsRequest request)
    {
        var registration = await _context.RaceRegistrations
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.RegistrationId == request.RegistrationId);

        if (registration is null)
        {
            return NotFound(new { message = "Registration does not exist." });
        }

        if (!await HasStatus(registration.StatusId, RegistrationEntityName, ApprovedStatusCode))
        {
            return Conflict(new { message = "Jockey invitations can only be created for an approved registration." });
        }

        var pendingStatus = await FindStatus(InvitationEntityName, PendingStatusCode);
        if (pendingStatus is null)
        {
            return Problem("The pending jockey invitation status is not configured.");
        }

        var jockeyIds = new[] { registration.JockeyName, registration.BackupJockeyId }
            .Where(jockeyId => !string.IsNullOrWhiteSpace(jockeyId))
            .Cast<string>()
            .Distinct()
            .ToArray();

        var existingJockeyIds = await _context.JockeyInvitations
            .Where(invitation =>
                invitation.RegistrationId == registration.RegistrationId &&
                jockeyIds.Contains(invitation.JockeyId))
            .Select(invitation => invitation.JockeyId)
            .ToListAsync();

        var newInvitations = jockeyIds
            .Except(existingJockeyIds)
            .Select(jockeyId => new JockeyInvitations
            {
                RegistrationId = registration.RegistrationId,
                JockeyId = jockeyId,
                StatusId = pendingStatus.StatusId
            })
            .ToList();

        if (newInvitations.Count > 0)
        {
            _context.JockeyInvitations.AddRange(newInvitations);
            await _context.SaveChangesAsync();
        }

        var invitations = await GetInvitationsByRegistration(registration.RegistrationId);
        return Created("/jockeyInvitations", invitations);
    }

    [HttpPatch("{id:int}/accept")]
    public async Task<ActionResult<JockeyInvitationResponse>> AcceptJockeyInvitation(int id)
    {
        var invitation = await _context.JockeyInvitations.FindAsync(id);
        if (invitation is null)
        {
            return NotFound();
        }

        var acceptedStatus = await FindStatus(InvitationEntityName, AcceptedStatusCode);
        if (acceptedStatus is null)
        {
            return Problem("The accepted jockey invitation status is not configured.");
        }

        if (invitation.StatusId != acceptedStatus.StatusId &&
            !await HasStatus(invitation.StatusId, InvitationEntityName, PendingStatusCode))
        {
            return Conflict(new { message = "Only pending jockey invitations can be accepted." });
        }

        if (invitation.StatusId != acceptedStatus.StatusId)
        {
            invitation.StatusId = acceptedStatus.StatusId;
            await _context.SaveChangesAsync();
        }

        return Ok(await GetInvitation(id));
    }

    [HttpGet("jockey/{jockeyId}")]
    public async Task<ActionResult<IEnumerable<JockeyInvitationResponse>>> GetJockeyInvitations(
        string jockeyId)
    {
        if (!await _context.Jockeys.AnyAsync(jockey => jockey.JockeyId == jockeyId))
        {
            return NotFound(new { message = "Jockey does not exist." });
        }

        var invitations = await _context.JockeyInvitations
            .AsNoTracking()
            .Where(invitation => invitation.JockeyId == jockeyId)
            .OrderBy(invitation => invitation.Id)
            .Select(invitation => new JockeyInvitationResponse(
                invitation.Id,
                invitation.RegistrationId,
                invitation.JockeyId,
                invitation.StatusId,
                invitation.Status!.StatusCode))
            .ToListAsync();

        return Ok(invitations);
    }

    private async Task<List<JockeyInvitationResponse>> GetInvitationsByRegistration(
        string registrationId)
    {
        return await _context.JockeyInvitations
            .AsNoTracking()
            .Where(invitation => invitation.RegistrationId == registrationId)
            .OrderBy(invitation => invitation.Id)
            .Select(invitation => new JockeyInvitationResponse(
                invitation.Id,
                invitation.RegistrationId,
                invitation.JockeyId,
                invitation.StatusId,
                invitation.Status!.StatusCode))
            .ToListAsync();
    }

    private async Task<JockeyInvitationResponse?> GetInvitation(int id)
    {
        return await _context.JockeyInvitations
            .AsNoTracking()
            .Where(invitation => invitation.Id == id)
            .Select(invitation => new JockeyInvitationResponse(
                invitation.Id,
                invitation.RegistrationId,
                invitation.JockeyId,
                invitation.StatusId,
                invitation.Status!.StatusCode))
            .SingleOrDefaultAsync();
    }

    private async Task<bool> HasStatus(int statusId, string entityName, string statusCode)
    {
        return await _context.Statuses.AnyAsync(status =>
            status.StatusId == statusId &&
            status.EntityName == entityName &&
            status.StatusCode == statusCode);
    }

    private async Task<Status?> FindStatus(string entityName, string statusCode)
    {
        return await _context.Statuses.SingleOrDefaultAsync(status =>
            status.EntityName == entityName &&
            status.StatusCode == statusCode &&
            status.IsActive);
    }

    public record CreateJockeyInvitationsRequest(
        [Required] string RegistrationId);

    public record JockeyInvitationResponse(
        int Id,
        string RegistrationId,
        string JockeyId,
        int StatusId,
        string StatusCode);
}
