using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("api")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return ToActionResult(result);
    }

    [HttpPost("register/spectator")]
    public async Task<ActionResult<LoginResponse>> RegisterSpectator(RegisterSpectatorRequest request)
    {
        var result = await _authService.RegisterSpectatorAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? Created("/api/register/spectator", result.Value)
            : ToActionResult(result);
    }

    [HttpPatch("password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var result = await _authService.ChangePasswordAsync(request);
        return ToNoContentResult(result);
    }
}
