using HRTMS.Models.DTOs;
using HRTMS.Models.on_board;
using HRTMS.Repositories;
using HRTMS.Services.Rules;

namespace HRTMS.Services;

public interface IRoundService
{
    Task<ServiceResult<RoundResponse>> GetRoundAsync(int id);
    Task<IReadOnlyList<RoundResponse>> GetRoundsAsync();
    Task<ServiceResult<RoundResponse>> CreateRoundAsync(CreateRoundRequest request);
    Task<ServiceResult<RoundResponse>> UpdateRoundAsync(int id, CreateRoundRequest request);
    Task<ServiceResult<bool>> DeleteRoundAsync(int id);
}

public sealed class RoundService : IRoundService
{
    private readonly IRoundRepository _roundRepository;

    public RoundService(IRoundRepository roundRepository)
    {
        _roundRepository = roundRepository;
    }

    public async Task<ServiceResult<RoundResponse>> GetRoundAsync(int id)
    {
        var round = await _roundRepository.GetResponseByIdAsync(id);
        return round is null
            ? ServiceResult<RoundResponse>.NotFound()
            : ServiceResult<RoundResponse>.Success(round);
    }

    public Task<IReadOnlyList<RoundResponse>> GetRoundsAsync() => _roundRepository.GetResponsesAsync();

    public async Task<ServiceResult<RoundResponse>> CreateRoundAsync(CreateRoundRequest request)
    {
        var validationError = await ValidateRequestAsync(request);
        if (validationError is not null)
        {
            return ServiceResult<RoundResponse>.BadRequest(validationError);
        }

        var round = new Rounds
        {
            RaceID = request.RaceId,
            RoundName = request.RoundName,
            StartTime = request.StartTime
        };

        _roundRepository.Add(round);
        await _roundRepository.SaveChangesAsync();
        return ServiceResult<RoundResponse>.Created(ToResponse(round));
    }

    public async Task<ServiceResult<RoundResponse>> UpdateRoundAsync(int id, CreateRoundRequest request)
    {
        var round = await _roundRepository.GetByIdAsync(id);
        if (round is null)
        {
            return ServiceResult<RoundResponse>.NotFound();
        }

        var validationError = await ValidateRequestAsync(request, id);
        if (validationError is not null)
        {
            return ServiceResult<RoundResponse>.BadRequest(validationError);
        }

        round.RaceID = request.RaceId;
        round.RoundName = request.RoundName;
        round.StartTime = request.StartTime;
        await _roundRepository.SaveChangesAsync();
        return ServiceResult<RoundResponse>.Success(ToResponse(round));
    }

    public async Task<ServiceResult<bool>> DeleteRoundAsync(int id)
    {
        var round = await _roundRepository.GetByIdAsync(id);
        if (round is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        _roundRepository.Remove(round);
        await _roundRepository.SaveChangesAsync();
        return ServiceResult<bool>.Success(true);
    }

    private async Task<string?> ValidateRequestAsync(CreateRoundRequest request, int? existingRoundId = null)
    {
        var race = await _roundRepository.GetRaceScheduleAsync(request.RaceId);
        if (race is null)
        {
            return "Race does not exist.";
        }

        if (request.StartTime.Date != race.ScheduledAt.Date)
        {
            return "Round must be scheduled on the same date as its race.";
        }

        if (request.StartTime < race.ScheduledAt)
        {
            return "Round cannot start before its race schedule.";
        }

        var earliestAllowed = request.StartTime.AddMinutes(-SchedulingRules.RoundRestMinutes);
        var latestAllowed = request.StartTime.AddMinutes(SchedulingRules.RoundRestMinutes);
        if (await _roundRepository.HasRoundNearStartAsync(
                request.RaceId,
                earliestAllowed,
                latestAllowed,
                existingRoundId))
        {
            return $"Rounds must be at least {SchedulingRules.RoundRestMinutes} minutes apart.";
        }

        return null;
    }

    private static RoundResponse ToResponse(Rounds round)
    {
        return new RoundResponse(round.RoundId, round.RaceID, round.RoundName, round.StartTime);
    }
}
