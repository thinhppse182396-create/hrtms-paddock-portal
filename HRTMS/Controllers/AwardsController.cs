using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("awards")]
[Route("api/awards")]
public class AwardsController : ApiControllerBase
{
    private readonly IAwardService _awardService;

    public AwardsController(IAwardService awardService)
    {
        _awardService = awardService;
    }

    [HttpGet("{raceId}")]
    public async Task<ActionResult<IReadOnlyList<AwardResponse>>> GetAwards(string raceId)
    {
        var result = await _awardService.GetAwardsAsync(raceId);
        return ToActionResult(result);
    }

    [HttpPost]
    public async Task<ActionResult<AwardResponse>> CreateAward(CreateAwardRequest request)
    {
        var result = await _awardService.CreateAwardAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? CreatedAtAction(nameof(GetAwards), new { raceId = result.Value!.RaceId }, result.Value)
            : ToActionResult(result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AwardResponse>> UpdateAward(int id, UpdateAwardRequest request)
    {
        var result = await _awardService.UpdateAwardAsync(id, request);
        return ToActionResult(result);
    }
}
