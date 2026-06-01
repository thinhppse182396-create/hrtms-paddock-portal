using HRTMS.Data;
using HRTMS.Models.on_board;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("awards")]
public class AwardsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AwardsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{raceId}")]
    public async Task<ActionResult<IEnumerable<AwardResponse>>> GetAwards(string raceId)
    {
        if (!await _context.Races.AnyAsync(race => race.RaceID == raceId))
        {
            return NotFound(new { message = "Race does not exist." });
        }

        var awards = await _context.Awards
            .AsNoTracking()
            .Where(award => award.RaceID == raceId)
            .OrderBy(award => award.Rank)
            .Select(award => new AwardResponse(
                award.Id,
                award.RaceID,
                award.Rank,
                award.PriceMoney))
            .ToListAsync();

        return Ok(awards);
    }

    [HttpPost]
    public async Task<ActionResult<AwardResponse>> CreateAward(CreateAwardRequest request)
    {
        if (!await _context.Races.AnyAsync(race => race.RaceID == request.RaceId))
        {
            return NotFound(new { message = "Race does not exist." });
        }

        if (await _context.Awards.AnyAsync(award =>
            award.RaceID == request.RaceId &&
            award.Rank == request.Rank))
        {
            return Conflict(new { message = "An award for this race and rank already exists." });
        }

        var award = new Awards
        {
            RaceID = request.RaceId,
            Rank = request.Rank,
            PriceMoney = request.PriceMoney
        };

        _context.Awards.Add(award);
        await _context.SaveChangesAsync();

        var response = new AwardResponse(
            award.Id,
            award.RaceID,
            award.Rank,
            award.PriceMoney);

        return CreatedAtAction(nameof(GetAwards), new { raceId = award.RaceID }, response);
    }

    public record CreateAwardRequest(
        [Required] string RaceId,
        [Range(1, int.MaxValue)] int Rank,
        [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
        decimal PriceMoney);

    public record AwardResponse(
        int Id,
        string RaceId,
        int Rank,
        decimal PriceMoney);
}
