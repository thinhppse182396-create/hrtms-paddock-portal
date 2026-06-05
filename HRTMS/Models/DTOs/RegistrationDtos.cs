using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public record CreateRegistrationRequest(
    [Required] string RegistrationId,
    [Required] string RaceId,
    [Required] string HorseId,
    [Required] string JockeyId,
    string? BackupJockeyId);

public record UpdateRegistrationStatusRequest(
    [Required] string StatusCode);

public record UpdateRegistrationJockeyRequest(
    [Required] string JockeyId,
    string? BackupJockeyId);

public record RegistrationResponse(
    string RegistrationId,
    string RaceId,
    string HorseId,
    string JockeyId,
    string? BackupJockeyId,
    int StatusId,
    string StatusCode);
