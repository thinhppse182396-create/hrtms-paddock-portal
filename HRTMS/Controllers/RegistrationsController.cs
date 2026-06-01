using HRTMS.Data;
using HRTMS.Models.on_board;
using HRTMS.Models.Statuss;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("registrations")]
[Route("api/registrations")]
public class RegistrationsController : ControllerBase
{
    private const string RegistrationEntityName = "Registration";
    private const string ScheduledRaceStatusCode = "SCHEDULED";
    private const string PendingStatusCode = "PENDING";

    private readonly ApplicationDbContext _context;

    public RegistrationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RegistrationResponse>>> GetRegistrations(
        [FromQuery] string? raceId,
        [FromQuery] string? status)
    {
        var query = _context.RaceRegistrations.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(raceId))
        {
            query = query.Where(registration => registration.RaceId == raceId);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var statusCode = status.Trim().ToUpperInvariant();
            query = query.Where(registration =>
                registration.Status != null &&
                registration.Status.StatusCode == statusCode);
        }

        var registrations = await query
            .OrderBy(registration => registration.RegistrationId)
            .Select(registration => new RegistrationResponse(
                registration.RegistrationId,
                registration.RaceId,
                registration.HorseId,
                registration.JockeyName,
                registration.BackupJockeyId,
                registration.StatusId,
                registration.Status!.StatusCode))
            .ToListAsync();

        return Ok(registrations);
    }

    [HttpPost]
    public async Task<ActionResult<RegistrationResponse>> CreateRegistration(
        CreateRegistrationRequest request)
    {
        if (await _context.RaceRegistrations.AnyAsync(registration =>
            registration.RegistrationId == request.RegistrationId))
        {
            return Conflict(new { message = "Registration ID already exists." });
        }

        var race = await _context.Races
            .AsNoTracking()
            .Where(item => item.RaceID == request.RaceId)
            .Select(item => new
            {
                StatusCode = item.Status!.StatusCode,
                item.Status.IsActive
            })
            .SingleOrDefaultAsync();

        if (race is null)
        {
            return NotFound(new { message = "Race does not exist." });
        }

        if (!race.IsActive || race.StatusCode != ScheduledRaceStatusCode)
        {
            return Conflict(new { message = "Registrations can only be created for an open race." });
        }

        var validationError = await ValidateReferences(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        if (await _context.RaceRegistrations.AnyAsync(registration =>
            registration.RaceId == request.RaceId &&
            registration.HorseId == request.HorseId))
        {
            return Conflict(new { message = "This horse is already registered for this race." });
        }

        var pendingStatus = await FindRegistrationStatus(PendingStatusCode);
        if (pendingStatus is null)
        {
            return Problem("The pending registration status is not configured.");
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

        _context.RaceRegistrations.Add(registration);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            return Conflict(new { message = "This horse is already registered for this race." });
        }

        return CreatedAtAction(
            nameof(GetRegistrations),
            new { raceId = registration.RaceId },
            ToResponse(registration, pendingStatus.StatusCode));
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<RegistrationResponse>> UpdateRegistrationStatus(
        string id,
        UpdateRegistrationStatusRequest request)
    {
        var registration = await _context.RaceRegistrations.FindAsync(id);
        if (registration is null)
        {
            return NotFound();
        }

        var status = await FindRegistrationStatus(request.StatusCode);
        if (status is null)
        {
            return BadRequest(new { message = "Registration status does not exist or is inactive." });
        }

        registration.StatusId = status.StatusId;
        await _context.SaveChangesAsync();

        return Ok(ToResponse(registration, status.StatusCode));
    }

    private async Task<string?> ValidateReferences(CreateRegistrationRequest request)
    {
        if (!await _context.Horses.AnyAsync(horse => horse.HorseId == request.HorseId))
        {
            return "Horse does not exist.";
        }

        var jockeyIds = new[] { request.JockeyId, request.BackupJockeyId }
            .Where(jockeyId => !string.IsNullOrWhiteSpace(jockeyId))
            .Cast<string>()
            .ToArray();

        if (jockeyIds.Distinct().Count() != jockeyIds.Length)
        {
            return "Primary and backup jockey must be different.";
        }

        var existingJockeyIds = await _context.Jockeys
            .Where(jockey => jockeyIds.Contains(jockey.JockeyId))
            .Select(jockey => jockey.JockeyId)
            .ToListAsync();

        var missingJockeyIds = jockeyIds.Except(existingJockeyIds).ToArray();
        return missingJockeyIds.Length == 0
            ? null
            : $"Jockey does not exist: {string.Join(", ", missingJockeyIds)}.";
    }

    private async Task<Status?> FindRegistrationStatus(string statusCode)
    {
        var normalizedStatusCode = statusCode.Trim().ToUpperInvariant();

        return await _context.Statuses.SingleOrDefaultAsync(status =>
            status.EntityName == RegistrationEntityName &&
            status.StatusCode == normalizedStatusCode &&
            status.IsActive);
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

    public record CreateRegistrationRequest(
        [Required] string RegistrationId,
        [Required] string RaceId,
        [Required] string HorseId,
        [Required] string JockeyId,
        string? BackupJockeyId);

    public record UpdateRegistrationStatusRequest(
        [Required] string StatusCode);

    public record RegistrationResponse(
        string RegistrationId,
        string RaceId,
        string HorseId,
        string JockeyId,
        string? BackupJockeyId,
        int StatusId,
        string StatusCode);
}
