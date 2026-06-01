using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.on_board
{
    public class Awards
    {
        [Key] public int Id { get; set; }

        public string RaceID { get; set; } = string.Empty;
        [ForeignKey(nameof(RaceID))] public Races? Races { get; set; }

        public int Rank { get; set; }

        public decimal PriceMoney { get; set; }
    }
}
