using System;
using System.Collections.Generic;

namespace HRTMS.Models;

public partial class RaceResult
{
    public int Id { get; set; }

    public int? RaceId { get; set; }

    public int? HorseId { get; set; }

    public int? JockeyId { get; set; }

    public string? FinishTime { get; set; }

    public int? Rank { get; set; }

    public bool? Disqualified { get; set; }

    public bool? Published { get; set; }

    public decimal? PrizeMoney { get; set; }

    public virtual Horse? Horse { get; set; }

    public virtual Jockey? Jockey { get; set; }

    public virtual Race? Race { get; set; }
}
