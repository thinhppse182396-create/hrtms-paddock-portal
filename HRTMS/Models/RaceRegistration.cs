using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models
{
    public class RaceRegistration
    {
        [Key]
        public string RaceRegistrationId { get; set; } = string.Empty;

        public string RaceId { get; set; } = string.Empty;
        [ForeignKey("RaceId")]
        public Races? Race { get; set; }

        public string HorseId { get; set; } = string.Empty;
        [ForeignKey("HorseId")]
        public Horse? Horse { get; set; }

        public string JockeyId { get; set; } = string.Empty;
        [ForeignKey("JockeyId")]
        public Jockeys? Jockey { get; set; }

        public string? BackupJockeyId { get; set; }
        [ForeignKey("BackupJockeyId")]
        public Jockeys? BackupJockey { get; set; }

        public string Status { get; set; } = "Pending";
    }
}
