using HRTMS.Models.on_board;
using HRTMS.Models.Roles;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.Feedbacks
{
    public class Feedback
    {
        public string FeedBackId { get; set; } = string.Empty;

        public string AccountId { get; set; } = string.Empty;

        [ForeignKey("AccountId")]
        public Accounts? Account { get; set; }

        public string RaceId { get; set; } = string.Empty;

        [ForeignKey("RaceId")]
        public Races? Race { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
