using HRTMS.Models.DTOs;
using HRTMS.Models.on_board;
using HRTMS.Repositories;

namespace HRTMS.Services;

public interface IAwardService
{
    Task<ServiceResult<IReadOnlyList<AwardResponse>>> GetAwardsAsync(string raceId);
    Task<ServiceResult<AwardResponse>> CreateAwardAsync(CreateAwardRequest request);
    Task<ServiceResult<AwardResponse>> UpdateAwardAsync(int id, UpdateAwardRequest request);
}

public sealed class AwardService : IAwardService
{
    private readonly IAwardRepository _awardRepository;

    public AwardService(IAwardRepository awardRepository)
    {
        _awardRepository = awardRepository;
    }

    public async Task<ServiceResult<IReadOnlyList<AwardResponse>>> GetAwardsAsync(string raceId)
    {
        if (!await _awardRepository.RaceExistsAsync(raceId))
        {
            return ServiceResult<IReadOnlyList<AwardResponse>>.NotFound("Race does not exist.");
        }

        return ServiceResult<IReadOnlyList<AwardResponse>>.Success(
            await _awardRepository.GetResponsesByRaceAsync(raceId));
    }

    public async Task<ServiceResult<AwardResponse>> CreateAwardAsync(CreateAwardRequest request)
    {
        if (!await _awardRepository.RaceExistsAsync(request.RaceId))
        {
            return ServiceResult<AwardResponse>.NotFound("Race does not exist.");
        }

        if (await _awardRepository.ExistsForRaceRankAsync(request.RaceId, request.Rank))
        {
            return ServiceResult<AwardResponse>.Conflict("An award for this race and rank already exists.");
        }

        var award = new Awards
        {
            RaceID = request.RaceId,
            Rank = request.Rank,
            PriceMoney = request.PriceMoney
        };

        _awardRepository.Add(award);
        await _awardRepository.SaveChangesAsync();
        return ServiceResult<AwardResponse>.Created(ToResponse(award));
    }

    public async Task<ServiceResult<AwardResponse>> UpdateAwardAsync(int id, UpdateAwardRequest request)
    {
        var award = await _awardRepository.GetByIdAsync(id);
        if (award is null)
        {
            return ServiceResult<AwardResponse>.NotFound();
        }

        award.PriceMoney = request.PriceMoney;
        await _awardRepository.SaveChangesAsync();
        return ServiceResult<AwardResponse>.Success(ToResponse(award));
    }

    private static AwardResponse ToResponse(Awards award)
    {
        return new AwardResponse(award.Id, award.RaceID, award.Rank, award.PriceMoney);
    }
}
