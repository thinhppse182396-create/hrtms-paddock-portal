using System;
using System.Collections.Generic;
using HRTMS.Models;
using Microsoft.EntityFrameworkCore;

namespace HRTMS.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Horse> Horses { get; set; }

    public virtual DbSet<Jockey> Jockeys { get; set; }

    public virtual DbSet<Owner> Owners { get; set; }

    public virtual DbSet<Race> Races { get; set; }

    public virtual DbSet<RaceResult> RaceResults { get; set; }

    public virtual DbSet<Registration> Registrations { get; set; }

    public virtual DbSet<Tournament> Tournaments { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Violation> Violations { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Horse>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Horses__3214EC07B25E5F09");

            entity.Property(e => e.Breed).HasMaxLength(100);
            entity.Property(e => e.Color).HasMaxLength(100);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Eligible");
            entity.Property(e => e.Trainer).HasMaxLength(200);
            entity.Property(e => e.Weight).HasColumnType("decimal(6, 2)");

            entity.HasOne(d => d.Owner).WithMany(p => p.Horses)
                .HasForeignKey(d => d.OwnerId)
                .HasConstraintName("FK__Horses__OwnerId__30F848ED");
        });

        modelBuilder.Entity<Jockey>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Jockeys__3214EC077CC77BCB");

            entity.Property(e => e.LicenseNo).HasMaxLength(100);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Active");
            entity.Property(e => e.Weight).HasColumnType("decimal(6, 2)");
        });

        modelBuilder.Entity<Owner>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Owners__3214EC07761D3E4B");

            entity.Property(e => e.Contact).HasMaxLength(200);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Stable).HasMaxLength(200);
        });

        modelBuilder.Entity<Race>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Races__3214EC07EFA99EB2");

            entity.Property(e => e.AllowedBreeds).HasMaxLength(500);
            entity.Property(e => e.MaxWeight).HasColumnType("decimal(6, 2)");
            entity.Property(e => e.MinWeight).HasColumnType("decimal(6, 2)");
            entity.Property(e => e.RaceTime).HasMaxLength(10);
            entity.Property(e => e.RequiresHealthCert).HasDefaultValue(true);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Scheduled");
            entity.Property(e => e.Track).HasMaxLength(100);

            entity.HasOne(d => d.Tournament).WithMany(p => p.Races)
                .HasForeignKey(d => d.TournamentId)
                .HasConstraintName("FK__Races__Tournamen__2A4B4B5E");
        });

        modelBuilder.Entity<RaceResult>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__RaceResu__3214EC07743B4334");

            entity.Property(e => e.Disqualified).HasDefaultValue(false);
            entity.Property(e => e.FinishTime).HasMaxLength(20);
            entity.Property(e => e.PrizeMoney).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.Published).HasDefaultValue(false);

            entity.HasOne(d => d.Horse).WithMany(p => p.RaceResults)
                .HasForeignKey(d => d.HorseId)
                .HasConstraintName("FK__RaceResul__Horse__403A8C7D");

            entity.HasOne(d => d.Jockey).WithMany(p => p.RaceResults)
                .HasForeignKey(d => d.JockeyId)
                .HasConstraintName("FK__RaceResul__Jocke__412EB0B6");

            entity.HasOne(d => d.Race).WithMany(p => p.RaceResults)
                .HasForeignKey(d => d.RaceId)
                .HasConstraintName("FK__RaceResul__RaceI__3F466844");
        });

        modelBuilder.Entity<Registration>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Registra__3214EC07B410FE43");

            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Pending");
            entity.Property(e => e.SubmittedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Horse).WithMany(p => p.Registrations)
                .HasForeignKey(d => d.HorseId)
                .HasConstraintName("FK__Registrat__Horse__38996AB5");

            entity.HasOne(d => d.Jockey).WithMany(p => p.Registrations)
                .HasForeignKey(d => d.JockeyId)
                .HasConstraintName("FK__Registrat__Jocke__398D8EEE");

            entity.HasOne(d => d.Owner).WithMany(p => p.Registrations)
                .HasForeignKey(d => d.OwnerId)
                .HasConstraintName("FK__Registrat__Owner__3A81B327");

            entity.HasOne(d => d.Race).WithMany(p => p.Registrations)
                .HasForeignKey(d => d.RaceId)
                .HasConstraintName("FK__Registrat__RaceI__37A5467C");
        });

        modelBuilder.Entity<Tournament>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Tourname__3214EC075FFC4EAA");

            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Season).HasMaxLength(50);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Draft");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3214EC0787A63787");

            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Password).HasMaxLength(255);
            entity.Property(e => e.Role).HasMaxLength(50);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Active");
            entity.Property(e => e.Username).HasMaxLength(100);
        });

        modelBuilder.Entity<Violation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Violatio__3214EC0731DA0D71");

            entity.Property(e => e.Severity).HasMaxLength(50);
            entity.Property(e => e.ViolationType).HasMaxLength(200);

            entity.HasOne(d => d.Horse).WithMany(p => p.Violations)
                .HasForeignKey(d => d.HorseId)
                .HasConstraintName("FK__Violation__Horse__46E78A0C");

            entity.HasOne(d => d.Jockey).WithMany(p => p.Violations)
                .HasForeignKey(d => d.JockeyId)
                .HasConstraintName("FK__Violation__Jocke__47DBAE45");

            entity.HasOne(d => d.Race).WithMany(p => p.Violations)
                .HasForeignKey(d => d.RaceId)
                .HasConstraintName("FK__Violation__RaceI__45F365D3");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
