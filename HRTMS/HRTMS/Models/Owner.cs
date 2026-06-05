using System;
using System.Collections.Generic;

namespace HRTMS.Models;

public partial class Owner
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string? Stable { get; set; }

    public string? Contact { get; set; }

    public virtual ICollection<Horse> Horses { get; set; } = new List<Horse>();

    public virtual ICollection<Registration> Registrations { get; set; } = new List<Registration>();
}
