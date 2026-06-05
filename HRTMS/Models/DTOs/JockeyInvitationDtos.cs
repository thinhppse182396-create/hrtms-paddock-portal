using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public record CreateJockeyInvitationsRequest(
    [Required] string RegistrationId);

public record JockeyInvitationResponse(
    int Id,
    string RegistrationId,
    string JockeyId,
    int StatusId,
    string StatusCode);
