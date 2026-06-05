using HRTMS.Models.DTOs;
using HRTMS.Services.Rules;
using HRTMS.Models.on_board;
using HRTMS.Repositories;

namespace HRTMS.Services;

public interface ITournamentService
{
    Task<IReadOnlyList<TournamentResponse>> GetTournamentsAsync();
    Task<ServiceResult<TournamentResponse>> GetTournamentAsync(string id);
    Task<ServiceResult<TournamentResponse>> CreateTournamentAsync(CreateTournamentRequest request);
    Task<ServiceResult<TournamentResponse>> UpdateTournamentAsync(string id, UpdateTournamentRequest request);
    Task<ServiceResult<bool>> DeleteTournamentAsync(string id);
}

public sealed class TournamentService : ITournamentService
{
    private readonly ITournamentRepository _tournamentRepository;
    private readonly TimeProvider _timeProvider;

    public TournamentService(ITournamentRepository tournamentRepository, TimeProvider timeProvider)
    {
        _tournamentRepository = tournamentRepository;
        _timeProvider = timeProvider;
    }

    public Task<IReadOnlyList<TournamentResponse>> GetTournamentsAsync()
    {
        return _tournamentRepository.GetResponsesAsync();
    }

    public async Task<ServiceResult<TournamentResponse>> GetTournamentAsync(string id)
    {
        var tournament = await _tournamentRepository.GetResponseByIdAsync(id);
        return tournament is null
            ? ServiceResult<TournamentResponse>.NotFound()
            : ServiceResult<TournamentResponse>.Success(tournament);
    }

    public async Task<ServiceResult<TournamentResponse>> CreateTournamentAsync(CreateTournamentRequest request)
    {
        var tournamentId = request.TournamentId.Trim();
        if (await _tournamentRepository.ExistsAsync(tournamentId))
        {
            return ServiceResult<TournamentResponse>.Conflict("Tournament ID already exists.");
        }

        var validation = await ValidateRequestAsync(request);
        if (validation.Error is not null)
        {
            return ServiceResult<TournamentResponse>.BadRequest(validation.Error);
        }

        var tournament = new Tournaments
        {
            TournamentId = tournamentId,
            Name = request.Name.Trim(),
            TrackID = request.TrackId.Trim(),
            Start = request.Start,
            End = request.End,
            StatusId = validation.StatusId
        };

        _tournamentRepository.Add(tournament);
        await _tournamentRepository.SaveChangesAsync();

        return ServiceResult<TournamentResponse>.Created(ToResponse(tournament, validation.StatusCode!));
    }

    public async Task<ServiceResult<TournamentResponse>> UpdateTournamentAsync(string id, UpdateTournamentRequest request)
    {
        var tournament = await _tournamentRepository.GetByIdAsync(id);
        if (tournament is null)
        {
            return ServiceResult<TournamentResponse>.NotFound();
        }

        var validation = await ValidateRequestAsync(request, tournament);
        if (validation.Error is not null)
        {
            return ServiceResult<TournamentResponse>.BadRequest(validation.Error);
        }

        tournament.Name = request.Name.Trim();
        tournament.TrackID = request.TrackId.Trim();
        tournament.Start = request.Start;
        tournament.End = request.End;
        tournament.StatusId = validation.StatusId;

        await _tournamentRepository.SaveChangesAsync();
        return ServiceResult<TournamentResponse>.Success(ToResponse(tournament, validation.StatusCode!));
    }

    public async Task<ServiceResult<bool>> DeleteTournamentAsync(string id)
    {
        var tournament = await _tournamentRepository.GetByIdAsync(id);
        if (tournament is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        _tournamentRepository.Remove(tournament);
        var saved = await _tournamentRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<bool>.Conflict("Tournament cannot be deleted because it is in use.");
        }

        return ServiceResult<bool>.Success(true);
    }

    private async Task<(string? Error, int StatusId, string? StatusCode)> ValidateRequestAsync(
        TournamentRequest request,
        Tournaments? existing = null)
    {
        if (request.End < request.Start)
        {
            return ("Tournament end date must be on or after its start date.", 0, null);
        }

        var today = SchedulingRules.LocalNow(_timeProvider).Date;
        if (request.Start.Date < today && existing?.Start.Date != request.Start.Date)
        {
            return ("A tournament cannot be scheduled to start in the past.", 0, null);
        }

        if (existing is not null &&
            await _tournamentRepository.HasRaceOutsideRangeAsync(existing.TournamentId, request.Start, request.End))
        {
            return ("Tournament date range must include all of its races.", 0, null);
        }

        if (!await _tournamentRepository.TrackExistsAsync(request.TrackId))
        {
            return ("Track does not exist.", 0, null);
        }

        var status = await _tournamentRepository.GetActiveStatusAsync(request.StatusCode);
        if (status is null)
        {
            return ("Tournament status does not exist or is inactive.", 0, null);
        }

        return (null, status.StatusId, status.StatusCode);
    }

    private static TournamentResponse ToResponse(Tournaments tournament, string statusCode)
    {
        return new TournamentResponse(
            tournament.TournamentId,
            tournament.Name,
            tournament.TrackID,
            tournament.Start,
            tournament.End,
            tournament.StatusId,
            statusCode);
    }
}
