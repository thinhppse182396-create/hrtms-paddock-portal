using HRTMS.Models.Horses;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.on_board
{
    public class RaceResults
    {
        [Key] public int Id { get; set; }

        public string RaceId { get; set; } = string.Empty;
        [ForeignKey("RaceId")] public Races? Races { get; set; }

        public string HorseId { get; set; } = string.Empty;
        [ForeignKey("HorseId")] public Horse? Horses { get; set; }

        public string? JockeyId { get; set; }
        [ForeignKey(nameof(JockeyId))] public HRTMS.Models.Roles.Jockeys? Jockey { get; set; }

        public int Rank { get; set; }
        public string FinishTime { get; set; } = string.Empty;
        public bool Disqualified { get; set; }
        public bool Published { get; set; }
        public string Violation { get; set; } = string.Empty;
        public decimal? PrizeMoney { get; set; }
    }
}
