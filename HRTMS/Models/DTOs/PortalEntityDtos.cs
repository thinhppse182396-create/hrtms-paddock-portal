using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public record ViolationRequest(
    [Required] string Id,
    [Required] string RaceId,
    [Required] string HorseId,
    [Required] string JockeyId,
    [Required] string Type,
    [Required] string Severity,
    [Required] string Description);

public record RefereeReportRequest(
    [Required] string Id,
    [Required] string RaceId,
    [Required] string RefereeId,
    [Required] string Status,
    string Notes = "");

public record AwardCeremonyRequest(
    [Required] string RaceId,
    DateTime ScheduledAt,
    [Required] string Status,
    [Required] string Venue,
    string Notes = "");

public record PredictionRequest(
    [Required] string AccountId,
    [Required] string RaceId,
    [Required] string HorseId,
    [Range(1, int.MaxValue)] int PredictedRank);

public record JockeyProfileRequest(
    [Range(1, 999)] int Weight,
    [Required, StringLength(200)] string Contact);
