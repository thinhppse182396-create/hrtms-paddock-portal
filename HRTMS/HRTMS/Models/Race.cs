using System;
using System.Collections.Generic;

namespace HRTMS.Models;

public partial class Race
{
    public int Id { get; set; }

    public int? TournamentId { get; set; }

    public int? Round { get; set; }

    public DateOnly? RaceDate { get; set; }

    public string? RaceTime { get; set; }

    public string? Track { get; set; }

    public int? Distance { get; set; }

    public int? Lanes { get; set; }

    public string? Status { get; set; }

    public int? MinAge { get; set; }

    public int? MaxAge { get; set; }

    public decimal? MinWeight { get; set; }

    public decimal? MaxWeight { get; set; }

    public string? AllowedBreeds { get; set; }

    public bool? RequiresHealthCert { get; set; }

    public virtual ICollection<RaceResult> RaceResults { get; set; } = new List<RaceResult>();

    public virtual ICollection<Registration> Registrations { get; set; } = new List<Registration>();

    public virtual Tournament? Tournament { get; set; }

    public virtual ICollection<Violation> Violations { get; set; } = new List<Violation>();
}
