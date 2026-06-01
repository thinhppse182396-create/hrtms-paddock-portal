using HRTMS.Models.on_board;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.Roles
{
    public class RefereePanel
    {
        [Key] public string RefereePanelId { get; set; } = string.Empty;

        public string RaceId { get; set; } = string.Empty;
        [ForeignKey("RaceId")] public Races? Races { get; set; }

        public string LeadID { get; set; } = string.Empty;
        [ForeignKey("LeadID")] public Referee? Lead { get; set; }

        public string Member1ID { get; set; } = string.Empty;
        [ForeignKey("Member1ID")] public Referee? Member1 { get; set; }

        public string Member2ID { get; set; } = string.Empty;
        [ForeignKey("Member2ID")] public Referee? Member2 { get; set; }
    }
}
