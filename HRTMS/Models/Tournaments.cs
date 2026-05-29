using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models
{
    public class Tournaments
    {
        [Key]
        public String TournamentId { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;

        [ForeignKey("TrackID")]
        public Tracks? Tracks { get; set; }

        [Required]
        public DateTime Start { get; set; }

        [Required]
        public DateTime End { get; set; }

        public string Status { get; set; } = string.Empty;
    }
}
