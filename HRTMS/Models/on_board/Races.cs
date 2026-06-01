using HRTMS.Models.Statuss;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.on_board
{
    public class Races
    {
        [Key]
        public string RaceID { get; set; } = string.Empty;

        public string TournamentId { get; set; } = string.Empty;

        [ForeignKey("TournamentId")]
        public Tournaments? Tournament { get; set; }

        public string RaceName { get; set; } = string.Empty;

        //public DateTime Date { get; set; }

        //public string TrackID { get; set; } = string.Empty;
        //[ForeignKey("TrackID")]
        //public Tracks? Track { get; set; }

        public string Distance { get; set; } = string.Empty;
        public int Lanes { get; set; }

        public int StatusId { get; set; }
        [ForeignKey("StatusId")]
        public Status? Status { get; set; }
    }
}
