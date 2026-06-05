using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public record CreateRoundRequest(
    [Required] string RaceId,
    [Required] string RoundName,
    DateTime StartTime);

public record RoundResponse(
    int RoundId,
    string RaceId,
    string RoundName,
    DateTime StartTime);
