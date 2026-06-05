using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("jockeyInvitations")]
[Route("api/jockey-invitations")]
public class JockeyInvitationsController : ApiControllerBase
{
    private readonly IJockeyInvitationService _jockeyInvitationService;

    public JockeyInvitationsController(IJockeyInvitationService jockeyInvitationService)
    {
        _jockeyInvitationService = jockeyInvitationService;
    }

    [HttpPost]
    public async Task<ActionResult<IReadOnlyList<JockeyInvitationResponse>>> CreateJockeyInvitations(
        CreateJockeyInvitationsRequest request)
    {
        var result = await _jockeyInvitationService.CreateJockeyInvitationsAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? Created("/jockeyInvitations", result.Value)
            : ToActionResult(result);
    }

    [HttpPatch("{id:int}/accept")]
    public async Task<ActionResult<JockeyInvitationResponse>> AcceptJockeyInvitation(int id)
    {
        var result = await _jockeyInvitationService.AcceptJockeyInvitationAsync(id);
        return ToActionResult(result);
    }

    [HttpGet("jockey/{jockeyId}")]
    public async Task<ActionResult<IReadOnlyList<JockeyInvitationResponse>>> GetJockeyInvitations(
        string jockeyId)
    {
        var result = await _jockeyInvitationService.GetJockeyInvitationsAsync(jockeyId);
        return ToActionResult(result);
    }
}
