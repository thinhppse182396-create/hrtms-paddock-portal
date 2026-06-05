using HRTMS.Models.DTOs;
using HRTMS.Models.Roles;
using HRTMS.Repositories;

namespace HRTMS.Services;

public interface IRefereePanelService
{
    Task<IReadOnlyList<RefereePanelResponse>> GetRefereePanelsAsync();
    Task<ServiceResult<RefereePanelResponse>> GetRefereePanelAsync(string id);
    Task<ServiceResult<RefereePanelResponse>> CreateRefereePanelAsync(CreateRefereePanelRequest request);
    Task<ServiceResult<bool>> UpdateRefereePanelAsync(string id, UpdateRefereePanelRequest request);
    Task<ServiceResult<bool>> DeleteRefereePanelAsync(string id);
}

public sealed class RefereePanelService : IRefereePanelService
{
    private readonly IRefereePanelRepository _refereePanelRepository;

    public RefereePanelService(IRefereePanelRepository refereePanelRepository)
    {
        _refereePanelRepository = refereePanelRepository;
    }

    public Task<IReadOnlyList<RefereePanelResponse>> GetRefereePanelsAsync() =>
        _refereePanelRepository.GetResponsesAsync();

    public async Task<ServiceResult<RefereePanelResponse>> GetRefereePanelAsync(string id)
    {
        var panel = await _refereePanelRepository.GetResponseByIdAsync(id);
        return panel is null
            ? ServiceResult<RefereePanelResponse>.NotFound()
            : ServiceResult<RefereePanelResponse>.Success(panel);
    }

    public async Task<ServiceResult<RefereePanelResponse>> CreateRefereePanelAsync(CreateRefereePanelRequest request)
    {
        if (await _refereePanelRepository.ExistsAsync(request.RefereePanelId))
        {
            return ServiceResult<RefereePanelResponse>.Conflict("Referee panel ID already exists.");
        }

        var validationError = await ValidateReferencesAsync(request);
        if (validationError is not null)
        {
            return ServiceResult<RefereePanelResponse>.BadRequest(validationError);
        }

        var panel = new RefereePanel
        {
            RefereePanelId = request.RefereePanelId,
            RaceId = request.RaceId,
            LeadID = request.LeadId,
            Member1ID = request.Member1Id,
            Member2ID = request.Member2Id
        };

        _refereePanelRepository.Add(panel);
        await _refereePanelRepository.SaveChangesAsync();
        return ServiceResult<RefereePanelResponse>.Created(ToResponse(panel));
    }

    public async Task<ServiceResult<bool>> UpdateRefereePanelAsync(string id, UpdateRefereePanelRequest request)
    {
        var panel = await _refereePanelRepository.GetByIdAsync(id);
        if (panel is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        var validationError = await ValidateReferencesAsync(request);
        if (validationError is not null)
        {
            return ServiceResult<bool>.BadRequest(validationError);
        }

        panel.RaceId = request.RaceId;
        panel.LeadID = request.LeadId;
        panel.Member1ID = request.Member1Id;
        panel.Member2ID = request.Member2Id;
        await _refereePanelRepository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<bool>> DeleteRefereePanelAsync(string id)
    {
        var panel = await _refereePanelRepository.GetByIdAsync(id);
        if (panel is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        _refereePanelRepository.Remove(panel);
        await _refereePanelRepository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    private async Task<string?> ValidateReferencesAsync(RefereePanelRequest request)
    {
        var refereeIds = new[] { request.LeadId, request.Member1Id, request.Member2Id };
        if (refereeIds.Distinct().Count() != refereeIds.Length)
        {
            return "Lead and member referees must be different.";
        }

        if (!await _refereePanelRepository.RaceExistsAsync(request.RaceId))
        {
            return "Race does not exist.";
        }

        var existingRefereeIds = await _refereePanelRepository.GetExistingRefereeIdsAsync(refereeIds);
        var missingRefereeIds = refereeIds.Except(existingRefereeIds).ToArray();
        return missingRefereeIds.Length == 0
            ? null
            : $"Referee does not exist: {string.Join(", ", missingRefereeIds)}.";
    }

    private static RefereePanelResponse ToResponse(RefereePanel panel)
    {
        return new RefereePanelResponse(
            panel.RefereePanelId,
            panel.RaceId,
            panel.LeadID,
            panel.Member1ID,
            panel.Member2ID);
    }
}
