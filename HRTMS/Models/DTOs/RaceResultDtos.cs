using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public record CreateRaceResultRequest(
    [Required] string RaceId,
    [Required] string HorseId,
    string? JockeyId,
    [Range(1, int.MaxValue)] int Rank,
    string FinishTime = "",
    bool Disqualified = false,
    bool Published = false,
    string Violation = "",
    [Range(typeof(decimal), "0", "9999999999999999.99")]
    decimal? PrizeMoney = null);

public record UpdateRaceResultRequest(
    string? JockeyId,
    [Range(1, int.MaxValue)] int Rank,
    string FinishTime = "",
    bool Disqualified = false,
    bool Published = false,
    string Violation = "",
    [Range(typeof(decimal), "0", "9999999999999999.99")]
    decimal? PrizeMoney = null);

public record RaceResultResponse(
    int Id,
    string RaceId,
    string RaceName,
    string HorseId,
    string HorseName,
    string? JockeyId,
    int Rank,
    string FinishTime,
    bool Disqualified,
    bool Published,
    string Violation,
    decimal? PrizeMoney);
