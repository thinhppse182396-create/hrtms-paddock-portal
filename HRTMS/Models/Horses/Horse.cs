using HRTMS.Models.Roles;
using HRTMS.Models.Statuss;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.ConstrainedExecution;
using System.Security.Principal;

namespace HRTMS.Models.Horses
{
    public class Horse
    {
        [Key]
        public string HorseId { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string HourseName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Breed { get; set; } = string.Empty;

        [Required]
        public int Age { get; set; }

        [Required]
        public int Weight { get; set; }

        [Required]
        public string Documents { get; set; } = string.Empty;

        [Required]
        public DateTime Health_Cert_Expiry { get; set; }

        public int StatusId { get; set; }
        [ForeignKey("StatusId")]
        public Status? Status { get; set; }

        public string OwnerId { get; set; } = string.Empty;

        [ForeignKey("OwnerId")]
        public Accounts? Owner { get; set; }
    }
}
