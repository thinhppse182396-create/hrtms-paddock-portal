using HRTMS.Models.Horses;
using HRTMS.Models.on_board;
using HRTMS.Models.Roles;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Data;

public static class DemoDataSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        IPasswordHasher<Accounts> passwordHasher)
    {
        await SeedAccounts(context, passwordHasher);
        await SeedPeople(context);
        await SeedRaceCatalogue(context);
        await SeedRaceFlow(context);
    }

    private static async Task SeedAccounts(
        ApplicationDbContext context,
        IPasswordHasher<Accounts> passwordHasher)
    {
        var existingIds = (await context.Accounts
                .Select(account => account.AccountId)
                .ToListAsync())
            .ToHashSet();

        var accounts = new[]
        {
            CreateAccount("U001", "admin_super", "admin123", "System Admin", 1, passwordHasher),
            CreateAccount("RF-A001", "ref_sarah", "referee123", "Sarah Referee", 2, passwordHasher),
            CreateAccount("RF-A002", "ref_tom", "referee123", "Tom Blake", 2, passwordHasher),
            CreateAccount("RF-A003", "ref_priya", "referee123", "Priya Nair", 2, passwordHasher),
            CreateAccount("J-A001", "jockey_smith", "jockey123", "Smith Jockey", 3, passwordHasher),
            CreateAccount("J-A002", "jockey_maria", "jockey123", "Maria Lopez", 3, passwordHasher),
            CreateAccount("J-A003", "jockey_david", "jockey123", "David Chen", 3, passwordHasher),
            CreateAccount("O001", "owner_wayne", "owner123", "Wayne Owner", 4, passwordHasher),
            CreateAccount("O002", "owner_helena", "owner123", "Helena Cross", 4, passwordHasher),
            CreateAccount("O003", "owner_marcus", "owner123", "Marcus Reid", 4, passwordHasher),
            CreateAccount("S001", "fan_alex", "spectator123", "Alex Spectator", 5, passwordHasher)
        };

        context.Accounts.AddRange(accounts.Where(account => !existingIds.Contains(account.AccountId)));
        await context.SaveChangesAsync();
    }

    private static async Task SeedPeople(ApplicationDbContext context)
    {
        var existingRefereeIds = (await context.Referees
                .Select(referee => referee.RefereeId)
                .ToListAsync())
            .ToHashSet();
        var referees = new[]
        {
            new Referee { RefereeId = "RF001", AccountId = "RF-A001", RefereeName = "Sarah Referee", RefereeLicenseNumber = "RF-2022-005" },
            new Referee { RefereeId = "RF002", AccountId = "RF-A002", RefereeName = "Tom Blake", RefereeLicenseNumber = "RF-2021-002" },
            new Referee { RefereeId = "RF003", AccountId = "RF-A003", RefereeName = "Priya Nair", RefereeLicenseNumber = "RF-2023-008" }
        };
        context.Referees.AddRange(referees.Where(referee => !existingRefereeIds.Contains(referee.RefereeId)));

        var existingJockeyIds = (await context.Jockeys
                .Select(jockey => jockey.JockeyId)
                .ToListAsync())
            .ToHashSet();
        var jockeys = new[]
        {
            new Jockeys { JockeyId = "J001", AccountId = "J-A001", LicenseNumber = "JK-2024-001", Weight = 56, Ranking = "3", StatusId = 5, Contact = "smith@example.test" },
            new Jockeys { JockeyId = "J002", AccountId = "J-A002", LicenseNumber = "JK-2024-002", Weight = 54, Ranking = "1", StatusId = 5, Contact = "maria@example.test" },
            new Jockeys { JockeyId = "J003", AccountId = "J-A003", LicenseNumber = "JK-2023-045", Weight = 55, Ranking = "7", StatusId = 5, Contact = "david@example.test" }
        };
        context.Jockeys.AddRange(jockeys.Where(jockey => !existingJockeyIds.Contains(jockey.JockeyId)));

        await context.SaveChangesAsync();
    }

    private static async Task SeedRaceCatalogue(ApplicationDbContext context)
    {
        var existingTrackIds = (await context.Tracks
                .Select(track => track.TrackId)
                .ToListAsync())
            .ToHashSet();
        var tracks = new[]
        {
            new Tracks { TrackId = "TRK-A", TrackName = "Track A", Length = "2400", Width = "12", MaxLanes = 8, AvailableDistances = "1200,1600,2000,2400" },
            new Tracks { TrackId = "TRK-B", TrackName = "Track B", Length = "2200", Width = "9", MaxLanes = 6, AvailableDistances = "1200,1600,2000" },
            new Tracks { TrackId = "TRK-C", TrackName = "Track C", Length = "2800", Width = "15", MaxLanes = 10, AvailableDistances = "1600,2000,2400" }
        };
        context.Tracks.AddRange(tracks.Where(track => !existingTrackIds.Contains(track.TrackId)));

        var existingTournamentIds = (await context.Tournaments
                .Select(tournament => tournament.TournamentId)
                .ToListAsync())
            .ToHashSet();
        var tournaments = new[]
        {
            new Tournaments { TournamentId = "T001", Name = "Spring Classic 2026", TrackID = "TRK-A", Start = new DateTime(2026, 4, 10), End = new DateTime(2026, 4, 20), StatusId = 25 },
            new Tournaments { TournamentId = "T002", Name = "Summer Grand Prix", TrackID = "TRK-B", Start = new DateTime(2026, 6, 12), End = new DateTime(2026, 6, 25), StatusId = 24 },
            new Tournaments { TournamentId = "T003", Name = "Autumn Cup", TrackID = "TRK-C", Start = new DateTime(2025, 10, 1), End = new DateTime(2025, 10, 12), StatusId = 27 }
        };
        context.Tournaments.AddRange(tournaments.Where(tournament => !existingTournamentIds.Contains(tournament.TournamentId)));

        var existingHorseIds = (await context.Horses
                .Select(horse => horse.HorseId)
                .ToListAsync())
            .ToHashSet();
        var horses = new[]
        {
            new Horse { HorseId = "H001", HourseName = "Thunder Bolt", Breed = "Thoroughbred", Age = 5, Weight = 480, Documents = "HC-2025-0481", Health_Cert_Expiry = new DateTime(2026, 12, 1), StatusId = 10, OwnerId = "O001" },
            new Horse { HorseId = "H002", HourseName = "Silver Arrow", Breed = "Arabian", Age = 4, Weight = 460, Documents = "HC-2025-0512", Health_Cert_Expiry = new DateTime(2026, 8, 15), StatusId = 10, OwnerId = "O001" },
            new Horse { HorseId = "H003", HourseName = "Midnight Star", Breed = "Quarter Horse", Age = 6, Weight = 500, Documents = "HC-2024-0192", Health_Cert_Expiry = new DateTime(2025, 11, 1), StatusId = 9, OwnerId = "O002" },
            new Horse { HorseId = "H005", HourseName = "Royal Wind", Breed = "Arabian", Age = 5, Weight = 470, Documents = "HC-2026-0011", Health_Cert_Expiry = new DateTime(2027, 1, 10), StatusId = 10, OwnerId = "O003" }
        };
        context.Horses.AddRange(horses.Where(horse => !existingHorseIds.Contains(horse.HorseId)));

        var existingRaceIds = (await context.Races
                .Select(race => race.RaceID)
                .ToListAsync())
            .ToHashSet();
        var races = new[]
        {
            new Races { RaceID = "R001", TournamentId = "T001", RaceName = "Spring Classic Opening", Distance = "1600", Lanes = 8, StatusId = 12 },
            new Races { RaceID = "R002", TournamentId = "T001", RaceName = "Spring Classic Endurance", Distance = "2000", Lanes = 6, StatusId = 12 },
            new Races { RaceID = "R003", TournamentId = "T003", RaceName = "Autumn Cup Final", Distance = "1200", Lanes = 8, StatusId = 14 },
            new Races { RaceID = "R004", TournamentId = "T001", RaceName = "Spring Classic Final", Distance = "2400", Lanes = 10, StatusId = 13 }
        };
        context.Races.AddRange(races.Where(race => !existingRaceIds.Contains(race.RaceID)));

        await context.SaveChangesAsync();
    }

    private static async Task SeedRaceFlow(ApplicationDbContext context)
    {
        var existingRegistrationIds = (await context.RaceRegistrations
                .Select(registration => registration.RegistrationId)
                .ToListAsync())
            .ToHashSet();
        var registrations = new[]
        {
            new Registration { RegistrationId = "RG001", RaceId = "R001", HorseId = "H001", JockeyName = "J001", BackupJockeyId = "J002", StatusId = 17 },
            new Registration { RegistrationId = "RG002", RaceId = "R001", HorseId = "H002", JockeyName = "J002", StatusId = 16 },
            new Registration { RegistrationId = "RG003", RaceId = "R002", HorseId = "H005", JockeyName = "J003", StatusId = 17 },
            new Registration { RegistrationId = "RG004", RaceId = "R002", HorseId = "H003", JockeyName = "J001", StatusId = 18 },
            new Registration { RegistrationId = "RG006", RaceId = "R003", HorseId = "H001", JockeyName = "J001", StatusId = 17 },
            new Registration { RegistrationId = "RG007", RaceId = "R003", HorseId = "H005", JockeyName = "J003", StatusId = 17 },
            new Registration { RegistrationId = "RG008", RaceId = "R003", HorseId = "H002", JockeyName = "J002", StatusId = 17 }
        };
        context.RaceRegistrations.AddRange(registrations.Where(registration => !existingRegistrationIds.Contains(registration.RegistrationId)));

        var existingPanelIds = (await context.RefereePanels
                .Select(panel => panel.RefereePanelId)
                .ToListAsync())
            .ToHashSet();
        var panels = new[]
        {
            new RefereePanel { RefereePanelId = "RP001", RaceId = "R001", LeadID = "RF001", Member1ID = "RF002", Member2ID = "RF003" },
            new RefereePanel { RefereePanelId = "RP003", RaceId = "R003", LeadID = "RF002", Member1ID = "RF001", Member2ID = "RF003" }
        };
        context.RefereePanels.AddRange(panels.Where(panel => !existingPanelIds.Contains(panel.RefereePanelId)));

        var existingAwardKeys = (await context.Awards
                .Select(award => new { award.RaceID, award.Rank })
                .ToListAsync())
            .Select(award => $"{award.RaceID}:{award.Rank}")
            .ToHashSet();
        var awards = new[]
        {
            new Awards { RaceID = "R003", Rank = 1, PriceMoney = 40000 },
            new Awards { RaceID = "R003", Rank = 2, PriceMoney = 15000 },
            new Awards { RaceID = "R003", Rank = 3, PriceMoney = 7500 }
        };
        context.Awards.AddRange(awards.Where(award => !existingAwardKeys.Contains($"{award.RaceID}:{award.Rank}")));

        var existingResultKeys = (await context.RaceResults
                .Select(result => new { result.RaceId, result.HorseId })
                .ToListAsync())
            .Select(result => $"{result.RaceId}:{result.HorseId}")
            .ToHashSet();
        var results = new[]
        {
            new RaceResults { RaceId = "R003", HorseId = "H001", Rank = 1, PrizeMoney = 40000 },
            new RaceResults { RaceId = "R003", HorseId = "H005", Rank = 2, PrizeMoney = 15000 },
            new RaceResults { RaceId = "R003", HorseId = "H002", Rank = 3, PrizeMoney = 7500 }
        };
        context.RaceResults.AddRange(results.Where(result => !existingResultKeys.Contains($"{result.RaceId}:{result.HorseId}")));

        var existingInvitationKeys = (await context.JockeyInvitations
                .Select(invitation => new { invitation.RegistrationId, invitation.JockeyId })
                .ToListAsync())
            .Select(invitation => $"{invitation.RegistrationId}:{invitation.JockeyId}")
            .ToHashSet();
        var invitations = new[]
        {
            new JockeyInvitations { RegistrationId = "RG001", JockeyId = "J001", StatusId = 22 },
            new JockeyInvitations { RegistrationId = "RG003", JockeyId = "J003", StatusId = 21 }
        };
        context.JockeyInvitations.AddRange(invitations.Where(invitation => !existingInvitationKeys.Contains($"{invitation.RegistrationId}:{invitation.JockeyId}")));

        await context.SaveChangesAsync();
    }

    private static Accounts CreateAccount(
        string accountId,
        string username,
        string password,
        string fullName,
        int roleId,
        IPasswordHasher<Accounts> passwordHasher)
    {
        var account = new Accounts
        {
            AccountId = accountId,
            Username = username,
            FullName = fullName,
            RoleId = roleId,
            StatusId = 1
        };

        account.Password = passwordHasher.HashPassword(account, password);
        return account;
    }
}
