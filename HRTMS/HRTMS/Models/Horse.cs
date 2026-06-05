using System;
using System.Collections.Generic;

namespace HRTMS.Models;

public partial class Horse
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Breed { get; set; }

    public int? Age { get; set; }

    public decimal? Weight { get; set; }

    public int? OwnerId { get; set; }

    public DateOnly? HealthCertExpiry { get; set; }

    public string? Status { get; set; }

    public string? Color { get; set; }

    public string? Trainer { get; set; }

    public string? Bio { get; set; }

    public virtual Owner? Owner { get; set; }

    public virtual ICollection<RaceResult> RaceResults { get; set; } = new List<RaceResult>();

    public virtual ICollection<Registration> Registrations { get; set; } = new List<Registration>();

    public virtual ICollection<Violation> Violations { get; set; } = new List<Violation>();
}
