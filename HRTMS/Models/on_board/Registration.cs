using HRTMS.Models.Horses;
using HRTMS.Models.Roles;
using HRTMS.Models.Statuss;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.on_board
{
    public class Registration
    {
        [Key]
        public string RegistrationId { get; set; } = string.Empty;

        public string RaceId { get; set; } = string.Empty;
        [ForeignKey("RaceId")]
        public Races? Race { get; set; }

        public string HorseId { get; set; } = string.Empty;
        [ForeignKey("HorseId")]
        public Horse? Horse { get; set; }

        public string JockeyName { get; set; } = string.Empty;
        [ForeignKey("JockeyName")]
        public Jockeys? Jockey { get; set; }

        public string? BackupJockeyId { get; set; }
        [ForeignKey("BackupJockeyId")]
        public Jockeys? BackupJockey { get; set; }

        public int StatusId { get; set; }
        [ForeignKey("StatusId")]
        public Status? Status { get; set; }
    }
}
