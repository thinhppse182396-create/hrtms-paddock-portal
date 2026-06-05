using HRTMS.Models.DTOs;
using HRTMS.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRTMS.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ApiControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserResponse>>> GetUsers()
    {
        return Ok(await _userService.GetUsersAsync());
    }

    [HttpPost]
    public async Task<ActionResult<UserResponse>> CreateUser(CreateUserRequest request)
    {
        var result = await _userService.CreateUserAsync(request);
        return result.Status == ServiceResultStatus.Created
            ? Created("/api/users", result.Value)
            : ToActionResult(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserResponse>> UpdateUser(string id, UpdateUserRequest request)
    {
        var result = await _userService.UpdateUserAsync(id, request);
        return ToActionResult(result);
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<UserResponse>> UpdateUserStatus(string id, UpdateUserStatusRequest request)
    {
        var result = await _userService.UpdateUserStatusAsync(id, request);
        return ToActionResult(result);
    }

    [HttpPatch("{id}/password")]
    public async Task<IActionResult> ResetUserPassword(string id, ResetUserPasswordRequest request)
    {
        var result = await _userService.ResetUserPasswordAsync(id, request);
        return ToNoContentResult(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var result = await _userService.DeleteUserAsync(id);
        return ToNoContentResult(result);
    }
}
