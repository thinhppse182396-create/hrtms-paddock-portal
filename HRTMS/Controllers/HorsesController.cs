using HRTMS.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Controllers;

[ApiController]
[Route("horses")]
public class HorsesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public HorsesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("owner/{ownerId}")]
    public async Task<ActionResult<IEnumerable<HorseResponse>>> GetHorsesByOwner(string ownerId)
    {
        if (!await _context.Accounts.AnyAsync(account => account.AccountId == ownerId))
        {
            return NotFound(new { message = "Owner account does not exist." });
        }

        var horses = await _context.Horses
            .AsNoTracking()
            .Where(horse => horse.OwnerId == ownerId)
            .OrderBy(horse => horse.HourseName)
            .Select(horse => new HorseResponse(
                horse.HorseId,
                horse.HourseName,
                horse.Breed,
                horse.Age,
                horse.Weight,
                horse.Documents,
                horse.Health_Cert_Expiry,
                horse.StatusId,
                horse.Status!.StatusCode,
                horse.OwnerId))
            .ToListAsync();

        return Ok(horses);
    }

    public record HorseResponse(
        string HorseId,
        string HorseName,
        string Breed,
        int Age,
        int Weight,
        string Documents,
        DateTime HealthCertExpiry,
        int StatusId,
        string StatusCode,
        string OwnerId);
}
