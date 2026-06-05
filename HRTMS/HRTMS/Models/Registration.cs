using System;
using System.Collections.Generic;

namespace HRTMS.Models;

public partial class Registration
{
    public int Id { get; set; }

    public int? RaceId { get; set; }

    public int? HorseId { get; set; }

    public int? JockeyId { get; set; }

    public int? OwnerId { get; set; }

    public string? Status { get; set; }

    public string? Reason { get; set; }

    public DateOnly? SubmittedAt { get; set; }

    public virtual Horse? Horse { get; set; }

    public virtual Jockey? Jockey { get; set; }

    public virtual Owner? Owner { get; set; }

    public virtual Race? Race { get; set; }
}
