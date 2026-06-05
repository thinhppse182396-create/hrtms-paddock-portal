using HRTMS.Models.Roles;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.on_board;

public class RefereeReport
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string RaceId { get; set; } = string.Empty;
    [ForeignKey(nameof(RaceId))] public Races? Race { get; set; }

    public string RefereeId { get; set; } = string.Empty;
    [ForeignKey(nameof(RefereeId))] public Referee? Referee { get; set; }

    public string Status { get; set; } = "DRAFT";
    public string Notes { get; set; } = string.Empty;
}
