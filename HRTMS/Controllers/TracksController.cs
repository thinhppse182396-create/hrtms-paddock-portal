using HRTMS.Data;
using HRTMS.Models.on_board;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("tracks")]
[Route("api/tracks")]
public class TracksController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TracksController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TrackResponse>>> GetTracks()
    {
        return Ok(await _context.Tracks
            .AsNoTracking()
            .OrderBy(track => track.TrackName)
            .Select(track => ToResponse(track))
            .ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TrackResponse>> GetTrack(string id)
    {
        var track = await _context.Tracks
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.TrackId == id);

        return track is null ? NotFound() : Ok(ToResponse(track));
    }

    [HttpPost]
    public async Task<ActionResult<TrackResponse>> CreateTrack(CreateTrackRequest request)
    {
        var trackId = request.TrackId.Trim();
        if (await _context.Tracks.AnyAsync(track => track.TrackId == trackId))
        {
            return Conflict(new { message = "Track ID already exists." });
        }

        var track = new Tracks
        {
            TrackId = trackId,
            TrackName = request.TrackName.Trim(),
            Length = request.Length.Trim(),
            Width = request.Width.Trim(),
            MaxLanes = request.MaxLanes,
            AvailableDistances = request.AvailableDistances.Trim()
        };

        _context.Tracks.Add(track);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTrack), new { id = track.TrackId }, ToResponse(track));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TrackResponse>> UpdateTrack(string id, UpdateTrackRequest request)
    {
        var track = await _context.Tracks.FindAsync(id);
        if (track is null)
        {
            return NotFound();
        }

        track.TrackName = request.TrackName.Trim();
        track.Length = request.Length.Trim();
        track.Width = request.Width.Trim();
        track.MaxLanes = request.MaxLanes;
        track.AvailableDistances = request.AvailableDistances.Trim();

        await _context.SaveChangesAsync();
        return Ok(ToResponse(track));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTrack(string id)
    {
        var track = await _context.Tracks.FindAsync(id);
        if (track is null)
        {
            return NotFound();
        }

        _context.Tracks.Remove(track);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Track cannot be deleted because it is in use." });
        }

        return NoContent();
    }

    private static TrackResponse ToResponse(Tracks track)
    {
        return new TrackResponse(
            track.TrackId,
            track.TrackName,
            track.Length,
            track.Width,
            track.MaxLanes,
            track.AvailableDistances);
    }

    public record CreateTrackRequest(
        [Required] string TrackId,
        [Required] string TrackName,
        [Required] string Length,
        [Required] string Width,
        [Range(1, int.MaxValue)] int MaxLanes,
        [Required] string AvailableDistances);

    public record UpdateTrackRequest(
        [Required] string TrackName,
        [Required] string Length,
        [Required] string Width,
        [Range(1, int.MaxValue)] int MaxLanes,
        [Required] string AvailableDistances);

    public record TrackResponse(
        string TrackId,
        string TrackName,
        string Length,
        string Width,
        int MaxLanes,
        string AvailableDistances);
}
