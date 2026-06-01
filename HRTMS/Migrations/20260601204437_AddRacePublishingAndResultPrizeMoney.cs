using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddRacePublishingAndResultPrizeMoney : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PrizeMoney",
                table: "RaceResults",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

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
                        rr.Violation,
                        rr.PrizeMoney
                    FROM dbo.RaceResults AS rr
                    INNER JOIN dbo.Races AS r ON r.RaceID = rr.RaceId
                    INNER JOIN dbo.Horses AS h ON h.HorseId = rr.HorseId
                    WHERE rr.RaceId = @RaceId
                    ORDER BY rr.Rank, rr.Id;
                END
                """);

            migrationBuilder.UpdateData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 14,
                columns: new[] { "StatusCode", "StatusName" },
                values: new object[] { "FINISHED", "Finished" });

            migrationBuilder.UpdateData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 15,
                column: "SortOrder",
                value: 5);

            migrationBuilder.InsertData(
                table: "Statuses",
                columns: new[] { "StatusId", "EntityName", "IsActive", "SortOrder", "StatusCode", "StatusName" },
                values: new object[] { 23, "Race", true, 4, "PUBLISHED", "Published" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.DeleteData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 23);

            migrationBuilder.DropColumn(
                name: "PrizeMoney",
                table: "RaceResults");

            migrationBuilder.UpdateData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 14,
                columns: new[] { "StatusCode", "StatusName" },
                values: new object[] { "COMPLETED", "Completed" });

            migrationBuilder.UpdateData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 15,
                column: "SortOrder",
                value: 4);
        }
    }
}
