using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("tracks")]
[Route("api/tracks")]
public class TracksController : ApiControllerBase
{
    private readonly ITrackService _trackService;

    public TracksController(ITrackService trackService)
    {
        _trackService = trackService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TrackResponse>>> GetTracks()
    {
        return Ok(await _trackService.GetTracksAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TrackResponse>> GetTrack(string id)
    {
        var result = await _trackService.GetTrackAsync(id);
        return ToActionResult(result);
    }

    [HttpPost]
    public async Task<ActionResult<TrackResponse>> CreateTrack(CreateTrackRequest request)
    {
        var result = await _trackService.CreateTrackAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? CreatedAtAction(nameof(GetTrack), new { id = result.Value!.TrackId }, result.Value)
            : ToActionResult(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TrackResponse>> UpdateTrack(string id, UpdateTrackRequest request)
    {
        var result = await _trackService.UpdateTrackAsync(id, request);
        return ToActionResult(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTrack(string id)
    {
        var result = await _trackService.DeleteTrackAsync(id);
        return ToNoContentResult(result);
    }
}
