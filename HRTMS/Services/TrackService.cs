using HRTMS.Models.DTOs;
using HRTMS.Models.on_board;
using HRTMS.Repositories;

namespace HRTMS.Services;

public interface ITrackService
{
    Task<IReadOnlyList<TrackResponse>> GetTracksAsync();
    Task<ServiceResult<TrackResponse>> GetTrackAsync(string id);
    Task<ServiceResult<TrackResponse>> CreateTrackAsync(CreateTrackRequest request);
    Task<ServiceResult<TrackResponse>> UpdateTrackAsync(string id, UpdateTrackRequest request);
    Task<ServiceResult<bool>> DeleteTrackAsync(string id);
}

public sealed class TrackService : ITrackService
{
    private readonly ITrackRepository _trackRepository;

    public TrackService(ITrackRepository trackRepository)
    {
        _trackRepository = trackRepository;
    }

    public Task<IReadOnlyList<TrackResponse>> GetTracksAsync() => _trackRepository.GetResponsesAsync();

    public async Task<ServiceResult<TrackResponse>> GetTrackAsync(string id)
    {
        var track = await _trackRepository.GetResponseByIdAsync(id);
        return track is null
            ? ServiceResult<TrackResponse>.NotFound()
            : ServiceResult<TrackResponse>.Success(track);
    }

    public async Task<ServiceResult<TrackResponse>> CreateTrackAsync(CreateTrackRequest request)
    {
        var trackId = request.TrackId.Trim();
        if (await _trackRepository.ExistsAsync(trackId))
        {
            return ServiceResult<TrackResponse>.Conflict("Track ID already exists.");
        }

        var track = new Tracks
        {
            TrackId = trackId,
            TrackName = request.TrackName.Trim(),
            Length = request.Length.Trim(),
            Width = request.Width.Trim(),
            MaxLanes = request.MaxLanes,
            AvailableDistances = request.AvailableDistances.Trim()
        };

        _trackRepository.Add(track);
        await _trackRepository.SaveChangesAsync();
        return ServiceResult<TrackResponse>.Created(ToResponse(track));
    }

    public async Task<ServiceResult<TrackResponse>> UpdateTrackAsync(string id, UpdateTrackRequest request)
    {
        var track = await _trackRepository.GetByIdAsync(id);
        if (track is null)
        {
            return ServiceResult<TrackResponse>.NotFound();
        }

        track.TrackName = request.TrackName.Trim();
        track.Length = request.Length.Trim();
        track.Width = request.Width.Trim();
        track.MaxLanes = request.MaxLanes;
        track.AvailableDistances = request.AvailableDistances.Trim();

        await _trackRepository.SaveChangesAsync();
        return ServiceResult<TrackResponse>.Success(ToResponse(track));
    }

    public async Task<ServiceResult<bool>> DeleteTrackAsync(string id)
    {
        var track = await _trackRepository.GetByIdAsync(id);
        if (track is null)
        {
            return ServiceResult<bool>.NotFound();
        }

        _trackRepository.Remove(track);
        var saved = await _trackRepository.SaveChangesAsync();
        if (saved == PersistenceResult.Conflict)
        {
            return ServiceResult<bool>.Conflict("Track cannot be deleted because it is in use.");
        }

        return ServiceResult<bool>.Success(true);
    }

    private static TrackResponse ToResponse(Tracks track)
    {
        return new TrackResponse(
            track.TrackId,
            track.TrackName,
            track.Length,
            track.Width,
            track.MaxLanes,
            track.AvailableDistances);
    }
}
