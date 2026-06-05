using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public record CreateAwardRequest(
    [Required] string RaceId,
    [Range(1, int.MaxValue)] int Rank,
    [Range(typeof(decimal), "0.01", "9999999999999999.99")]
    decimal PriceMoney);

public record UpdateAwardRequest(
    [Range(typeof(decimal), "0.01", "9999999999999999.99")]
    decimal PriceMoney);

public record AwardResponse(
    int Id,
    string RaceId,
    int Rank,
    decimal PriceMoney);
