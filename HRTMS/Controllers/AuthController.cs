using HRTMS.Data;
using HRTMS.Models.Roles;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HRTMS.Controllers;

[ApiController]
[Route("api")]
public class AuthController : ControllerBase
{
    private const string ActiveStatusCode = "ACTIVE";

    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher<Accounts> _passwordHasher;

    public AuthController(
        ApplicationDbContext context,
        IPasswordHasher<Accounts> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var username = request.Username.Trim();

        var account = await _context.Accounts
            .Include(item => item.Role)
            .Include(item => item.Status)
            .SingleOrDefaultAsync(item => item.Username == username);

        if (account is null || !VerifyPassword(account, request.Password))
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        if (account.Status?.StatusCode != ActiveStatusCode || account.Role?.IsActive != true)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = "Account is inactive or locked." });
        }

        return Ok(new LoginResponse(
            account.AccountId,
            account.Username,
            account.FullName,
            account.RoleId,
            account.Role.RoleCode,
            account.Role.RoleName));
    }

    private bool VerifyPassword(Accounts account, string password)
    {
        try
        {
            return _passwordHasher.VerifyHashedPassword(account, account.Password, password) !=
                PasswordVerificationResult.Failed;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    public record LoginRequest(
        [Required] string Username,
        [Required] string Password);

    public record LoginResponse(
        string AccountId,
        string Username,
        string FullName,
        int RoleId,
        string RoleCode,
        string RoleName);
}
