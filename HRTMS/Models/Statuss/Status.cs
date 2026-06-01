using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.Statuss
{
    public class Status
    {
        [Key]
        public int StatusId { get; set; }

        [Required]
        public string EntityName { get; set; } = string.Empty;

        [Required]
        public string StatusCode { get; set; } = string.Empty;

        [Required]
        public string StatusName { get; set; } = string.Empty;

        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
