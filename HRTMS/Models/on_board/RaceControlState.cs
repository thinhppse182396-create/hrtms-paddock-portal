using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.on_board;

public class RaceControlState
{
    [Key]
    public string RaceId { get; set; } = string.Empty;
    [ForeignKey(nameof(RaceId))] public Races? Race { get; set; }

    public string JsonData { get; set; } = "{}";
    public DateTime UpdatedAt { get; set; }
}
