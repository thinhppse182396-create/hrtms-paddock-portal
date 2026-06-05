using HRTMS.Models.DTOs;
using HRTMS.Models.Roles;
using HRTMS.Repositories;

namespace HRTMS.Services;

public interface IRefereeService
{
    Task<ServiceResult<RefereeResponse>> CreateRefereeAsync(RefereeRequest request);
    Task<ServiceResult<RefereeResponse>> UpdateRefereeAsync(string id, RefereeRequest request);
    Task<ServiceResult<bool>> DeleteRefereeAsync(string id);
}

public sealed class RefereeService : IRefereeService
{
    private readonly IRefereeRepository _refereeRepository;

    public RefereeService(IRefereeRepository refereeRepository)
    {
        _refereeRepository = refereeRepository;
    }

    public async Task<ServiceResult<RefereeResponse>> CreateRefereeAsync(RefereeRequest request)
    {
        var id = request.RefereeId.Trim();
        var licenseNo = request.LicenseNo.Trim();
        if (await _refereeRepository.IsIdentityInUseAsync(id, licenseNo, request.AccountId))
        {
            return ServiceResult<RefereeResponse>.Conflict("Referee ID, license number, or account is already in use.");
        }

        if (!await _refereeRepository.AccountIsRefereeAsync(request.AccountId))
        {
            return ServiceResult<RefereeResponse>.BadRequest("Select an existing referee account.");
        }

        var referee = new Referee
        {
            RefereeId = id,
            AccountId = request.AccountId,
            RefereeName = request.Name.Trim(),
            RefereeLicenseNumber = licenseNo
        };

        _refereeRepository.Add(referee);
        await _refereeRepository.SaveChangesAsync();
        return ServiceResult<RefereeResponse>.Created(ToResponse(referee));
    }

    public async Task<ServiceResult<RefereeResponse>> UpdateRefereeAsync(string id, RefereeRequest request)
    {
        var referee = await _refereeRepository.GetByIdAsync(id);
        if (referee is null)
        {
            return ServiceResult<RefereeResponse>.NotFound();
        }

        if (!string.Equals(id, request.RefereeId.Trim(), StringComparison.Ordinal))
        {
            return ServiceResult<RefereeResponse>.BadRequest("Referee ID cannot be changed.");
        }

        var licenseNo = request.LicenseNo.Trim();
        if (await _refereeRepository.IsIdentityInUseByOtherAsync(id, licenseNo, request.AccountId))
        {
            return ServiceResult<RefereeResponse>.Conflict("License number or account is already in use.");
        }

        if (!await _refereeRepository.AccountIsRefereeAsync(request.AccountId))
        {
            return ServiceResult<RefereeResponse>.BadRequest("Select an existing referee account.");
        }

        referee.AccountId = request.AccountId;
        referee.RefereeName = request.Name.Trim();
        referee.RefereeLicenseNumber = licenseNo;
        await _refereeRepository.SaveChangesAsync();
        return ServiceResult<RefereeResponse>.Success(ToResponse(referee));
    }

    public async Task<ServiceResult<bool>> DeleteRefereeAsync(string id)
    {
        var referee = await _refereeRepository.GetByIdAsync(id);
        if (referee is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        _refereeRepository.Remove(referee);
        var saved = await _refereeRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<bool>.Conflict("Referee cannot be deleted because it is assigned or in use.");
        }

        return ServiceResult<bool>.Success(true);
    }

    private static RefereeResponse ToResponse(Referee referee)
    {
        return new RefereeResponse(
            referee.RefereeId,
            referee.AccountId,
            referee.RefereeName,
            referee.RefereeLicenseNumber);
    }
}
