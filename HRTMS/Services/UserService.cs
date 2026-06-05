using HRTMS.Models.DTOs;
using HRTMS.Models.Roles;
using HRTMS.Models.Statuss;
using HRTMS.Repositories;
using Microsoft.AspNetCore.Identity;

namespace HRTMS.Services;

public interface IUserService
{
    Task<IReadOnlyList<UserResponse>> GetUsersAsync();
    Task<ServiceResult<UserResponse>> CreateUserAsync(CreateUserRequest request);
    Task<ServiceResult<UserResponse>> UpdateUserAsync(string id, UpdateUserRequest request);
    Task<ServiceResult<UserResponse>> UpdateUserStatusAsync(string id, UpdateUserStatusRequest request);
    Task<ServiceResult<bool>> ResetUserPasswordAsync(string id, ResetUserPasswordRequest request);
    Task<ServiceResult<bool>> DeleteUserAsync(string id);
}

public sealed class UserService : IUserService
{
    private const string ActiveStatusCode = "ACTIVE";
    private const string AdminRoleCode = "ADMIN";

    private readonly IAccountRepository _accountRepository;
    private readonly IPasswordHasher<Accounts> _passwordHasher;

    public UserService(
        IAccountRepository accountRepository,
        IPasswordHasher<Accounts> passwordHasher)
    {
        _accountRepository = accountRepository;
        _passwordHasher = passwordHasher;
    }

    public Task<IReadOnlyList<UserResponse>> GetUsersAsync()
    {
        return _accountRepository.GetUserResponsesAsync();
    }

    public async Task<ServiceResult<UserResponse>> CreateUserAsync(CreateUserRequest request)
    {
        var username = request.Username.Trim();
        if (await _accountRepository.UsernameExistsAsync(username))
        {
            return ServiceResult<UserResponse>.Conflict("Username already exists.");
        }

        var role = await _accountRepository.GetActiveRoleAsync(request.RoleCode);
        if (role is null)
        {
            return ServiceResult<UserResponse>.BadRequest("Role does not exist or is inactive.");
        }

        var activeStatus = await _accountRepository.GetActiveAccountStatusAsync(ActiveStatusCode);
        if (activeStatus is null)
        {
            return ServiceResult<UserResponse>.Problem("The active account status is not configured.");
        }

        var account = new Accounts
        {
            AccountId = Guid.NewGuid().ToString(),
            Username = username,
            FullName = request.FullName.Trim(),
            RoleId = role.RoleId,
            Role = role,
            StatusId = activeStatus.StatusId,
            Status = activeStatus
        };
        account.Password = _passwordHasher.HashPassword(account, request.Password);

        _accountRepository.Add(account);
        var saved = await _accountRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<UserResponse>.Conflict("Username already exists.");
        }

        return ServiceResult<UserResponse>.Created(ToResponse(account, role, activeStatus));
    }

    public async Task<ServiceResult<UserResponse>> UpdateUserAsync(string id, UpdateUserRequest request)
    {
        var account = await _accountRepository.GetByIdAsync(id);
        if (account is null)
        {
            return ServiceResult<UserResponse>.NotFound();
        }

        var role = await _accountRepository.GetActiveRoleAsync(request.RoleCode);
        var status = await _accountRepository.GetActiveAccountStatusAsync(request.StatusCode);
        if (role is null || status is null)
        {
            return ServiceResult<UserResponse>.BadRequest("Role or account status does not exist or is inactive.");
        }

        account.FullName = request.FullName.Trim();
        account.RoleId = role.RoleId;
        account.StatusId = status.StatusId;
        await _accountRepository.SaveChangesAsync();

        return ServiceResult<UserResponse>.Success(ToResponse(account, role, status));
    }

    public async Task<ServiceResult<UserResponse>> UpdateUserStatusAsync(string id, UpdateUserStatusRequest request)
    {
        var account = await _accountRepository.GetByIdWithRoleAsync(id);
        if (account is null)
        {
            return ServiceResult<UserResponse>.NotFound();
        }

        var status = await _accountRepository.GetActiveAccountStatusAsync(request.StatusCode);
        if (status is null)
        {
            return ServiceResult<UserResponse>.BadRequest("Account status does not exist or is inactive.");
        }

        account.StatusId = status.StatusId;
        await _accountRepository.SaveChangesAsync();

        return ServiceResult<UserResponse>.Success(ToResponse(account, account.Role!, status));
    }

    public async Task<ServiceResult<bool>> ResetUserPasswordAsync(string id, ResetUserPasswordRequest request)
    {
        var admin = await _accountRepository.GetByIdWithRoleAndStatusAsync(request.AdminAccountId);
        if (admin is null ||
            admin.Role?.RoleCode != AdminRoleCode ||
            admin.Status?.StatusCode != ActiveStatusCode ||
            !VerifyPassword(admin, request.AdminPassword))
        {
            return ServiceResult<bool>.Unauthorized("Administrator verification failed.");
        }

        var account = await _accountRepository.GetByIdAsync(id);
        if (account is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        account.Password = _passwordHasher.HashPassword(account, request.NewPassword);
        await _accountRepository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<bool>> DeleteUserAsync(string id)
    {
        var account = await _accountRepository.GetByIdAsync(id);
        if (account is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        _accountRepository.Remove(account);
        var saved = await _accountRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<bool>.Conflict("Account cannot be deleted because it is in use.");
        }

        return ServiceResult<bool>.Success(true);
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

    private static UserResponse ToResponse(Accounts account, Roles role, Status status)
    {
        return new UserResponse(
            account.AccountId,
            account.Username,
            account.FullName,
            account.RoleId,
            role.RoleCode,
            role.RoleName,
            account.StatusId,
            status.StatusCode);
    }
}
