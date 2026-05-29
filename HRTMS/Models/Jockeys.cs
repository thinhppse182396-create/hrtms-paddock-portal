using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models
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
        public string Status { get; set; } = "Active";
        public string Contact {  get; set; } = string.Empty;
    }
}
