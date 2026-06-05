using HRTMS.Models.DTOs;
using HRTMS.Models.on_board;
using HRTMS.Repositories;

namespace HRTMS.Services;

public interface IRaceResultService
{
    Task<ServiceResult<IReadOnlyList<RaceResultResponse>>> GetRaceResultsAsync(string raceId);
    Task<ServiceResult<RaceResultResponse>> CreateRaceResultAsync(CreateRaceResultRequest request);
    Task<ServiceResult<RaceResultResponse>> UpdateRaceResultAsync(int id, UpdateRaceResultRequest request);
    Task<ServiceResult<bool>> DeleteRaceResultAsync(int id);
}

public sealed class RaceResultService : IRaceResultService
{
    private const string ApprovedRegistrationStatusCode = "APPROVED";

    private readonly IRaceResultRepository _raceResultRepository;

    public RaceResultService(IRaceResultRepository raceResultRepository)
    {
        _raceResultRepository = raceResultRepository;
    }

    public async Task<ServiceResult<IReadOnlyList<RaceResultResponse>>> GetRaceResultsAsync(string raceId)
    {
        if (!await _raceResultRepository.RaceExistsAsync(raceId))
        {
            return ServiceResult<IReadOnlyList<RaceResultResponse>>.NotFound("Race does not exist.");
        }

        var results = await _raceResultRepository.GetResponsesByRaceIdAsync(raceId);
        return ServiceResult<IReadOnlyList<RaceResultResponse>>.Success(results);
    }

    public async Task<ServiceResult<RaceResultResponse>> CreateRaceResultAsync(CreateRaceResultRequest request)
    {
        var race = await _raceResultRepository.GetRaceSummaryAsync(request.RaceId);
        if (race is null)
        {
            return ServiceResult<RaceResultResponse>.NotFound("Race does not exist.");
        }

        if (!CanRecordResults(race.StatusCode))
        {
            return ServiceResult<RaceResultResponse>.Conflict("Race results can only be entered for an ongoing or finished race.");
        }

        var horse = await _raceResultRepository.GetHorseSummaryAsync(request.HorseId);
        if (horse is null)
        {
            return ServiceResult<RaceResultResponse>.NotFound("Horse does not exist.");
        }

        if (!await _raceResultRepository.HasApprovedRegistrationAsync(
                request.RaceId,
                request.HorseId,
                ApprovedRegistrationStatusCode))
        {
            return ServiceResult<RaceResultResponse>.BadRequest("Horse does not have an approved registration for this race.");
        }

        if (await _raceResultRepository.HasResultForHorseAsync(request.RaceId, request.HorseId))
        {
            return ServiceResult<RaceResultResponse>.Conflict("This horse already has a result for this race.");
        }

        if (await _raceResultRepository.HasResultRankAsync(request.RaceId, request.Rank))
        {
            return ServiceResult<RaceResultResponse>.Conflict("This rank is already used for this race.");
        }

        var result = new RaceResults
        {
            RaceId = request.RaceId,
            HorseId = request.HorseId,
            JockeyId = request.JockeyId,
            Rank = request.Rank,
            FinishTime = request.FinishTime,
            Disqualified = request.Disqualified,
            Published = request.Published,
            Violation = request.Violation,
            PrizeMoney = request.PrizeMoney
        };

        _raceResultRepository.Add(result);
        var saved = await _raceResultRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<RaceResultResponse>.Conflict("This horse or rank already has a result for this race.");
        }

        return ServiceResult<RaceResultResponse>.Created(new RaceResultResponse(
            result.Id,
            result.RaceId,
            race.RaceName,
            result.HorseId,
            horse.HorseName,
            result.JockeyId,
            result.Rank,
            result.FinishTime,
            result.Disqualified,
            result.Published,
            result.Violation,
            result.PrizeMoney));
    }

    public async Task<ServiceResult<RaceResultResponse>> UpdateRaceResultAsync(int id, UpdateRaceResultRequest request)
    {
        var result = await _raceResultRepository.GetByIdWithRaceAsync(id);
        if (result is null)
        {
            return ServiceResult<RaceResultResponse>.NotFound();
        }

        if (result.Races?.StatusId is null)
        {
            return ServiceResult<RaceResultResponse>.Conflict("Race results can only be edited for an ongoing or finished race.");
        }

        var raceStatusCode = await _raceResultRepository.GetRaceStatusCodeAsync(result.Races.StatusId);
        if (!CanRecordResults(raceStatusCode))
        {
            return ServiceResult<RaceResultResponse>.Conflict("Race results can only be edited for an ongoing or finished race.");
        }

        if (await _raceResultRepository.HasResultRankAsync(result.RaceId, request.Rank, id))
        {
            return ServiceResult<RaceResultResponse>.Conflict("This rank is already used for this race.");
        }

        result.Rank = request.Rank;
        result.JockeyId = request.JockeyId;
        result.FinishTime = request.FinishTime;
        result.Disqualified = request.Disqualified;
        result.Published = request.Published;
        result.Violation = request.Violation;
        result.PrizeMoney = request.PrizeMoney;

        var saved = await _raceResultRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<RaceResultResponse>.Conflict("This rank is already used for this race.");
        }

        var response = await _raceResultRepository.GetResponseByIdAsync(id);
        return response is null
            ? ServiceResult<RaceResultResponse>.Problem("Race result was saved but could not be read back.")
            : ServiceResult<RaceResultResponse>.Success(response);
    }

    public async Task<ServiceResult<bool>> DeleteRaceResultAsync(int id)
    {
        var result = await _raceResultRepository.GetByIdAsync(id);
        if (result is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        _raceResultRepository.Remove(result);
        await _raceResultRepository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    private static bool CanRecordResults(string? statusCode)
    {
        return statusCode is RaceStatusCodes.Ongoing or RaceStatusCodes.Finished;
    }
}
