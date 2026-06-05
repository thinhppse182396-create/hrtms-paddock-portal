using HRTMS.Models.DTOs;
using HRTMS.Models.on_board;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
public class PortalEntitiesController : ApiControllerBase
{
    private readonly IPortalEntityService _portalEntityService;

    public PortalEntitiesController(IPortalEntityService portalEntityService)
    {
        _portalEntityService = portalEntityService;
    }

    [HttpPost("api/violations")]
    public async Task<ActionResult<ViolationRecord>> CreateViolation(ViolationRequest request)
    {
        var result = await _portalEntityService.CreateViolationAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? Created("/api/violations", result.Value)
            : ToActionResult(result);
    }

    [HttpPut("api/violations/{id}")]
    public async Task<ActionResult<ViolationRecord>> UpdateViolation(string id, ViolationRequest request)
    {
        var result = await _portalEntityService.UpdateViolationAsync(id, request);
        return ToActionResult(result);
    }

    [HttpDelete("api/violations/{id}")]
    public async Task<IActionResult> DeleteViolation(string id)
    {
        var result = await _portalEntityService.DeleteViolationAsync(id);
        return ToNoContentResult(result);
    }

    [HttpPost("api/referee-reports")]
    public async Task<ActionResult<RefereeReport>> CreateRefereeReport(RefereeReportRequest request)
    {
        var result = await _portalEntityService.CreateRefereeReportAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? Created("/api/referee-reports", result.Value)
            : ToActionResult(result);
    }

    [HttpPut("api/referee-reports/{id}")]
    public async Task<ActionResult<RefereeReport>> UpdateRefereeReport(string id, RefereeReportRequest request)
    {
        var result = await _portalEntityService.UpdateRefereeReportAsync(id, request);
        return ToActionResult(result);
    }

    [HttpPost("api/award-ceremonies")]
    public async Task<ActionResult<AwardCeremony>> CreateAwardCeremony(AwardCeremonyRequest request)
    {
        var result = await _portalEntityService.CreateAwardCeremonyAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? Created("/api/award-ceremonies", result.Value)
            : ToActionResult(result);
    }

    [HttpPut("api/award-ceremonies/{raceId}")]
    public async Task<ActionResult<AwardCeremony>> UpdateAwardCeremony(string raceId, AwardCeremonyRequest request)
    {
        var result = await _portalEntityService.UpdateAwardCeremonyAsync(raceId, request);
        return ToActionResult(result);
    }

    [HttpDelete("api/award-ceremonies/{raceId}")]
    public async Task<IActionResult> DeleteAwardCeremony(string raceId)
    {
        var result = await _portalEntityService.DeleteAwardCeremonyAsync(raceId);
        return ToNoContentResult(result);
    }

    [HttpGet("api/pre-race-checks/{raceId}")]
    public async Task<ActionResult<string>> GetPreRaceCheck(string raceId)
    {
        var result = await _portalEntityService.GetPreRaceCheckAsync(raceId);
        return result.Status == ServiceResultStatus.Success
            ? Content(result.Value!, "application/json")
            : ToActionResult(result);
    }

    [HttpPut("api/pre-race-checks/{raceId}")]
    public async Task<IActionResult> SavePreRaceCheck(string raceId, [FromBody] object data)
    {
        var result = await _portalEntityService.SavePreRaceCheckAsync(raceId, data);
        return ToNoContentResult(result);
    }

    [HttpGet("api/race-control/{raceId}")]
    public async Task<ActionResult<string>> GetRaceControlState(string raceId)
    {
        var result = await _portalEntityService.GetRaceControlStateAsync(raceId);
        return result.Status == ServiceResultStatus.Success
            ? Content(result.Value!, "application/json")
            : ToActionResult(result);
    }

    [HttpPut("api/race-control/{raceId}")]
    public async Task<IActionResult> SaveRaceControlState(string raceId, [FromBody] object data)
    {
        var result = await _portalEntityService.SaveRaceControlStateAsync(raceId, data);
        return ToNoContentResult(result);
    }

    [HttpGet("api/predictions/account/{accountId}")]
    public async Task<ActionResult<IReadOnlyList<Prediction>>> GetPredictions(string accountId)
    {
        return Ok(await _portalEntityService.GetPredictionsAsync(accountId));
    }

    [HttpPost("api/predictions")]
    public async Task<ActionResult<Prediction>> CreatePrediction(PredictionRequest request)
    {
        var result = await _portalEntityService.CreatePredictionAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? Created("/api/predictions", result.Value)
            : ToActionResult(result);
    }

    [HttpPatch("api/jockeys/{jockeyId}/profile")]
    public async Task<IActionResult> UpdateJockeyProfile(string jockeyId, JockeyProfileRequest request)
    {
        var result = await _portalEntityService.UpdateJockeyProfileAsync(jockeyId, request);
        return ToNoContentResult(result);
    }
}
