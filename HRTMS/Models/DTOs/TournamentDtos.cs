using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.DTOs;

public static class TournamentStatusCodes
{
    public const string Draft = "DRAFT";
}

public abstract record TournamentRequest(
    [Required] string Name,
    [Required] string TrackId,
    DateTime Start,
    DateTime End,
    [Required] string StatusCode);

public record CreateTournamentRequest(
    [Required] string TournamentId,
    string Name,
    string TrackId,
    DateTime Start,
    DateTime End,
    string StatusCode = TournamentStatusCodes.Draft)
    : TournamentRequest(Name, TrackId, Start, End, StatusCode);

public record UpdateTournamentRequest(
    string Name,
    string TrackId,
    DateTime Start,
    DateTime End,
    string StatusCode)
    : TournamentRequest(Name, TrackId, Start, End, StatusCode);

public record TournamentResponse(
    string TournamentId,
    string Name,
    string TrackId,
    DateTime Start,
    DateTime End,
    int StatusId,
    string StatusCode);
