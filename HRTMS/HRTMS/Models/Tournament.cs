using System;
using System.Collections.Generic;

namespace HRTMS.Models;

public partial class Tournament
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Season { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public string? Status { get; set; }

    public virtual ICollection<Race> Races { get; set; } = new List<Race>();
}
