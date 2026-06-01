using HRTMS.Data;
using HRTMS.Models.Horses;
using HRTMS.Models.Statuss;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("horses")]
[Route("api/horses")]
public class HorsesController : ControllerBase
{
    private const string HorseEntityName = "Horse";
    private const string EligibleStatusCode = "ELIGIBLE";

    private readonly ApplicationDbContext _context;

    public HorsesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<HorseResponse>>> GetHorses()
    {
        return Ok(await ProjectResponses(_context.Horses.AsNoTracking()).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HorseResponse>> GetHorse(string id)
    {
        var horse = await ProjectResponses(
                _context.Horses.AsNoTracking().Where(item => item.HorseId == id))
            .SingleOrDefaultAsync();

        return horse is null ? NotFound() : Ok(horse);
    }

    [HttpGet("owner/{ownerId}")]
    public async Task<ActionResult<IEnumerable<HorseResponse>>> GetHorsesByOwner(string ownerId)
    {
        if (!await _context.Accounts.AnyAsync(account => account.AccountId == ownerId))
        {
            return NotFound(new { message = "Owner account does not exist." });
        }

        return Ok(await ProjectResponses(
                _context.Horses.AsNoTracking().Where(horse => horse.OwnerId == ownerId))
            .ToListAsync());
    }

    [HttpPost]
    public async Task<ActionResult<HorseResponse>> CreateHorse(CreateHorseRequest request)
    {
        var horseId = request.HorseId.Trim();
        if (await _context.Horses.AnyAsync(horse => horse.HorseId == horseId))
        {
            return Conflict(new { message = "Horse ID already exists." });
        }

        var validationError = await ValidateOwner(request.OwnerId);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var status = await FindStatus(request.StatusCode);
        if (status is null)
        {
            return BadRequest(new { message = "Horse status does not exist or is inactive." });
        }

        var horse = new Horse
        {
            HorseId = horseId,
            HourseName = request.HorseName.Trim(),
            Breed = request.Breed.Trim(),
            Age = request.Age,
            Weight = request.Weight,
            Documents = request.Documents.Trim(),
            Health_Cert_Expiry = request.HealthCertExpiry,
            StatusId = status.StatusId,
            OwnerId = request.OwnerId.Trim()
        };

        _context.Horses.Add(horse);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetHorse), new { id = horse.HorseId }, ToResponse(horse, status.StatusCode));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<HorseResponse>> UpdateHorse(string id, UpdateHorseRequest request)
    {
        var horse = await _context.Horses.FindAsync(id);
        if (horse is null)
        {
            return NotFound();
        }

        var validationError = await ValidateOwner(request.OwnerId);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var status = await FindStatus(request.StatusCode);
        if (status is null)
        {
            return BadRequest(new { message = "Horse status does not exist or is inactive." });
        }

        horse.HourseName = request.HorseName.Trim();
        horse.Breed = request.Breed.Trim();
        horse.Age = request.Age;
        horse.Weight = request.Weight;
        horse.Documents = request.Documents.Trim();
        horse.Health_Cert_Expiry = request.HealthCertExpiry;
        horse.StatusId = status.StatusId;
        horse.OwnerId = request.OwnerId.Trim();

        await _context.SaveChangesAsync();
        return Ok(ToResponse(horse, status.StatusCode));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteHorse(string id)
    {
        var horse = await _context.Horses.FindAsync(id);
        if (horse is null)
        {
            return NotFound();
        }

        _context.Horses.Remove(horse);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Horse cannot be deleted because it is in use." });
        }

        return NoContent();
    }

    private async Task<string?> ValidateOwner(string ownerId)
    {
        return await _context.Accounts.AnyAsync(account =>
            account.AccountId == ownerId &&
            account.Role != null &&
            account.Role.RoleCode == "HORSE_OWNER")
            ? null
            : "Horse owner account does not exist.";
    }

    private async Task<Status?> FindStatus(string statusCode)
    {
        var normalizedStatusCode = statusCode.Trim().ToUpperInvariant();
        return await _context.Statuses.SingleOrDefaultAsync(status =>
            status.EntityName == HorseEntityName &&
            status.StatusCode == normalizedStatusCode &&
            status.IsActive);
    }

    private static IQueryable<HorseResponse> ProjectResponses(IQueryable<Horse> query)
    {
        return query
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
                horse.OwnerId));
    }

    private static HorseResponse ToResponse(Horse horse, string statusCode)
    {
        return new HorseResponse(
            horse.HorseId,
            horse.HourseName,
            horse.Breed,
            horse.Age,
            horse.Weight,
            horse.Documents,
            horse.Health_Cert_Expiry,
            horse.StatusId,
            statusCode,
            horse.OwnerId);
    }

    public abstract record HorseRequest(
        [Required, StringLength(50)] string HorseName,
        [Required, StringLength(50)] string Breed,
        [Range(1, int.MaxValue)] int Age,
        [Range(1, int.MaxValue)] int Weight,
        [Required] string Documents,
        DateTime HealthCertExpiry,
        [Required] string OwnerId,
        [Required] string StatusCode);

    public record CreateHorseRequest(
        [Required] string HorseId,
        string HorseName,
        string Breed,
        int Age,
        int Weight,
        string Documents,
        DateTime HealthCertExpiry,
        string OwnerId,
        string StatusCode = EligibleStatusCode)
        : HorseRequest(HorseName, Breed, Age, Weight, Documents, HealthCertExpiry, OwnerId, StatusCode);

    public record UpdateHorseRequest(
        string HorseName,
        string Breed,
        int Age,
        int Weight,
        string Documents,
        DateTime HealthCertExpiry,
        string OwnerId,
        string StatusCode)
        : HorseRequest(HorseName, Breed, Age, Weight, Documents, HealthCertExpiry, OwnerId, StatusCode);

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
