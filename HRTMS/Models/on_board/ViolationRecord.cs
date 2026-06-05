using HRTMS.Models.Horses;
using HRTMS.Models.Roles;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.on_board;

public class ViolationRecord
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string RaceId { get; set; } = string.Empty;
    [ForeignKey(nameof(RaceId))] public Races? Race { get; set; }

    public string HorseId { get; set; } = string.Empty;
    [ForeignKey(nameof(HorseId))] public Horse? Horse { get; set; }

    public string JockeyId { get; set; } = string.Empty;
    [ForeignKey(nameof(JockeyId))] public Jockeys? Jockey { get; set; }

    public string Type { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
