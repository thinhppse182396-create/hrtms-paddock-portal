using HRTMS.Models.DTOs;
using HRTMS.Models.Roles;
using HRTMS.Repositories;
using Microsoft.AspNetCore.Identity;

namespace HRTMS.Services;

public interface IAuthService
{
    Task<ServiceResult<LoginResponse>> LoginAsync(LoginRequest request);
    Task<ServiceResult<LoginResponse>> RegisterSpectatorAsync(RegisterSpectatorRequest request);
    Task<ServiceResult<bool>> ChangePasswordAsync(ChangePasswordRequest request);
}

public sealed class AuthService : IAuthService
{
    private const string ActiveStatusCode = "ACTIVE";
    private const string SpectatorRoleCode = "SPECTATOR";

    private readonly IAccountRepository _accountRepository;
    private readonly IPasswordHasher<Accounts> _passwordHasher;

    public AuthService(
        IAccountRepository accountRepository,
        IPasswordHasher<Accounts> passwordHasher)
    {
        _accountRepository = accountRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<ServiceResult<LoginResponse>> LoginAsync(LoginRequest request)
    {
        var username = request.Username.Trim();
        var account = await _accountRepository.GetByUsernameWithRoleAndStatusAsync(username);

        if (account is null || !VerifyPassword(account, request.Password))
        {
            return ServiceResult<LoginResponse>.Unauthorized("Invalid username or password.");
        }

        if (account.Status?.StatusCode != ActiveStatusCode || account.Role?.IsActive != true)
        {
            return ServiceResult<LoginResponse>.Forbidden("Account is inactive or locked.");
        }

        return ServiceResult<LoginResponse>.Success(ToLoginResponse(account));
    }

    public async Task<ServiceResult<LoginResponse>> RegisterSpectatorAsync(RegisterSpectatorRequest request)
    {
        var username = request.Username.Trim();
        if (await _accountRepository.UsernameExistsAsync(username))
        {
            return ServiceResult<LoginResponse>.Conflict("Username already exists.");
        }

        var role = await _accountRepository.GetActiveRoleAsync(SpectatorRoleCode);
        var status = await _accountRepository.GetActiveAccountStatusAsync(ActiveStatusCode);
        if (role is null || status is null)
        {
            return ServiceResult<LoginResponse>.Problem("The spectator role or active account status is not configured.");
        }

        var account = new Accounts
        {
            AccountId = Guid.NewGuid().ToString(),
            Username = username,
            FullName = request.FullName.Trim(),
            RoleId = role.RoleId,
            Role = role,
            StatusId = status.StatusId,
            Status = status
        };
        account.Password = _passwordHasher.HashPassword(account, request.Password);

        _accountRepository.Add(account);
        var saved = await _accountRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<LoginResponse>.Conflict("Username already exists.");
        }

        return ServiceResult<LoginResponse>.Created(ToLoginResponse(account));
    }

    public async Task<ServiceResult<bool>> ChangePasswordAsync(ChangePasswordRequest request)
    {
        var username = request.Username.Trim();
        var account = await _accountRepository.GetByUsernameAsync(username);
        if (account is null || !VerifyPassword(account, request.CurrentPassword))
        {
            return ServiceResult<bool>.Unauthorized("Current password is incorrect.");
        }

        account.Password = _passwordHasher.HashPassword(account, request.NewPassword);
        await _accountRepository.SaveChangesAsync();
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

    private static LoginResponse ToLoginResponse(Accounts account)
    {
        return new LoginResponse(
            account.AccountId,
            account.Username,
            account.FullName,
            account.RoleId,
            account.Role!.RoleCode,
            account.Role.RoleName);
    }
}
