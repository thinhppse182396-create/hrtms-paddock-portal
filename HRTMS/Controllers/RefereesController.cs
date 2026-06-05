using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("api/referees")]
public class RefereesController : ApiControllerBase
{
    private readonly IRefereeService _refereeService;

    public RefereesController(IRefereeService refereeService)
    {
        _refereeService = refereeService;
    }

    [HttpPost]
    public async Task<ActionResult<RefereeResponse>> CreateReferee(RefereeRequest request)
    {
        var result = await _refereeService.CreateRefereeAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? Created($"/api/referees/{result.Value!.RefereeId}", result.Value)
            : ToActionResult(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RefereeResponse>> UpdateReferee(string id, RefereeRequest request)
    {
        var result = await _refereeService.UpdateRefereeAsync(id, request);
        return ToActionResult(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReferee(string id)
    {
        var result = await _refereeService.DeleteRefereeAsync(id);
        return ToNoContentResult(result);
    }
}
