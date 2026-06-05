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

        public DateTime ScheduledAt { get; set; }
        public int RoundNumber { get; set; } = 1;
        public int MinAge { get; set; } = 1;
        public int MaxAge { get; set; } = 99;
        public int MinWeight { get; set; } = 1;
        public int MaxWeight { get; set; } = 999;
        public string AllowedBreeds { get; set; } = string.Empty;
        public bool RequiresValidHealthCert { get; set; } = true;

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
