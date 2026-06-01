using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueRaceResultHorsePerRace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RaceId_HorseId",
                table: "RaceResults",
                columns: new[] { "RaceId", "HorseId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RaceResults_RaceId_HorseId",
                table: "RaceResults");
        }
    }
}
