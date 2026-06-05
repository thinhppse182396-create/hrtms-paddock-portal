using HRTMS.Models.Feedbacks;
using HRTMS.Models.Horses;
using HRTMS.Models.on_board;
using HRTMS.Models.Roles;
using HRTMS.Models.Statuss;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Net.Sockets;
using System.Security.Principal;

namespace HRTMS.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Accounts> Accounts { get; set; }
    public DbSet<Horse> Horses { get; set; }
    public DbSet<Tournaments> Tournaments { get; set; }
    public DbSet<Races> Races { get; set; }
    public DbSet<Registration> RaceRegistrations { get; set; }
    public DbSet<Feedback> Feedbacks { get; set; }
    public DbSet<Roles> Roles { get; set; }
    public DbSet<Status> Statuses { get; set; }
    public DbSet<Referee> Referees { get; set; }
    public DbSet<Jockeys> Jockeys { get; set; }
    public DbSet<RefereePanel> RefereePanels { get; set; }
    public DbSet<JockeyInvitations> JockeyInvitations { get; set; }
    public DbSet<Awards> Awards { get; set; }
    public DbSet<RaceResults> RaceResults { get; set; }
    public DbSet<Tracks> Tracks { get; set; }
    public DbSet<Rounds> Rounds { get; set; }
    public DbSet<ViolationRecord> Violations { get; set; }
    public DbSet<RefereeReport> RefereeReports { get; set; }
    public DbSet<AwardCeremony> AwardCeremonies { get; set; }
    public DbSet<PreRaceCheck> PreRaceChecks { get; set; }
    public DbSet<RaceControlState> RaceControlStates { get; set; }
    public DbSet<Prediction> Predictions { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        foreach (var foreignKey in modelBuilder.Model.GetEntityTypes().SelectMany(entity => entity.GetForeignKeys()))
        {
            foreignKey.DeleteBehavior = DeleteBehavior.NoAction;
        }

        modelBuilder.Entity<Status>()
                .HasIndex(s => new { s.EntityName, s.StatusCode })
                .IsUnique();

        modelBuilder.Entity<Accounts>()
            .HasOne(a => a.Status)
            .WithMany()
            .HasForeignKey(a => a.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Accounts>()
            .HasIndex(account => account.Username)
            .IsUnique();

        modelBuilder.Entity<Jockeys>()
            .HasOne(j => j.Status)
            .WithMany()
            .HasForeignKey(j => j.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Horse>()
            .HasOne(h => h.Status)
            .WithMany()
            .HasForeignKey(h => h.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Races>()
            .HasOne(r => r.Status)
            .WithMany()
            .HasForeignKey(r => r.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Registration>()
            .HasOne(rr => rr.Status)
            .WithMany()
            .HasForeignKey(rr => rr.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<JockeyInvitations>()
            .HasIndex(invitation => new { invitation.RegistrationId, invitation.JockeyId })
            .IsUnique();

        modelBuilder.Entity<Awards>()
            .HasIndex(award => new { award.RaceID, award.Rank })
            .IsUnique();

        modelBuilder.Entity<Awards>()
            .Property(award => award.PriceMoney)
            .HasPrecision(18, 2);

        modelBuilder.Entity<RaceResults>()
            .HasIndex(result => new { result.RaceId, result.Rank })
            .IsUnique();

        modelBuilder.Entity<RaceResults>()
            .HasIndex(result => new { result.RaceId, result.HorseId })
            .IsUnique();

        modelBuilder.Entity<RaceResults>()
            .Property(result => result.PrizeMoney)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Registration>()
            .HasIndex(registration => new { registration.RaceId, registration.HorseId })
            .IsUnique();

        modelBuilder.Entity<Prediction>()
            .HasIndex(prediction => new { prediction.AccountId, prediction.RaceId, prediction.HorseId })
            .IsUnique();

        modelBuilder.Entity<Prediction>()
            .Property(prediction => prediction.Payout)
            .HasPrecision(18, 2);

        //modelBuilder.Entity<Feedback>()
        //    .HasOne(f => f.Status)
        //    .WithMany()
        //    .HasForeignKey(f => f.StatusId)
        //    .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Status>().HasData(
            new Status { StatusId = 1, EntityName = "Account", StatusCode = "ACTIVE", StatusName = "Active", SortOrder = 1, IsActive = true },
            new Status { StatusId = 2, EntityName = "Account", StatusCode = "LOCKED", StatusName = "Locked", SortOrder = 2, IsActive = true },

            new Status { StatusId = 3, EntityName = "Referee", StatusCode = "ACTIVE", StatusName = "Active", SortOrder = 1, IsActive = true },
            new Status { StatusId = 4, EntityName = "Referee", StatusCode = "SUSPENDED", StatusName = "Suspended", SortOrder = 2, IsActive = true },

            new Status { StatusId = 5, EntityName = "Jockey", StatusCode = "ACTIVE", StatusName = "Active", SortOrder = 1, IsActive = true },
            new Status { StatusId = 6, EntityName = "Jockey", StatusCode = "SUSPENDED", StatusName = "Suspended", SortOrder = 2, IsActive = true },

            new Status { StatusId = 9, EntityName = "Horse", StatusCode = "INJURED", StatusName = "Injured", SortOrder = 1, IsActive = true },
            new Status { StatusId = 10, EntityName = "Horse", StatusCode = "ELIGIBLE", StatusName = "Eligible", SortOrder = 1, IsActive = true },
            new Status { StatusId = 11, EntityName = "Horse", StatusCode = "SUSPENDED", StatusName = "Suspended", SortOrder = 1, IsActive = true },

            new Status { StatusId = 12, EntityName = "Race", StatusCode = "SCHEDULED", StatusName = "Scheduled", SortOrder = 1, IsActive = true },
            new Status { StatusId = 13, EntityName = "Race", StatusCode = "ONGOING", StatusName = "Ongoing", SortOrder = 2, IsActive = true },
            new Status { StatusId = 14, EntityName = "Race", StatusCode = "FINISHED", StatusName = "Finished", SortOrder = 3, IsActive = true },
            new Status { StatusId = 15, EntityName = "Race", StatusCode = "CANCELLED", StatusName = "Cancelled", SortOrder = 5, IsActive = true },
            new Status { StatusId = 23, EntityName = "Race", StatusCode = "PUBLISHED", StatusName = "Published", SortOrder = 4, IsActive = true },

            new Status { StatusId = 16, EntityName = "Registration", StatusCode = "PENDING", StatusName = "Pending", SortOrder = 1, IsActive = true },
            new Status { StatusId = 17, EntityName = "Registration", StatusCode = "APPROVED", StatusName = "Approved", SortOrder = 2, IsActive = true },
            new Status { StatusId = 18, EntityName = "Registration", StatusCode = "REJECTED", StatusName = "Rejected", SortOrder = 3, IsActive = true },
            new Status { StatusId = 19, EntityName = "Registration", StatusCode = "CANCELLED", StatusName = "Cancelled", SortOrder = 4, IsActive = true },

            new Status { StatusId = 20, EntityName = "Feedback", StatusCode = "RESOLVED", StatusName = "Resolved", SortOrder = 1, IsActive = true },

            new Status { StatusId = 21, EntityName = "JockeyInvitation", StatusCode = "PENDING", StatusName = "Pending", SortOrder = 1, IsActive = true },
            new Status { StatusId = 22, EntityName = "JockeyInvitation", StatusCode = "ACCEPTED", StatusName = "Accepted", SortOrder = 2, IsActive = true },

            new Status { StatusId = 24, EntityName = "Tournament", StatusCode = "DRAFT", StatusName = "Draft", SortOrder = 1, IsActive = true },
            new Status { StatusId = 25, EntityName = "Tournament", StatusCode = "OPEN", StatusName = "Open", SortOrder = 2, IsActive = true },
            new Status { StatusId = 26, EntityName = "Tournament", StatusCode = "CLOSED", StatusName = "Closed", SortOrder = 3, IsActive = true },
            new Status { StatusId = 27, EntityName = "Tournament", StatusCode = "COMPLETED", StatusName = "Completed", SortOrder = 4, IsActive = true }
        );

        modelBuilder.Entity<Roles>()
        .HasIndex(r => r.RoleCode)
        .IsUnique();

        modelBuilder.Entity<Status>()
            .HasIndex(s => new { s.EntityName, s.StatusCode })
            .IsUnique();

        modelBuilder.Entity<Roles>().HasData(
            new Roles { RoleId = 1, RoleCode = "ADMIN", RoleName = "Admin", IsActive = true },
            new Roles { RoleId = 2, RoleCode = "REFEREE", RoleName = "Referee", IsActive = true },
            new Roles { RoleId = 3, RoleCode = "JOCKEY", RoleName = "Jockey", IsActive = true },
            new Roles { RoleId = 4, RoleCode = "HORSE_OWNER", RoleName = "Horse Owner", IsActive = true },
            new Roles { RoleId = 5, RoleCode = "SPECTATOR", RoleName = "Spectator", IsActive = true }
        );
    }
}
