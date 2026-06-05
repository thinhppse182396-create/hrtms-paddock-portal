using HRTMS.Models.Horses;
using HRTMS.Models.Roles;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRTMS.Models.on_board;

public class Prediction
{
    public int Id { get; set; }

    public string AccountId { get; set; } = string.Empty;
    [ForeignKey(nameof(AccountId))] public Accounts? Account { get; set; }

    public string RaceId { get; set; } = string.Empty;
    [ForeignKey(nameof(RaceId))] public Races? Race { get; set; }

    public string HorseId { get; set; } = string.Empty;
    [ForeignKey(nameof(HorseId))] public Horse? Horse { get; set; }

    public int PredictedRank { get; set; }
    public string Status { get; set; } = "PENDING";
    public decimal Payout { get; set; }
    public DateTime CreatedAt { get; set; }
}
