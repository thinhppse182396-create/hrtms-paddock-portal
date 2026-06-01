using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddRaceResultsStoredProcedure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RaceResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RaceId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    HorseId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Rank = table.Column<int>(type: "int", nullable: false),
                    Violation = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaceResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RaceResults_Horses_HorseId",
                        column: x => x.HorseId,
                        principalTable: "Horses",
                        principalColumn: "HorseId");
                    table.ForeignKey(
                        name: "FK_RaceResults_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "RaceID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_HorseId",
                table: "RaceResults",
                column: "HorseId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RaceId_Rank",
                table: "RaceResults",
                columns: new[] { "RaceId", "Rank" });

            migrationBuilder.Sql(
                """
                CREATE OR ALTER PROCEDURE dbo.GetRaceResultsByRaceId
                    @RaceId nvarchar(450)
                AS
                BEGIN
                    SET NOCOUNT ON;

                    SELECT
                        rr.Id,
                        rr.RaceId,
                        r.RaceName,
                        rr.HorseId,
                        h.HourseName AS HorseName,
                        rr.Rank,
                        rr.Violation
                    FROM dbo.RaceResults AS rr
                    INNER JOIN dbo.Races AS r ON r.RaceID = rr.RaceId
                    INNER JOIN dbo.Horses AS h ON h.HorseId = rr.HorseId
                    WHERE rr.RaceId = @RaceId
                    ORDER BY rr.Rank, rr.Id;
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP PROCEDURE IF EXISTS dbo.GetRaceResultsByRaceId;
                """);

            migrationBuilder.DropTable(
                name: "RaceResults");
        }
    }
}
