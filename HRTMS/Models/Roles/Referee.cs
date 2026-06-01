using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.Roles
{
    public class Referee
    {
        [Key]
        public string RefereeId { get; set; } = string.Empty;

        public string AccountId { get; set; } = string.Empty;

        [ForeignKey("AccountId")]
        public Accounts? Account { get; set; }

        public string RefereeName { get; set; } = string.Empty;
        public string RefereeLicenseNumber { get; set; } = string.Empty;

    }
}
