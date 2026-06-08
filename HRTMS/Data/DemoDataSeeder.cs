using HRTMS.Models.Horses;
using HRTMS.Models.on_board;
using HRTMS.Models.Roles;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Data;

public static class DemoDataSeeder
{
    private const int ActiveAccountStatusId = 1;
    private const int ActiveJockeyStatusId = 5;
    private const int EligibleHorseStatusId = 10;
    private const int ScheduledRaceStatusId = 12;
    private const int FinishedRaceStatusId = 14;
    private const int ApprovedRegistrationStatusId = 17;
    private const int PendingInvitationStatusId = 21;
    private const int AcceptedInvitationStatusId = 22;
    private const int OpenTournamentStatusId = 25;
    private const int CompletedTournamentStatusId = 27;

    private const int AdminRoleId = 1;
    private const int RefereeRoleId = 2;
    private const int JockeyRoleId = 3;
    private const int OwnerRoleId = 4;
    private const int SpectatorRoleId = 5;

    public static async Task SeedAsync(
        ApplicationDbContext context,
        IPasswordHasher<Accounts> passwordHasher,
        TimeProvider timeProvider)
    {
        var today = timeProvider.GetLocalNow().DateTime.Date;

        await EnsureAccountAsync(context, passwordHasher, "ACC-ADMIN-001", "admin_super", "admin123", "System Admin", AdminRoleId);
        var refereeSarahId = await EnsureAccountAsync(context, passwordHasher, "ACC-REF-001", "ref_sarah", "referee123", "Sarah Nguyen", RefereeRoleId);
        var refereeLeeId = await EnsureAccountAsync(context, passwordHasher, "ACC-REF-002", "ref_lee", "referee123", "Lee Tran", RefereeRoleId);
        var refereeMinhId = await EnsureAccountAsync(context, passwordHasher, "ACC-REF-003", "ref_minh", "referee123", "Minh Pham", RefereeRoleId);
        var ownerWayneId = await EnsureAccountAsync(context, passwordHasher, "ACC-OWN-001", "owner_wayne", "owner123", "Wayne Stable", OwnerRoleId);
        var ownerLinhId = await EnsureAccountAsync(context, passwordHasher, "ACC-OWN-002", "owner_linh", "owner123", "Linh Racing", OwnerRoleId);
        var jockeySmithId = await EnsureAccountAsync(context, passwordHasher, "ACC-JOC-001", "jockey_smith", "jockey123", "Alex Smith", JockeyRoleId);
        var jockeyMillerId = await EnsureAccountAsync(context, passwordHasher, "ACC-JOC-002", "jockey_miller", "jockey123", "Mia Miller", JockeyRoleId);
        var jockeyKhanhId = await EnsureAccountAsync(context, passwordHasher, "ACC-JOC-003", "jockey_khanh", "jockey123", "Khanh Vo", JockeyRoleId);
        var spectatorAlexId = await EnsureAccountAsync(context, passwordHasher, "ACC-FAN-001", "fan_alex", "spectator123", "Alex Fan", SpectatorRoleId);

        await EnsureTrackAsync(context, new Tracks
        {
            TrackId = "TRK-DEMO-001",
            TrackName = "Saigon Paddock",
            Length = "1800",
            Width = "18",
            MaxLanes = 8,
            AvailableDistances = "800,1000,1200,1600"
        });
        await EnsureTrackAsync(context, new Tracks
        {
            TrackId = "TRK-DEMO-002",
            TrackName = "Hanoi Turf Arena",
            Length = "2200",
            Width = "20",
            MaxLanes = 10,
            AvailableDistances = "1000,1400,1800,2000"
        });

        await EnsureRefereeAsync(context, new Referee
        {
            RefereeId = "REF-DEMO-001",
            AccountId = refereeSarahId,
            RefereeName = "Sarah Nguyen",
            RefereeLicenseNumber = "VN-REF-1001"
        });
        await EnsureRefereeAsync(context, new Referee
        {
            RefereeId = "REF-DEMO-002",
            AccountId = refereeLeeId,
            RefereeName = "Lee Tran",
            RefereeLicenseNumber = "VN-REF-1002"
        });
        await EnsureRefereeAsync(context, new Referee
        {
            RefereeId = "REF-DEMO-003",
            AccountId = refereeMinhId,
            RefereeName = "Minh Pham",
            RefereeLicenseNumber = "VN-REF-1003"
        });

        await EnsureJockeyAsync(context, new Jockeys
        {
            JockeyId = "JOC-DEMO-001",
            AccountId = jockeySmithId,
            LicenseNumber = "VN-JOC-2001",
            Weight = 54,
            Ranking = "1",
            StatusId = ActiveJockeyStatusId,
            Contact = "jockey_smith@example.test"
        });
        await EnsureJockeyAsync(context, new Jockeys
        {
            JockeyId = "JOC-DEMO-002",
            AccountId = jockeyMillerId,
            LicenseNumber = "VN-JOC-2002",
            Weight = 52,
            Ranking = "2",
            StatusId = ActiveJockeyStatusId,
            Contact = "jockey_miller@example.test"
        });
        await EnsureJockeyAsync(context, new Jockeys
        {
            JockeyId = "JOC-DEMO-003",
            AccountId = jockeyKhanhId,
            LicenseNumber = "VN-JOC-2003",
            Weight = 56,
            Ranking = "3",
            StatusId = ActiveJockeyStatusId,
            Contact = "jockey_khanh@example.test"
        });

        await EnsureHorseAsync(context, new Horse
        {
            HorseId = "HORSE-DEMO-001",
            HourseName = "Thunder Bolt",
            Breed = "Thoroughbred",
            Age = 5,
            Weight = 470,
            Documents = "HC-DEMO-001",
            Health_Cert_Expiry = today.AddDays(180),
            StatusId = EligibleHorseStatusId,
            OwnerId = ownerWayneId
        });
        await EnsureHorseAsync(context, new Horse
        {
            HorseId = "HORSE-DEMO-002",
            HourseName = "River Queen",
            Breed = "Arabian",
            Age = 4,
            Weight = 430,
            Documents = "HC-DEMO-002",
            Health_Cert_Expiry = today.AddDays(160),
            StatusId = EligibleHorseStatusId,
            OwnerId = ownerLinhId
        });
        await EnsureHorseAsync(context, new Horse
        {
            HorseId = "HORSE-DEMO-003",
            HourseName = "Desert Wind",
            Breed = "Thoroughbred",
            Age = 6,
            Weight = 455,
            Documents = "HC-DEMO-003",
            Health_Cert_Expiry = today.AddDays(140),
            StatusId = EligibleHorseStatusId,
            OwnerId = ownerWayneId
        });

        var futureTournamentStart = today.AddDays(10);
        var pastTournamentStart = today.AddDays(-20);
        await EnsureTournamentAsync(context, new Tournaments
        {
            TournamentId = "TOUR-DEMO-FUTURE",
            Name = "Demo Summer Sprint Cup",
            TrackID = "TRK-DEMO-001",
            Start = futureTournamentStart,
            End = futureTournamentStart.AddDays(20),
            StatusId = OpenTournamentStatusId
        });
        await EnsureTournamentAsync(context, new Tournaments
        {
            TournamentId = "TOUR-DEMO-PAST",
            Name = "Demo Spring Derby",
            TrackID = "TRK-DEMO-002",
            Start = pastTournamentStart,
            End = pastTournamentStart.AddDays(15),
            StatusId = CompletedTournamentStatusId
        });

        var raceOneTime = futureTournamentStart.AddDays(4).AddHours(9);
        var raceTwoTime = futureTournamentStart.AddDays(6).AddHours(14);
        var finishedRaceTime = pastTournamentStart.AddDays(10).AddHours(10);
        await EnsureRaceAsync(context, new Races
        {
            RaceID = "RACE-DEMO-001",
            TournamentId = "TOUR-DEMO-FUTURE",
            RaceName = "Demo Sprint Heat 1",
            ScheduledAt = raceOneTime,
            RoundNumber = 1,
            MinAge = 3,
            MaxAge = 8,
            MinWeight = 400,
            MaxWeight = 520,
            AllowedBreeds = "Thoroughbred,Arabian",
            RequiresValidHealthCert = true,
            Distance = "1200",
            Lanes = 8,
            StatusId = ScheduledRaceStatusId
        });
        await EnsureRaceAsync(context, new Races
        {
            RaceID = "RACE-DEMO-002",
            TournamentId = "TOUR-DEMO-FUTURE",
            RaceName = "Demo Sprint Heat 2",
            ScheduledAt = raceTwoTime,
            RoundNumber = 1,
            MinAge = 3,
            MaxAge = 8,
            MinWeight = 400,
            MaxWeight = 520,
            AllowedBreeds = "Thoroughbred,Arabian",
            RequiresValidHealthCert = true,
            Distance = "1600",
            Lanes = 8,
            StatusId = ScheduledRaceStatusId
        });
        await EnsureRaceAsync(context, new Races
        {
            RaceID = "RACE-DEMO-003",
            TournamentId = "TOUR-DEMO-PAST",
            RaceName = "Demo Derby Final",
            ScheduledAt = finishedRaceTime,
            RoundNumber = 3,
            MinAge = 3,
            MaxAge = 9,
            MinWeight = 390,
            MaxWeight = 530,
            AllowedBreeds = "Thoroughbred,Arabian",
            RequiresValidHealthCert = true,
            Distance = "1800",
            Lanes = 10,
            StatusId = FinishedRaceStatusId
        });

        await EnsureRegistrationAsync(context, new Registration
        {
            RegistrationId = "REG-DEMO-001",
            RaceId = "RACE-DEMO-001",
            HorseId = "HORSE-DEMO-001",
            JockeyName = "JOC-DEMO-001",
            BackupJockeyId = "JOC-DEMO-002",
            StatusId = ApprovedRegistrationStatusId
        });
        await EnsureRegistrationAsync(context, new Registration
        {
            RegistrationId = "REG-DEMO-002",
            RaceId = "RACE-DEMO-001",
            HorseId = "HORSE-DEMO-002",
            JockeyName = "JOC-DEMO-002",
            BackupJockeyId = "JOC-DEMO-003",
            StatusId = ApprovedRegistrationStatusId
        });
        await EnsureRegistrationAsync(context, new Registration
        {
            RegistrationId = "REG-DEMO-003",
            RaceId = "RACE-DEMO-003",
            HorseId = "HORSE-DEMO-003",
            JockeyName = "JOC-DEMO-003",
            BackupJockeyId = "JOC-DEMO-001",
            StatusId = ApprovedRegistrationStatusId
        });

        await EnsureRefereePanelAsync(context, new RefereePanel
        {
            RefereePanelId = "PANEL-DEMO-001",
            RaceId = "RACE-DEMO-001",
            LeadID = "REF-DEMO-001",
            Member1ID = "REF-DEMO-002",
            Member2ID = "REF-DEMO-003"
        });

        await EnsureRoundAsync(context, new Rounds
        {
            RaceID = "RACE-DEMO-001",
            RoundName = "Heat",
            StartTime = raceOneTime.AddMinutes(15)
        }, "RACE-DEMO-001", "Heat");
        await EnsureRoundAsync(context, new Rounds
        {
            RaceID = "RACE-DEMO-003",
            RoundName = "Final",
            StartTime = finishedRaceTime.AddMinutes(15)
        }, "RACE-DEMO-003", "Final");

        await EnsureAwardAsync(context, "RACE-DEMO-001", 1, 15000m);
        await EnsureAwardAsync(context, "RACE-DEMO-001", 2, 8000m);
        await EnsureAwardAsync(context, "RACE-DEMO-001", 3, 4000m);
        await EnsureAwardAsync(context, "RACE-DEMO-003", 1, 25000m);
        await EnsureAwardAsync(context, "RACE-DEMO-003", 2, 12000m);
        await EnsureAwardAsync(context, "RACE-DEMO-003", 3, 6000m);

        await EnsureRaceResultAsync(context, new RaceResults
        {
            RaceId = "RACE-DEMO-003",
            HorseId = "HORSE-DEMO-003",
            JockeyId = "JOC-DEMO-003",
            Rank = 1,
            FinishTime = "01:48.320",
            Disqualified = false,
            Published = true,
            Violation = string.Empty,
            PrizeMoney = 25000m
        });
        await EnsureRaceResultAsync(context, new RaceResults
        {
            RaceId = "RACE-DEMO-003",
            HorseId = "HORSE-DEMO-001",
            JockeyId = "JOC-DEMO-001",
            Rank = 2,
            FinishTime = "01:49.105",
            Disqualified = false,
            Published = true,
            Violation = string.Empty,
            PrizeMoney = 12000m
        });

        await EnsureInvitationAsync(context, new JockeyInvitations
        {
            RegistrationId = "REG-DEMO-001",
            JockeyId = "JOC-DEMO-001",
            StatusId = AcceptedInvitationStatusId,
            CreatedAt = today.AddDays(-1)
        });
        await EnsureInvitationAsync(context, new JockeyInvitations
        {
            RegistrationId = "REG-DEMO-001",
            JockeyId = "JOC-DEMO-002",
            StatusId = PendingInvitationStatusId,
            CreatedAt = today.AddDays(-1)
        });

        await EnsureViolationAsync(context, new ViolationRecord
        {
            Id = "VIO-DEMO-001",
            RaceId = "RACE-DEMO-003",
            HorseId = "HORSE-DEMO-001",
            JockeyId = "JOC-DEMO-001",
            Type = "Lane",
            Severity = "Low",
            Description = "Minor lane drift recorded during final stretch."
        });
        await EnsureRefereeReportAsync(context, new RefereeReport
        {
            Id = "REP-DEMO-001",
            RaceId = "RACE-DEMO-003",
            RefereeId = "REF-DEMO-001",
            Status = "SUBMITTED",
            Notes = "Demo final completed and verified."
        });
        await EnsureAwardCeremonyAsync(context, new AwardCeremony
        {
            RaceId = "RACE-DEMO-003",
            ScheduledAt = finishedRaceTime.AddHours(2),
            Status = "COMPLETED",
            Venue = "Main Paddock Stage",
            Notes = "Demo ceremony data."
        });
        await EnsurePreRaceCheckAsync(context, "RACE-DEMO-001", "{\"track\":\"clear\",\"horsesChecked\":true,\"medicalTeamReady\":true}", today);
        await EnsureRaceControlStateAsync(context, "RACE-DEMO-001", "{\"phase\":\"scheduled\",\"gateOpen\":false,\"timer\":\"00:00.000\"}", today);
        await EnsurePredictionAsync(context, new Prediction
        {
            AccountId = spectatorAlexId,
            RaceId = "RACE-DEMO-001",
            HorseId = "HORSE-DEMO-001",
            PredictedRank = 1,
            Status = "PENDING",
            Payout = 0,
            CreatedAt = today
        });

        await context.SaveChangesAsync();
    }

    private static async Task<string> EnsureAccountAsync(
        ApplicationDbContext context,
        IPasswordHasher<Accounts> passwordHasher,
        string accountId,
        string username,
        string password,
        string fullName,
        int roleId)
    {
        var existing = await context.Accounts.SingleOrDefaultAsync(account => account.Username == username);
        if (existing is not null)
        {
            existing.FullName = fullName;
            existing.RoleId = roleId;
            existing.StatusId = ActiveAccountStatusId;
            existing.Password = passwordHasher.HashPassword(existing, password);
            return existing.AccountId;
        }

        var account = new Accounts
        {
            AccountId = accountId,
            Username = username,
            FullName = fullName,
            RoleId = roleId,
            StatusId = ActiveAccountStatusId
        };
        account.Password = passwordHasher.HashPassword(account, password);
        context.Accounts.Add(account);
        return account.AccountId;
    }

    private static async Task EnsureTrackAsync(ApplicationDbContext context, Tracks track)
    {
        if (!await context.Tracks.AnyAsync(item => item.TrackId == track.TrackId))
        {
            context.Tracks.Add(track);
        }
    }

    private static async Task EnsureRefereeAsync(ApplicationDbContext context, Referee referee)
    {
        if (!await context.Referees.AnyAsync(item => item.RefereeId == referee.RefereeId))
        {
            context.Referees.Add(referee);
        }
    }

    private static async Task EnsureJockeyAsync(ApplicationDbContext context, Jockeys jockey)
    {
        if (!await context.Jockeys.AnyAsync(item => item.JockeyId == jockey.JockeyId))
        {
            context.Jockeys.Add(jockey);
        }
    }

    private static async Task EnsureHorseAsync(ApplicationDbContext context, Horse horse)
    {
        if (!await context.Horses.AnyAsync(item => item.HorseId == horse.HorseId))
        {
            context.Horses.Add(horse);
        }
    }

    private static async Task EnsureTournamentAsync(ApplicationDbContext context, Tournaments tournament)
    {
        if (!await context.Tournaments.AnyAsync(item => item.TournamentId == tournament.TournamentId))
        {
            context.Tournaments.Add(tournament);
        }
    }

    private static async Task EnsureRaceAsync(ApplicationDbContext context, Races race)
    {
        if (!await context.Races.AnyAsync(item => item.RaceID == race.RaceID))
        {
            context.Races.Add(race);
        }
    }

    private static async Task EnsureRegistrationAsync(ApplicationDbContext context, Registration registration)
    {
        if (!await context.RaceRegistrations.AnyAsync(item => item.RegistrationId == registration.RegistrationId))
        {
            context.RaceRegistrations.Add(registration);
        }
    }

    private static async Task EnsureRefereePanelAsync(ApplicationDbContext context, RefereePanel panel)
    {
        if (!await context.RefereePanels.AnyAsync(item => item.RefereePanelId == panel.RefereePanelId))
        {
            context.RefereePanels.Add(panel);
        }
    }

    private static async Task EnsureRoundAsync(ApplicationDbContext context, Rounds round, string raceId, string roundName)
    {
        if (!await context.Rounds.AnyAsync(item => item.RaceID == raceId && item.RoundName == roundName))
        {
            context.Rounds.Add(round);
        }
    }

    private static async Task EnsureAwardAsync(ApplicationDbContext context, string raceId, int rank, decimal priceMoney)
    {
        if (!await context.Awards.AnyAsync(item => item.RaceID == raceId && item.Rank == rank))
        {
            context.Awards.Add(new Awards
            {
                RaceID = raceId,
                Rank = rank,
                PriceMoney = priceMoney
            });
        }
    }

    private static async Task EnsureRaceResultAsync(ApplicationDbContext context, RaceResults result)
    {
        if (!await context.RaceResults.AnyAsync(item => item.RaceId == result.RaceId && item.HorseId == result.HorseId))
        {
            context.RaceResults.Add(result);
        }
    }

    private static async Task EnsureInvitationAsync(ApplicationDbContext context, JockeyInvitations invitation)
    {
        if (!await context.JockeyInvitations.AnyAsync(item =>
                item.RegistrationId == invitation.RegistrationId &&
                item.JockeyId == invitation.JockeyId))
        {
            context.JockeyInvitations.Add(invitation);
        }
    }

    private static async Task EnsureViolationAsync(ApplicationDbContext context, ViolationRecord violation)
    {
        if (!await context.Violations.AnyAsync(item => item.Id == violation.Id))
        {
            context.Violations.Add(violation);
        }
    }

    private static async Task EnsureRefereeReportAsync(ApplicationDbContext context, RefereeReport report)
    {
        if (!await context.RefereeReports.AnyAsync(item => item.Id == report.Id))
        {
            context.RefereeReports.Add(report);
        }
    }

    private static async Task EnsureAwardCeremonyAsync(ApplicationDbContext context, AwardCeremony ceremony)
    {
        if (!await context.AwardCeremonies.AnyAsync(item => item.RaceId == ceremony.RaceId))
        {
            context.AwardCeremonies.Add(ceremony);
        }
    }

    private static async Task EnsurePreRaceCheckAsync(ApplicationDbContext context, string raceId, string jsonData, DateTime updatedAt)
    {
        if (!await context.PreRaceChecks.AnyAsync(item => item.RaceId == raceId))
        {
            context.PreRaceChecks.Add(new PreRaceCheck
            {
                RaceId = raceId,
                JsonData = jsonData,
                UpdatedAt = updatedAt
            });
        }
    }

    private static async Task EnsureRaceControlStateAsync(ApplicationDbContext context, string raceId, string jsonData, DateTime updatedAt)
    {
        if (!await context.RaceControlStates.AnyAsync(item => item.RaceId == raceId))
        {
            context.RaceControlStates.Add(new RaceControlState
            {
                RaceId = raceId,
                JsonData = jsonData,
                UpdatedAt = updatedAt
            });
        }
    }

    private static async Task EnsurePredictionAsync(ApplicationDbContext context, Prediction prediction)
    {
        if (!await context.Predictions.AnyAsync(item =>
                item.AccountId == prediction.AccountId &&
                item.RaceId == prediction.RaceId &&
                item.HorseId == prediction.HorseId))
        {
            context.Predictions.Add(prediction);
        }
    }
}
