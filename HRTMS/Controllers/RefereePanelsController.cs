using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("api/referee-panels")]
public class RefereePanelsController : ApiControllerBase
{
    private readonly IRefereePanelService _refereePanelService;

    public RefereePanelsController(IRefereePanelService refereePanelService)
    {
        _refereePanelService = refereePanelService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RefereePanelResponse>>> GetRefereePanels()
    {
        return Ok(await _refereePanelService.GetRefereePanelsAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RefereePanelResponse>> GetRefereePanel(string id)
    {
        var result = await _refereePanelService.GetRefereePanelAsync(id);
        return ToActionResult(result);
    }

    [HttpPost]
    public async Task<ActionResult<RefereePanelResponse>> CreateRefereePanel(
        CreateRefereePanelRequest request)
    {
        var result = await _refereePanelService.CreateRefereePanelAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? CreatedAtAction(nameof(GetRefereePanel), new { id = result.Value!.RefereePanelId }, result.Value)
            : ToActionResult(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRefereePanel(
        string id,
        UpdateRefereePanelRequest request)
    {
        var result = await _refereePanelService.UpdateRefereePanelAsync(id, request);
        return ToNoContentResult(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRefereePanel(string id)
    {
        var result = await _refereePanelService.DeleteRefereePanelAsync(id);
        return ToNoContentResult(result);
    }
}
