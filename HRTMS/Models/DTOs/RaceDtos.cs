using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public static class RaceStatusCodes
{
    public const string Scheduled = "SCHEDULED";
    public const string Ongoing = "ONGOING";
    public const string Finished = "FINISHED";
    public const string Published = "PUBLISHED";
    public const string Cancelled = "CANCELLED";
}

public record CreateRaceRequest(
    [Required] string RaceId,
    [Required] string TournamentId,
    [Required] string RaceName,
    DateTime ScheduledAt,
    [Range(1, int.MaxValue)] int RoundNumber,
    [Range(1, int.MaxValue)] int MinAge,
    [Range(1, int.MaxValue)] int MaxAge,
    [Range(1, int.MaxValue)] int MinWeight,
    [Range(1, int.MaxValue)] int MaxWeight,
    string AllowedBreeds,
    bool RequiresValidHealthCert,
    [Required] string Distance,
    [Range(1, int.MaxValue)] int Lanes,
    string StatusCode = RaceStatusCodes.Scheduled);

public record UpdateRaceRequest(
    [Required] string TournamentId,
    [Required] string RaceName,
    DateTime ScheduledAt,
    [Range(1, int.MaxValue)] int RoundNumber,
    [Range(1, int.MaxValue)] int MinAge,
    [Range(1, int.MaxValue)] int MaxAge,
    [Range(1, int.MaxValue)] int MinWeight,
    [Range(1, int.MaxValue)] int MaxWeight,
    string AllowedBreeds,
    bool RequiresValidHealthCert,
    [Required] string Distance,
    [Range(1, int.MaxValue)] int Lanes,
    [Required] string StatusCode);

public record RaceResponse(
    string RaceId,
    string TournamentId,
    string RaceName,
    DateTime ScheduledAt,
    int RoundNumber,
    int MinAge,
    int MaxAge,
    int MinWeight,
    int MaxWeight,
    string AllowedBreeds,
    bool RequiresValidHealthCert,
    string Distance,
    int Lanes,
    int StatusId,
    string StatusCode);
