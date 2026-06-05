using HRTMS.Data;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Repositories;

public interface IPortalDataRepository
{
    Task<object> GetPortalDataAsync();
}

public sealed class PortalDataRepository : IPortalDataRepository
{
    private readonly ApplicationDbContext _context;

    public PortalDataRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetPortalDataAsync()
    {
        var trackEntities = await _context.Tracks.AsNoTracking().OrderBy(item => item.TrackName).ToListAsync();
        var tournamentEntities = await _context.Tournaments
            .AsNoTracking()
            .Include(item => item.Tracks)
            .Include(item => item.Status)
            .OrderBy(item => item.Start)
            .ToListAsync();
        var awardEntities = await _context.Awards.AsNoTracking().OrderBy(item => item.Rank).ToListAsync();
        var raceEntities = await _context.Races
            .AsNoTracking()
            .Include(item => item.Tournament)
            .ThenInclude(item => item!.Tracks)
            .Include(item => item.Status)
            .OrderBy(item => item.ScheduledAt)
            .ToListAsync();
        var horseEntities = await _context.Horses
            .AsNoTracking()
            .Include(item => item.Status)
            .OrderBy(item => item.HourseName)
            .ToListAsync();
        var jockeyEntities = await _context.Jockeys
            .AsNoTracking()
            .Include(item => item.Account)
            .Include(item => item.Status)
            .OrderBy(item => item.Account!.FullName)
            .ToListAsync();
        var refereeEntities = await _context.Referees
            .AsNoTracking()
            .Include(item => item.Account)
            .OrderBy(item => item.RefereeName)
            .ToListAsync();
        var accountEntities = await _context.Accounts
            .AsNoTracking()
            .Include(item => item.Role)
            .Include(item => item.Status)
            .OrderBy(item => item.Username)
            .ToListAsync();
        var registrationEntities = await _context.RaceRegistrations
            .AsNoTracking()
            .Include(item => item.Horse)
            .Include(item => item.Status)
            .OrderBy(item => item.RegistrationId)
            .ToListAsync();
        var panelEntities = await _context.RefereePanels.AsNoTracking().OrderBy(item => item.RefereePanelId).ToListAsync();
        var roundEntities = await _context.Rounds.AsNoTracking().OrderBy(item => item.StartTime).ToListAsync();
        var resultEntities = await _context.RaceResults.AsNoTracking().OrderBy(item => item.RaceId).ThenBy(item => item.Rank).ToListAsync();
        var invitationEntities = await _context.JockeyInvitations
            .AsNoTracking()
            .Include(item => item.Status)
            .Include(item => item.Registration)
            .ThenInclude(item => item!.Horse)
            .Include(item => item.Registration)
            .ThenInclude(item => item!.Race)
            .OrderBy(item => item.Id)
            .ToListAsync();
        var violationEntities = await _context.Violations.AsNoTracking().OrderBy(item => item.Id).ToListAsync();
        var reportEntities = await _context.RefereeReports.AsNoTracking().OrderBy(item => item.Id).ToListAsync();
        var ceremonyEntities = await _context.AwardCeremonies.AsNoTracking().OrderBy(item => item.ScheduledAt).ToListAsync();
        var predictionEntities = await _context.Predictions.AsNoTracking().OrderByDescending(item => item.CreatedAt).ToListAsync();

        var registrationsByRaceHorse = registrationEntities
            .GroupBy(item => $"{item.RaceId}:{item.HorseId}")
            .ToDictionary(group => group.Key, group => group.First());

        var tracks = trackEntities.Select(track => new
        {
            id = track.TrackId,
            name = track.TrackName,
            lengthMeters = ParseNumber(track.Length),
            widthMeters = ParseNumber(track.Width),
            distances = ParseNumbers(track.AvailableDistances)
                .Select(meters => new { meters, chuteLabel = $"{meters}m Chute" })
        });
        var tournaments = tournamentEntities.Select(tournament => new
        {
            id = tournament.TournamentId,
            name = tournament.Name,
            season = GetSeason(tournament.Start),
            trackId = tournament.TrackID,
            startDate = tournament.Start.ToString("yyyy-MM-dd"),
            endDate = tournament.End.ToString("yyyy-MM-dd"),
            status = ToTitle(tournament.Status?.StatusCode)
        });
        var races = raceEntities.Select(race => new
        {
            id = race.RaceID,
            tournamentId = race.TournamentId,
            round = race.RoundNumber,
            date = race.ScheduledAt.ToString("yyyy-MM-dd"),
            time = race.ScheduledAt.ToString("HH:mm"),
            track = race.Tournament?.Tracks?.TrackName ?? string.Empty,
            distance = ParseNumber(race.Distance),
            lanes = race.Lanes,
            status = ToRaceStatus(race.Status?.StatusCode),
            eligibility = new
            {
                minAge = race.MinAge,
                maxAge = race.MaxAge,
                minWeight = race.MinWeight,
                maxWeight = race.MaxWeight,
                allowedBreeds = ParseStrings(race.AllowedBreeds),
                requiresValidHealthCert = race.RequiresValidHealthCert
            },
            prizes = awardEntities
                .Where(award => award.RaceID == race.RaceID)
                .Select(award => new { backendId = award.Id, rank = award.Rank, money = award.PriceMoney, trophy = string.Empty })
        });
        var horses = horseEntities.Select(horse => new
        {
            id = horse.HorseId,
            name = horse.HourseName,
            breed = horse.Breed,
            age = horse.Age,
            weight = horse.Weight,
            ownerId = horse.OwnerId,
            healthCertExpiry = horse.Health_Cert_Expiry.ToString("yyyy-MM-dd"),
            status = ToHorseStatus(horse.Status?.StatusCode),
            documents = new[]
            {
                new
                {
                    type = "Health Certificate",
                    number = horse.Documents,
                    issuedBy = string.Empty,
                    issuedDate = string.Empty,
                    expiryDate = horse.Health_Cert_Expiry.ToString("yyyy-MM-dd")
                }
            }
        });
        var jockeys = jockeyEntities.Select(jockey => new
        {
            id = jockey.JockeyId,
            accountId = jockey.AccountId,
            name = jockey.Account?.FullName ?? jockey.JockeyId,
            licenseNo = jockey.LicenseNumber,
            weight = jockey.Weight,
            ranking = int.TryParse(jockey.Ranking, out var rank) ? rank : 0,
            status = ToTitle(jockey.Status?.StatusCode),
            contact = jockey.Contact
        });
        var owners = accountEntities
            .Where(account => account.Role?.RoleCode == "HORSE_OWNER")
            .Select(owner => new { id = owner.AccountId, name = owner.FullName, stable = string.Empty, contact = string.Empty });
        var referees = refereeEntities.Select(referee => new
        {
            id = referee.RefereeId,
            accountId = referee.AccountId,
            name = referee.RefereeName,
            licenseNo = referee.RefereeLicenseNumber,
            experience = string.Empty,
            status = "Active"
        });
        var registrations = registrationEntities.Select(registration => new
        {
            id = registration.RegistrationId,
            raceId = registration.RaceId,
            horseId = registration.HorseId,
            jockeyId = registration.JockeyName,
            backupJockeyId = registration.BackupJockeyId,
            ownerId = registration.Horse?.OwnerId ?? string.Empty,
            status = ToTitle(registration.Status?.StatusCode),
            submittedAt = string.Empty,
            reason = string.Empty
        });
        var refereeAssignments = panelEntities
            .SelectMany(panel => new[] { panel.LeadID, panel.Member1ID, panel.Member2ID }
                .Select(refereeId => new { raceId = panel.RaceId, refereeId }));
        var refereePanels = panelEntities.Select(panel => new
        {
            backendId = panel.RefereePanelId,
            raceId = panel.RaceId,
            members = new[]
            {
                new { refereeId = panel.LeadID, role = "Lead", signed = false, signedAt = (string?)null },
                new { refereeId = panel.Member1ID, role = "Member", signed = false, signedAt = (string?)null },
                new { refereeId = panel.Member2ID, role = "Member", signed = false, signedAt = (string?)null }
            }
        });
        var rounds = roundEntities.Select(round => new
        {
            id = round.RoundId.ToString(),
            backendId = round.RoundId,
            raceId = round.RaceID,
            type = ToRoundType(round.RoundName),
            startTime = round.StartTime.ToString("HH:mm"),
            status = "Scheduled"
        });
        var raceResults = resultEntities.Select(result =>
        {
            registrationsByRaceHorse.TryGetValue($"{result.RaceId}:{result.HorseId}", out var registration);
            return new
            {
                backendId = result.Id,
                raceId = result.RaceId,
                horseId = result.HorseId,
                jockeyId = result.JockeyId ?? registration?.JockeyName ?? string.Empty,
                finishTime = result.FinishTime,
                rank = result.Rank,
                disqualified = result.Disqualified,
                published = result.Published
            };
        });
        var jockeyInvitations = invitationEntities.Select(invitation => new
        {
            id = $"INV{invitation.Id:000}",
            backendId = invitation.Id,
            registrationId = invitation.RegistrationId,
            jockeyId = invitation.JockeyId,
            ownerId = invitation.Registration?.Horse?.OwnerId ?? string.Empty,
            horseId = invitation.Registration?.HorseId ?? string.Empty,
            raceId = invitation.Registration?.RaceId ?? string.Empty,
            status = ToInvitationStatus(invitation.Status?.StatusCode),
            sentAt = invitation.CreatedAt == default ? string.Empty : invitation.CreatedAt.ToString("yyyy-MM-dd"),
            note = string.Empty
        });
        var systemUsers = accountEntities.Select(account => new
        {
            id = account.AccountId,
            username = account.Username,
            name = account.FullName,
            role = account.Role?.RoleCode == "HORSE_OWNER" ? "OWNER" : account.Role?.RoleCode ?? string.Empty,
            status = ToTitle(account.Status?.StatusCode)
        });
        var violations = violationEntities.Select(violation => new
        {
            id = violation.Id,
            raceId = violation.RaceId,
            horseId = violation.HorseId,
            jockeyId = violation.JockeyId,
            type = violation.Type,
            severity = violation.Severity,
            description = violation.Description
        });
        var refereeReports = reportEntities.Select(report => new
        {
            id = report.Id,
            raceId = report.RaceId,
            refereeId = report.RefereeId,
            status = ToTitle(report.Status),
            notes = report.Notes
        });
        var awardCeremonies = ceremonyEntities.Select(ceremony => new
        {
            raceId = ceremony.RaceId,
            scheduledAt = ceremony.ScheduledAt.ToString("yyyy-MM-dd HH:mm"),
            status = ToTitle(ceremony.Status),
            venue = ceremony.Venue,
            notes = ceremony.Notes
        });
        var predictions = predictionEntities.Select(prediction => new
        {
            id = $"P{prediction.Id:000}",
            backendId = prediction.Id,
            accountId = prediction.AccountId,
            raceId = prediction.RaceId,
            horseId = prediction.HorseId,
            predictedRank = prediction.PredictedRank,
            status = ToTitle(prediction.Status),
            payout = prediction.Payout,
            createdAt = prediction.CreatedAt.ToString("yyyy-MM-dd")
        });

        return new
        {
            tracks,
            tournaments,
            races,
            horses,
            jockeys,
            owners,
            referees,
            registrations,
            refereeAssignments,
            refereePanels,
            rounds,
            raceResults,
            jockeyInvitations,
            violations,
            refereeReports,
            awardCeremonies,
            systemUsers,
            predictions
        };
    }

    private static int ParseNumber(string value)
    {
        return int.TryParse(value, out var number) ? number : 0;
    }

    private static int[] ParseNumbers(string value)
    {
        return ParseStrings(value)
            .Select(ParseNumber)
            .Where(number => number > 0)
            .ToArray();
    }

    private static string[] ParseStrings(string value)
    {
        return value
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    private static string GetSeason(DateTime date)
    {
        return date.Month switch
        {
            3 or 4 or 5 => "Spring",
            6 or 7 or 8 => "Summer",
            9 or 10 or 11 => "Autumn",
            _ => "Winter"
        };
    }

    private static string ToTitle(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var lower = value.ToLowerInvariant();
        return char.ToUpperInvariant(lower[0]) + lower[1..];
    }

    private static string ToHorseStatus(string? value)
    {
        return value == "INJURED" ? "Ineligible" : ToTitle(value);
    }

    private static string ToRaceStatus(string? value)
    {
        return value switch
        {
            "FINISHED" or "PUBLISHED" => "Completed",
            _ => ToTitle(value)
        };
    }

    private static string ToInvitationStatus(string? value)
    {
        return value == "PENDING" ? "Waiting" : ToTitle(value);
    }

    private static string ToRoundType(string value)
    {
        return value.Contains("semi", StringComparison.OrdinalIgnoreCase)
            ? "Semi-Final"
            : value.Contains("final", StringComparison.OrdinalIgnoreCase)
                ? "Final"
                : "Heat";
    }
}
