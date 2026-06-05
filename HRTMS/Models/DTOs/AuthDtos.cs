using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public record LoginRequest(
    [Required] string Username,
    [Required] string Password);

public record RegisterSpectatorRequest(
    [Required, StringLength(50), MinLength(3)] string Username,
    [Required, MinLength(6)] string Password,
    [Required, StringLength(100), MinLength(2)] string FullName);

public record ChangePasswordRequest(
    [Required] string Username,
    [Required] string CurrentPassword,
    [Required, MinLength(6)] string NewPassword);

public record LoginResponse(
    string AccountId,
    string Username,
    string FullName,
    int RoleId,
    string RoleCode,
    string RoleName);
