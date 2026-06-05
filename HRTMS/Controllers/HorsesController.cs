using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("horses")]
[Route("api/horses")]
public class HorsesController : ApiControllerBase
{
    private readonly IHorseService _horseService;

    public HorsesController(IHorseService horseService)
    {
        _horseService = horseService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<HorseResponse>>> GetHorses()
    {
        return Ok(await _horseService.GetHorsesAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HorseResponse>> GetHorse(string id)
    {
        var result = await _horseService.GetHorseAsync(id);
        return ToActionResult(result);
    }

    [HttpGet("owner/{ownerId}")]
    public async Task<ActionResult<IReadOnlyList<HorseResponse>>> GetHorsesByOwner(string ownerId)
    {
        var result = await _horseService.GetHorsesByOwnerAsync(ownerId);
        return ToActionResult(result);
    }

    [HttpPost]
    public async Task<ActionResult<HorseResponse>> CreateHorse(CreateHorseRequest request)
    {
        var result = await _horseService.CreateHorseAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? CreatedAtAction(nameof(GetHorse), new { id = result.Value!.HorseId }, result.Value)
            : ToActionResult(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<HorseResponse>> UpdateHorse(string id, UpdateHorseRequest request)
    {
        var result = await _horseService.UpdateHorseAsync(id, request);
        return ToActionResult(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteHorse(string id)
    {
        var result = await _horseService.DeleteHorseAsync(id);
        return ToNoContentResult(result);
    }
}
