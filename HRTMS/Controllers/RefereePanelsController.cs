using HRTMS.Data;
using HRTMS.Models.Roles;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("api/referee-panels")]
public class RefereePanelsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public RefereePanelsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RefereePanelResponse>>> GetRefereePanels()
    {
        var refereePanels = await _context.RefereePanels
            .AsNoTracking()
            .OrderBy(panel => panel.RefereePanelId)
            .Select(panel => new RefereePanelResponse(
                panel.RefereePanelId,
                panel.RaceId,
                panel.LeadID,
                panel.Member1ID,
                panel.Member2ID))
            .ToListAsync();

        return Ok(refereePanels);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RefereePanelResponse>> GetRefereePanel(string id)
    {
        var refereePanel = await _context.RefereePanels
            .AsNoTracking()
            .Where(panel => panel.RefereePanelId == id)
            .Select(panel => new RefereePanelResponse(
                panel.RefereePanelId,
                panel.RaceId,
                panel.LeadID,
                panel.Member1ID,
                panel.Member2ID))
            .SingleOrDefaultAsync();

        return refereePanel is null ? NotFound() : Ok(refereePanel);
    }

    [HttpPost]
    public async Task<ActionResult<RefereePanelResponse>> CreateRefereePanel(
        CreateRefereePanelRequest request)
    {
        if (await _context.RefereePanels.AnyAsync(panel =>
            panel.RefereePanelId == request.RefereePanelId))
        {
            return Conflict(new { message = "Referee panel ID already exists." });
        }

        var validationError = await ValidateReferences(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var refereePanel = new RefereePanel
        {
            RefereePanelId = request.RefereePanelId,
            RaceId = request.RaceId,
            LeadID = request.LeadId,
            Member1ID = request.Member1Id,
            Member2ID = request.Member2Id
        };

        _context.RefereePanels.Add(refereePanel);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetRefereePanel),
            new { id = refereePanel.RefereePanelId },
            ToResponse(refereePanel));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRefereePanel(
        string id,
        UpdateRefereePanelRequest request)
    {
        var refereePanel = await _context.RefereePanels.FindAsync(id);
        if (refereePanel is null)
        {
            return NotFound();
        }

        var validationError = await ValidateReferences(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        refereePanel.RaceId = request.RaceId;
        refereePanel.LeadID = request.LeadId;
        refereePanel.Member1ID = request.Member1Id;
        refereePanel.Member2ID = request.Member2Id;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRefereePanel(string id)
    {
        var refereePanel = await _context.RefereePanels.FindAsync(id);
        if (refereePanel is null)
        {
            return NotFound();
        }

        _context.RefereePanels.Remove(refereePanel);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<string?> ValidateReferences(RefereePanelRequest request)
    {
        var refereeIds = new[] { request.LeadId, request.Member1Id, request.Member2Id };
        if (refereeIds.Distinct().Count() != refereeIds.Length)
        {
            return "Lead and member referees must be different.";
        }

        if (!await _context.Races.AnyAsync(race => race.RaceID == request.RaceId))
        {
            return "Race does not exist.";
        }

        var existingRefereeIds = await _context.Referees
            .Where(referee => refereeIds.Contains(referee.RefereeId))
            .Select(referee => referee.RefereeId)
            .ToListAsync();

        var missingRefereeIds = refereeIds.Except(existingRefereeIds).ToArray();
        return missingRefereeIds.Length == 0
            ? null
            : $"Referee does not exist: {string.Join(", ", missingRefereeIds)}.";
    }

    private static RefereePanelResponse ToResponse(RefereePanel refereePanel)
    {
        return new RefereePanelResponse(
            refereePanel.RefereePanelId,
            refereePanel.RaceId,
            refereePanel.LeadID,
            refereePanel.Member1ID,
            refereePanel.Member2ID);
    }

    public abstract record RefereePanelRequest(
        [Required] string RaceId,
        [Required] string LeadId,
        [Required] string Member1Id,
        [Required] string Member2Id);

    public record CreateRefereePanelRequest(
        [Required] string RefereePanelId,
        string RaceId,
        string LeadId,
        string Member1Id,
        string Member2Id)
        : RefereePanelRequest(RaceId, LeadId, Member1Id, Member2Id);

    public record UpdateRefereePanelRequest(
        string RaceId,
        string LeadId,
        string Member1Id,
        string Member2Id)
        : RefereePanelRequest(RaceId, LeadId, Member1Id, Member2Id);

    public record RefereePanelResponse(
        string RefereePanelId,
        string RaceId,
        string LeadId,
        string Member1Id,
        string Member2Id);
}
