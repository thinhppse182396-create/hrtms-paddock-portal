using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HRTMS.Migrations
{
    /// <inheritdoc />
    public partial class CompleteDemoApi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RaceResults_RaceId_Rank",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceRegistrations_RaceId",
                table: "RaceRegistrations");

            migrationBuilder.InsertData(
                table: "Statuses",
                columns: new[] { "StatusId", "EntityName", "IsActive", "SortOrder", "StatusCode", "StatusName" },
                values: new object[,]
                {
                    { 5, "Jockey", true, 1, "ACTIVE", "Active" },
                    { 6, "Jockey", true, 2, "SUSPENDED", "Suspended" },
                    { 24, "Tournament", true, 1, "DRAFT", "Draft" },
                    { 25, "Tournament", true, 2, "OPEN", "Open" },
                    { 26, "Tournament", true, 3, "CLOSED", "Closed" },
                    { 27, "Tournament", true, 4, "COMPLETED", "Completed" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RaceId_Rank",
                table: "RaceResults",
                columns: new[] { "RaceId", "Rank" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RaceRegistrations_RaceId_HorseId",
                table: "RaceRegistrations",
                columns: new[] { "RaceId", "HorseId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RaceResults_RaceId_Rank",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceRegistrations_RaceId_HorseId",
                table: "RaceRegistrations");

            migrationBuilder.DeleteData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 27);

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RaceId_Rank",
                table: "RaceResults",
                columns: new[] { "RaceId", "Rank" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceRegistrations_RaceId",
                table: "RaceRegistrations",
                column: "RaceId");
        }
    }
}
