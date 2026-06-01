using HRTMS.Models.Statuss;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.Roles
{
    public class Jockeys
    {
        [Key]
        public String JockeyId { get; set; } = string.Empty;
        public string AccountId { get; set; } = string.Empty;

        [ForeignKey("AccountId")]
        public Accounts? Account { get; set; }

        public string LicenseNumber { get; set; } = string.Empty;
        public int Weight { get; set; }
        public string Ranking { get; set; } = string.Empty;

        public int StatusId { get; set; }
        [ForeignKey("StatusId")]
        public Status? Status { get; set; }
        public string Contact {  get; set; } = string.Empty;
    }
}
