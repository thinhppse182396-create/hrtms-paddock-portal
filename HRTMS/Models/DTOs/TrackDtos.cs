using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public record CreateTrackRequest(
    [Required] string TrackId,
    [Required] string TrackName,
    [Required] string Length,
    [Required] string Width,
    [Range(1, int.MaxValue)] int MaxLanes,
    [Required] string AvailableDistances);

public record UpdateTrackRequest(
    [Required] string TrackName,
    [Required] string Length,
    [Required] string Width,
    [Range(1, int.MaxValue)] int MaxLanes,
    [Required] string AvailableDistances);

public record TrackResponse(
    string TrackId,
    string TrackName,
    string Length,
    string Width,
    int MaxLanes,
    string AvailableDistances);
