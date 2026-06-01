using System.ComponentModel.DataAnnotations;

namespace HRTMS.Models.on_board
{
    public class Tracks
    {
        [Key]
        public string TrackId { get; set; } = string.Empty;

        [Required]
        public string TrackName { get; set; } = string.Empty;

        public string Length { get; set; } = string.Empty;
        public string Width { get; set; } = string.Empty;
        public int MaxLanes { get; set; }
        public string AvailableDistances { get; set; } = string.Empty;
    }
}
