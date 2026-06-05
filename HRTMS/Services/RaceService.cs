using HRTMS.Models.DTOs;
using HRTMS.Services.Rules;
using HRTMS.Models.on_board;
using HRTMS.Repositories;

namespace HRTMS.Services;

public interface IRaceService
{
    Task<ServiceResult<IReadOnlyList<RaceResponse>>> GetRacesAsync(string? status);
    Task<ServiceResult<RaceResponse>> GetRaceAsync(string id);
    Task<IReadOnlyList<RaceResponse>> GetPublishedRacesAsync();
    Task<ServiceResult<RaceResponse>> CreateRaceAsync(CreateRaceRequest request);
    Task<ServiceResult<RaceResponse>> UpdateRaceAsync(string id, UpdateRaceRequest request);
    Task<ServiceResult<bool>> DeleteRaceAsync(string id);
    Task<ServiceResult<RaceResponse>> PublishRaceAsync(string id);
}

public sealed class RaceService : IRaceService
{
    private const string OpenStatusAlias = "OPEN";
    private const string CompletedStatusAlias = "COMPLETED";

    private static readonly string[] PublishedStatusCodes = [RaceStatusCodes.Published];

    private static readonly string[] ValidRaceStatusCodes =
    [
        RaceStatusCodes.Scheduled,
        RaceStatusCodes.Ongoing,
        RaceStatusCodes.Finished,
        RaceStatusCodes.Published,
        RaceStatusCodes.Cancelled
    ];

    private readonly IRaceRepository _raceRepository;
    private readonly TimeProvider _timeProvider;

    public RaceService(IRaceRepository raceRepository, TimeProvider timeProvider)
    {
        _raceRepository = raceRepository;
        _timeProvider = timeProvider;
    }

    public async Task<ServiceResult<IReadOnlyList<RaceResponse>>> GetRacesAsync(string? status)
    {
        string? statusCode = null;

        if (!string.IsNullOrWhiteSpace(status))
        {
            statusCode = NormalizeStatusCode(status);
            if (!ValidRaceStatusCodes.Contains(statusCode))
            {
                return ServiceResult<IReadOnlyList<RaceResponse>>.BadRequest("Race status does not exist.");
            }
        }

        var races = await _raceRepository.GetResponsesAsync(statusCode);
        return ServiceResult<IReadOnlyList<RaceResponse>>.Success(races);
    }

    public async Task<ServiceResult<RaceResponse>> GetRaceAsync(string id)
    {
        var race = await _raceRepository.GetResponseByIdAsync(id);
        return race is null
            ? ServiceResult<RaceResponse>.NotFound()
            : ServiceResult<RaceResponse>.Success(race);
    }

    public Task<IReadOnlyList<RaceResponse>> GetPublishedRacesAsync()
    {
        return _raceRepository.GetPublishedResponsesAsync(PublishedStatusCodes);
    }

    public async Task<ServiceResult<RaceResponse>> CreateRaceAsync(CreateRaceRequest request)
    {
        if (await _raceRepository.ExistsAsync(request.RaceId))
        {
            return ServiceResult<RaceResponse>.Conflict("Race ID already exists.");
        }

        var tournament = await _raceRepository.GetTournamentAsync(request.TournamentId);
        if (tournament is null)
        {
            return ServiceResult<RaceResponse>.BadRequest("Tournament does not exist.");
        }

        var statusCode = NormalizeStatusCode(request.StatusCode);
        var status = await _raceRepository.GetActiveStatusAsync(statusCode);
        if (status is null)
        {
            return ServiceResult<RaceResponse>.BadRequest("Race status does not exist or is inactive.");
        }

        if (status.StatusCode == RaceStatusCodes.Published)
        {
            return ServiceResult<RaceResponse>.BadRequest("Use the publish endpoint to publish a race.");
        }

        var validationError = ValidateSchedule(request.ScheduledAt, tournament, status.StatusCode);
        if (validationError is not null)
        {
            return ServiceResult<RaceResponse>.BadRequest(validationError);
        }

        var race = new Races
        {
            RaceID = request.RaceId,
            TournamentId = request.TournamentId,
            RaceName = request.RaceName,
            ScheduledAt = request.ScheduledAt,
            RoundNumber = request.RoundNumber,
            MinAge = request.MinAge,
            MaxAge = request.MaxAge,
            MinWeight = request.MinWeight,
            MaxWeight = request.MaxWeight,
            AllowedBreeds = request.AllowedBreeds,
            RequiresValidHealthCert = request.RequiresValidHealthCert,
            Distance = request.Distance,
            Lanes = request.Lanes,
            StatusId = status.StatusId
        };

        _raceRepository.Add(race);
        var saved = await _raceRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<RaceResponse>.Conflict("Race ID already exists.");
        }

        return ServiceResult<RaceResponse>.Created(ToResponse(race, status.StatusCode));
    }

    public async Task<ServiceResult<RaceResponse>> UpdateRaceAsync(string id, UpdateRaceRequest request)
    {
        var race = await _raceRepository.GetByIdAsync(id);
        if (race is null)
        {
            return ServiceResult<RaceResponse>.NotFound();
        }

        var tournament = await _raceRepository.GetTournamentAsync(request.TournamentId);
        if (tournament is null)
        {
            return ServiceResult<RaceResponse>.BadRequest("Tournament does not exist.");
        }

        var statusCode = NormalizeStatusCode(request.StatusCode);
        var status = await _raceRepository.GetActiveStatusAsync(statusCode);
        if (status is null)
        {
            return ServiceResult<RaceResponse>.BadRequest("Race status does not exist or is inactive.");
        }

        if (status.StatusCode == RaceStatusCodes.Published && race.StatusId != status.StatusId)
        {
            return ServiceResult<RaceResponse>.BadRequest("Use the publish endpoint to publish a race.");
        }

        if (status.StatusCode != RaceStatusCodes.Published &&
            await _raceRepository.HasStatusAsync(race.StatusId, RaceStatusCodes.Published))
        {
            return ServiceResult<RaceResponse>.Conflict("A published race status cannot be changed.");
        }

        var validationError = ValidateSchedule(request.ScheduledAt, tournament, status.StatusCode);
        if (validationError is not null)
        {
            return ServiceResult<RaceResponse>.BadRequest(validationError);
        }

        race.TournamentId = request.TournamentId;
        race.RaceName = request.RaceName;
        race.ScheduledAt = request.ScheduledAt;
        race.RoundNumber = request.RoundNumber;
        race.MinAge = request.MinAge;
        race.MaxAge = request.MaxAge;
        race.MinWeight = request.MinWeight;
        race.MaxWeight = request.MaxWeight;
        race.AllowedBreeds = request.AllowedBreeds;
        race.RequiresValidHealthCert = request.RequiresValidHealthCert;
        race.Distance = request.Distance;
        race.Lanes = request.Lanes;
        race.StatusId = status.StatusId;

        await _raceRepository.SaveChangesAsync();

        return ServiceResult<RaceResponse>.Success(ToResponse(race, status.StatusCode));
    }

    public async Task<ServiceResult<bool>> DeleteRaceAsync(string id)
    {
        var race = await _raceRepository.GetByIdAsync(id);
        if (race is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        _raceRepository.Remove(race);
        var saved = await _raceRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<bool>.Conflict("Race cannot be deleted because it is in use.");
        }

        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<RaceResponse>> PublishRaceAsync(string id)
    {
        var race = await _raceRepository.GetByIdWithStatusAsync(id);
        if (race is null)
        {
            return ServiceResult<RaceResponse>.NotFound();
        }

        var publishedStatus = await _raceRepository.GetActiveStatusAsync(RaceStatusCodes.Published);
        if (publishedStatus is null)
        {
            return ServiceResult<RaceResponse>.Problem("The published race status is not configured.");
        }

        if (race.Status?.StatusCode == RaceStatusCodes.Published)
        {
            await _raceRepository.PublishUnpublishedResultsAsync(id);
            await _raceRepository.SaveChangesAsync();
            return ServiceResult<RaceResponse>.Success(ToResponse(race, publishedStatus.StatusCode));
        }

        if (race.Status?.StatusCode != RaceStatusCodes.Finished)
        {
            return ServiceResult<RaceResponse>.Conflict("Only a finished race can be published.");
        }

        race.StatusId = publishedStatus.StatusId;
        await _raceRepository.PublishUnpublishedResultsAsync(id);
        await _raceRepository.SaveChangesAsync();

        return ServiceResult<RaceResponse>.Success(ToResponse(race, publishedStatus.StatusCode));
    }

    private string? ValidateSchedule(DateTime scheduledAt, Tournaments tournament, string statusCode)
    {
        if (!SchedulingRules.IsWithinTournament(scheduledAt, tournament.Start, tournament.End))
        {
            return "Race schedule must be inside its tournament date range.";
        }

        var now = SchedulingRules.LocalNow(_timeProvider);
        if (statusCode == RaceStatusCodes.Scheduled && scheduledAt <= now)
        {
            return "A scheduled race must start in the future.";
        }

        if (statusCode is RaceStatusCodes.Ongoing or RaceStatusCodes.Finished or RaceStatusCodes.Published &&
            scheduledAt > now)
        {
            return "An ongoing or completed race cannot start in the future.";
        }

        return null;
    }

    private static string NormalizeStatusCode(string statusCode)
    {
        var normalizedStatusCode = statusCode.Trim().ToUpperInvariant();
        return normalizedStatusCode switch
        {
            OpenStatusAlias => RaceStatusCodes.Scheduled,
            CompletedStatusAlias => RaceStatusCodes.Finished,
            _ => normalizedStatusCode
        };
    }

    private static RaceResponse ToResponse(Races race, string statusCode)
    {
        return new RaceResponse(
            race.RaceID,
            race.TournamentId,
            race.RaceName,
            race.ScheduledAt,
            race.RoundNumber,
            race.MinAge,
            race.MaxAge,
            race.MinWeight,
            race.MaxWeight,
            race.AllowedBreeds,
            race.RequiresValidHealthCert,
            race.Distance,
            race.Lanes,
            race.StatusId,
            statusCode);
    }
}
