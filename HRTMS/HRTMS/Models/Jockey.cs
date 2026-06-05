using System;
using System.Collections.Generic;

namespace HRTMS.Models;

public partial class Jockey
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string? LicenseNo { get; set; }

    public decimal? Weight { get; set; }

    public int? Ranking { get; set; }

    public string? Status { get; set; }

    public virtual ICollection<RaceResult> RaceResults { get; set; } = new List<RaceResult>();

    public virtual ICollection<Registration> Registrations { get; set; } = new List<Registration>();

    public virtual ICollection<Violation> Violations { get; set; } = new List<Violation>();
}
