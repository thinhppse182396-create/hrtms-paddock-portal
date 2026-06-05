using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRTMS.Migrations
{
    /// <inheritdoc />
    public partial class RemoveMockRuntimeAddPortalEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AllowedBreeds",
                table: "Races",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MaxAge",
                table: "Races",
                type: "int",
                nullable: false,
                defaultValue: 99);

            migrationBuilder.AddColumn<int>(
                name: "MaxWeight",
                table: "Races",
                type: "int",
                nullable: false,
                defaultValue: 999);

            migrationBuilder.AddColumn<int>(
                name: "MinAge",
                table: "Races",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "MinWeight",
                table: "Races",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<bool>(
                name: "RequiresValidHealthCert",
                table: "Races",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "RoundNumber",
                table: "Races",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<bool>(
                name: "Disqualified",
                table: "RaceResults",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "FinishTime",
                table: "RaceResults",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "JockeyId",
                table: "RaceResults",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Published",
                table: "RaceResults",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "JockeyInvitations",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateTable(
                name: "AwardCeremonies",
                columns: table => new
                {
                    RaceId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Venue = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AwardCeremonies", x => x.RaceId);
                    table.ForeignKey(
                        name: "FK_AwardCeremonies_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "RaceID");
                });

            migrationBuilder.CreateTable(
                name: "Predictions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AccountId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RaceId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    HorseId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PredictedRank = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Payout = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Predictions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Predictions_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "AccountId");
                    table.ForeignKey(
                        name: "FK_Predictions_Horses_HorseId",
                        column: x => x.HorseId,
                        principalTable: "Horses",
                        principalColumn: "HorseId");
                    table.ForeignKey(
                        name: "FK_Predictions_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "RaceID");
                });

            migrationBuilder.CreateTable(
                name: "PreRaceChecks",
                columns: table => new
                {
                    RaceId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    JsonData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreRaceChecks", x => x.RaceId);
                    table.ForeignKey(
                        name: "FK_PreRaceChecks_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "RaceID");
                });

            migrationBuilder.CreateTable(
                name: "RaceControlStates",
                columns: table => new
                {
                    RaceId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    JsonData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaceControlStates", x => x.RaceId);
                    table.ForeignKey(
                        name: "FK_RaceControlStates_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "RaceID");
                });

            migrationBuilder.CreateTable(
                name: "RefereeReports",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RaceId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RefereeId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefereeReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefereeReports_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "RaceID");
                    table.ForeignKey(
                        name: "FK_RefereeReports_Referees_RefereeId",
                        column: x => x.RefereeId,
                        principalTable: "Referees",
                        principalColumn: "RefereeId");
                });

            migrationBuilder.CreateTable(
                name: "Violations",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RaceId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    HorseId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    JockeyId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Violations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Violations_Horses_HorseId",
                        column: x => x.HorseId,
                        principalTable: "Horses",
                        principalColumn: "HorseId");
                    table.ForeignKey(
                        name: "FK_Violations_Jockeys_JockeyId",
                        column: x => x.JockeyId,
                        principalTable: "Jockeys",
                        principalColumn: "JockeyId");
                    table.ForeignKey(
                        name: "FK_Violations_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "RaceID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_JockeyId",
                table: "RaceResults",
                column: "JockeyId");

            migrationBuilder.CreateIndex(
                name: "IX_Predictions_AccountId_RaceId_HorseId",
                table: "Predictions",
                columns: new[] { "AccountId", "RaceId", "HorseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Predictions_HorseId",
                table: "Predictions",
                column: "HorseId");

            migrationBuilder.CreateIndex(
                name: "IX_Predictions_RaceId",
                table: "Predictions",
                column: "RaceId");

            migrationBuilder.CreateIndex(
                name: "IX_RefereeReports_RaceId",
                table: "RefereeReports",
                column: "RaceId");

            migrationBuilder.CreateIndex(
                name: "IX_RefereeReports_RefereeId",
                table: "RefereeReports",
                column: "RefereeId");

            migrationBuilder.CreateIndex(
                name: "IX_Violations_HorseId",
                table: "Violations",
                column: "HorseId");

            migrationBuilder.CreateIndex(
                name: "IX_Violations_JockeyId",
                table: "Violations",
                column: "JockeyId");

            migrationBuilder.CreateIndex(
                name: "IX_Violations_RaceId",
                table: "Violations",
                column: "RaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_RaceResults_Jockeys_JockeyId",
                table: "RaceResults",
                column: "JockeyId",
                principalTable: "Jockeys",
                principalColumn: "JockeyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RaceResults_Jockeys_JockeyId",
                table: "RaceResults");

            migrationBuilder.DropTable(
                name: "AwardCeremonies");

            migrationBuilder.DropTable(
                name: "Predictions");

            migrationBuilder.DropTable(
                name: "PreRaceChecks");

            migrationBuilder.DropTable(
                name: "RaceControlStates");

            migrationBuilder.DropTable(
                name: "RefereeReports");

            migrationBuilder.DropTable(
                name: "Violations");

            migrationBuilder.DropIndex(
                name: "IX_RaceResults_JockeyId",
                table: "RaceResults");

            migrationBuilder.DropColumn(
                name: "AllowedBreeds",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "MaxAge",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "MaxWeight",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "MinAge",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "MinWeight",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "RequiresValidHealthCert",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "RoundNumber",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "Disqualified",
                table: "RaceResults");

            migrationBuilder.DropColumn(
                name: "FinishTime",
                table: "RaceResults");

            migrationBuilder.DropColumn(
                name: "JockeyId",
                table: "RaceResults");

            migrationBuilder.DropColumn(
                name: "Published",
                table: "RaceResults");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "JockeyInvitations");
        }
    }
}
