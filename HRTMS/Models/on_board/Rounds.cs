using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HRTMS.Models.on_board;

namespace HRTMS.Models.on_board
{
    public class Rounds
    {
        [Key] public int RoundId { get; set; }

        public required string RaceID { get; set; }
        [ForeignKey("RaceID")] public Races? Race { get; set; }
        public string RoundName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
    }
}
