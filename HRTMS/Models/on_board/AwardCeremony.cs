using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.on_board;

public class AwardCeremony
{
    [Key]
    public string RaceId { get; set; } = string.Empty;
    [ForeignKey(nameof(RaceId))] public Races? Race { get; set; }

    public DateTime ScheduledAt { get; set; }
    public string Status { get; set; } = "SCHEDULED";
    public string Venue { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}
