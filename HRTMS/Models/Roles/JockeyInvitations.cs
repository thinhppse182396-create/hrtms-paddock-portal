using HRTMS.Models.Statuss;
using HRTMS.Models.on_board;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.Roles
{
    public class JockeyInvitations
    {
        [Key] public int Id { get; set; }

        public string RegistrationId { get; set; } = string.Empty;
        [ForeignKey(nameof(RegistrationId))]
        public Registration? Registration { get; set; }

        public string JockeyId { get; set; } = string.Empty;
        [ForeignKey(nameof(JockeyId))] public Jockeys? Jockey { get; set; }

        public int StatusId { get; set; }
        [ForeignKey(nameof(StatusId))]
        public Status? Status { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
