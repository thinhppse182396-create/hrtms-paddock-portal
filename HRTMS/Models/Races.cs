using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models
{
    public class Races
    {
        [Key]
        public string RaceID { get; set; } = string.Empty;

        public int TournamentId { get; set; }

        [ForeignKey("TournamentId")]
        public Tournaments? Tournament { get; set; }

        public int Round { get; set; }

        public DateTime Date { get; set; }

        [ForeignKey("TrackID")]
        public Tracks? Tracks { get; set; }

        public string Distance { get; set; } = string.Empty;
        public int Lanes { get; set; }
        public string Status { get; set; } = string.Empty;

    }
}
