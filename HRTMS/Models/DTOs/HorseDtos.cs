using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public static class HorseStatusCodes
{
    public const string Eligible = "ELIGIBLE";
}

public abstract record HorseRequest(
    [Required, StringLength(50)] string HorseName,
    [Required, StringLength(50)] string Breed,
    [Range(1, int.MaxValue)] int Age,
    [Range(1, int.MaxValue)] int Weight,
    [Required] string Documents,
    DateTime HealthCertExpiry,
    [Required] string OwnerId,
    [Required] string StatusCode);

public record CreateHorseRequest(
    [Required] string HorseId,
    string HorseName,
    string Breed,
    int Age,
    int Weight,
    string Documents,
    DateTime HealthCertExpiry,
    string OwnerId,
    string StatusCode = HorseStatusCodes.Eligible)
    : HorseRequest(HorseName, Breed, Age, Weight, Documents, HealthCertExpiry, OwnerId, StatusCode);

public record UpdateHorseRequest(
    string HorseName,
    string Breed,
    int Age,
    int Weight,
    string Documents,
    DateTime HealthCertExpiry,
    string OwnerId,
    string StatusCode)
    : HorseRequest(HorseName, Breed, Age, Weight, Documents, HealthCertExpiry, OwnerId, StatusCode);

public record HorseResponse(
    string HorseId,
    string HorseName,
    string Breed,
    int Age,
    int Weight,
    string Documents,
    DateTime HealthCertExpiry,
    int StatusId,
    string StatusCode,
    string OwnerId);
