using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public record RefereeRequest(
    [Required] string RefereeId,
    [Required] string AccountId,
    [Required] string Name,
    [Required] string LicenseNo);

public record RefereeResponse(
    string RefereeId,
    string AccountId,
    string Name,
    string LicenseNo);
