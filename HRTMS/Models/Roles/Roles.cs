using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.Roles
{
    public class Roles
    {
        [Key] public int RoleId { get; set; }

        [Required]
        [MaxLength(50)]
        public string RoleCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string RoleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
