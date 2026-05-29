using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models
{
    public class Races
    {
        [Key]
        public string RaceID { get; set; } = string.Empty;

        public string TournamentId { get; set; } = string.Empty;

        [ForeignKey("TournamentId")]
        public Tournaments? Tournament { get; set; }

        public int Round { get; set; }

        public DateTime Date { get; set; }

        public string TrackID { get; set; } = string.Empty;
        [ForeignKey("TrackID")]
        public Tracks? Track { get; set; }

        public string Distance { get; set; } = string.Empty;
        public int Lanes { get; set; }
        public string Status { get; set; } = string.Empty;

    }
}
