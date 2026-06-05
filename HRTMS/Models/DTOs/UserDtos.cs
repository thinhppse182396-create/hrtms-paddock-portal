using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public record CreateUserRequest(
    [Required, StringLength(50)] string Username,
    [Required, MinLength(6)] string Password,
    [Required, StringLength(100)] string FullName,
    [Required] string RoleCode);

public record UpdateUserRequest(
    [Required, StringLength(100)] string FullName,
    [Required] string RoleCode,
    [Required] string StatusCode);

public record UpdateUserStatusRequest(
    [Required] string StatusCode);

public record ResetUserPasswordRequest(
    [Required] string AdminAccountId,
    [Required] string AdminPassword,
    [Required, MinLength(6)] string NewPassword);

public record UserResponse(
    string AccountId,
    string Username,
    string FullName,
    int RoleId,
    string RoleCode,
    string RoleName,
    int StatusId,
    string StatusCode);
