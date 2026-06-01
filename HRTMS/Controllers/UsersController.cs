using HRTMS.Data;
using HRTMS.Models.Roles;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private const string AccountEntityName = "Account";
    private const string ActiveStatusCode = "ACTIVE";

    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher<Accounts> _passwordHasher;

    public UsersController(
        ApplicationDbContext context,
        IPasswordHasher<Accounts> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetUsers()
    {
        var users = await _context.Accounts
            .AsNoTracking()
            .OrderBy(account => account.Username)
            .Select(account => new UserResponse(
                account.AccountId,
                account.Username,
                account.FullName,
                account.RoleId,
                account.Role!.RoleCode,
                account.Role.RoleName,
                account.StatusId,
                account.Status!.StatusCode))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost]
    public async Task<ActionResult<UserResponse>> CreateUser(CreateUserRequest request)
    {
        var username = request.Username.Trim();
        var roleCode = request.RoleCode.Trim().ToUpperInvariant();

        if (await _context.Accounts.AnyAsync(account => account.Username == username))
        {
            return Conflict(new { message = "Username already exists." });
        }

        var role = await _context.Roles.SingleOrDefaultAsync(item =>
            item.RoleCode == roleCode &&
            item.IsActive);

        if (role is null)
        {
            return BadRequest(new { message = "Role does not exist or is inactive." });
        }

        var activeStatus = await _context.Statuses.SingleOrDefaultAsync(status =>
            status.EntityName == AccountEntityName &&
            status.StatusCode == ActiveStatusCode &&
            status.IsActive);

        if (activeStatus is null)
        {
            return Problem("The active account status is not configured.");
        }

        var account = new Accounts
        {
            AccountId = Guid.NewGuid().ToString(),
            Username = username,
            FullName = request.FullName.Trim(),
            RoleId = role.RoleId,
            StatusId = activeStatus.StatusId
        };

        account.Password = _passwordHasher.HashPassword(account, request.Password);

        _context.Accounts.Add(account);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Username already exists." });
        }

        var response = new UserResponse(
            account.AccountId,
            account.Username,
            account.FullName,
            account.RoleId,
            role.RoleCode,
            role.RoleName,
            account.StatusId,
            activeStatus.StatusCode);

        return Created("/api/users", response);
    }

    public record CreateUserRequest(
        [Required, StringLength(50)] string Username,
        [Required, MinLength(6)] string Password,
        [Required, StringLength(100)] string FullName,
        [Required] string RoleCode);

    public record UserResponse(
        string AccountId,
        string Username,
        string FullName,
        int RoleId,
        string RoleCode,
        string RoleName,
        int StatusId,
        string StatusCode);
}
