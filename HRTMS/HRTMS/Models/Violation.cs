using System;
using System.Collections.Generic;

namespace HRTMS.Models;

public partial class Violation
{
    public int Id { get; set; }

    public int? RaceId { get; set; }

    public int? HorseId { get; set; }

    public int? JockeyId { get; set; }

    public string? ViolationType { get; set; }

    public string? Severity { get; set; }

    public string? Description { get; set; }

    public virtual Horse? Horse { get; set; }

    public virtual Jockey? Jockey { get; set; }

    public virtual Race? Race { get; set; }
}
