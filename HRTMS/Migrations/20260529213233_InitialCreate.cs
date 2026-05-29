using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRTMS.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tracks",
                columns: table => new
                {
                    TrackId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TrackName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Length = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Width = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MaxLanes = table.Column<int>(type: "int", nullable: false),
                    AvailableDistances = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tracks", x => x.TrackId);
                });

            migrationBuilder.CreateTable(
                name: "Horses",
                columns: table => new
                {
                    HorseId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Breed = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Age = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<int>(type: "int", nullable: false),
                    Documents = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Health_Cert_Expiry = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OwnerId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Horses", x => x.HorseId);
                    table.ForeignKey(
                        name: "FK_Horses_Accounts_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Accounts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Jockeys",
                columns: table => new
                {
                    JockeyId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AccountId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LicenseNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Weight = table.Column<int>(type: "int", nullable: false),
                    Ranking = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Contact = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Jockeys", x => x.JockeyId);
                    table.ForeignKey(
                        name: "FK_Jockeys_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Tournaments",
                columns: table => new
                {
                    TournamentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrackID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Start = table.Column<DateTime>(type: "datetime2", nullable: false),
                    End = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tournaments", x => x.TournamentId);
                    table.ForeignKey(
                        name: "FK_Tournaments_Tracks_TrackID",
                        column: x => x.TrackID,
                        principalTable: "Tracks",
                        principalColumn: "TrackId");
                });

            migrationBuilder.CreateTable(
                name: "Races",
                columns: table => new
                {
                    RaceID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TournamentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Round = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TrackID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Distance = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Lanes = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Races", x => x.RaceID);
                    table.ForeignKey(
                        name: "FK_Races_Tournaments_TournamentId",
                        column: x => x.TournamentId,
                        principalTable: "Tournaments",
                        principalColumn: "TournamentId");
                    table.ForeignKey(
                        name: "FK_Races_Tracks_TrackID",
                        column: x => x.TrackID,
                        principalTable: "Tracks",
                        principalColumn: "TrackId");
                });

            migrationBuilder.CreateTable(
                name: "Feedbacks",
                columns: table => new
                {
                    FeedBackId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AccountId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RaceId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Feedbacks", x => x.FeedBackId);
                    table.ForeignKey(
                        name: "FK_Feedbacks_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Feedbacks_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "RaceID");
                });

            migrationBuilder.CreateTable(
                name: "RaceRegistrations",
                columns: table => new
                {
                    RaceRegistrationId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RaceId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    HorseId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    JockeyId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    BackupJockeyId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaceRegistrations", x => x.RaceRegistrationId);
                    table.ForeignKey(
                        name: "FK_RaceRegistrations_Horses_HorseId",
                        column: x => x.HorseId,
                        principalTable: "Horses",
                        principalColumn: "HorseId");
                    table.ForeignKey(
                        name: "FK_RaceRegistrations_Jockeys_BackupJockeyId",
                        column: x => x.BackupJockeyId,
                        principalTable: "Jockeys",
                        principalColumn: "JockeyId");
                    table.ForeignKey(
                        name: "FK_RaceRegistrations_Jockeys_JockeyId",
                        column: x => x.JockeyId,
                        principalTable: "Jockeys",
                        principalColumn: "JockeyId");
                    table.ForeignKey(
                        name: "FK_RaceRegistrations_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "RaceID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_AccountId",
                table: "Feedbacks",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_RaceId",
                table: "Feedbacks",
                column: "RaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Horses_OwnerId",
                table: "Horses",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Jockeys_AccountId",
                table: "Jockeys",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceRegistrations_BackupJockeyId",
                table: "RaceRegistrations",
                column: "BackupJockeyId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceRegistrations_HorseId",
                table: "RaceRegistrations",
                column: "HorseId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceRegistrations_JockeyId",
                table: "RaceRegistrations",
                column: "JockeyId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceRegistrations_RaceId",
                table: "RaceRegistrations",
                column: "RaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Races_TournamentId",
                table: "Races",
                column: "TournamentId");

            migrationBuilder.CreateIndex(
                name: "IX_Races_TrackID",
                table: "Races",
                column: "TrackID");

            migrationBuilder.CreateIndex(
                name: "IX_Tournaments_TrackID",
                table: "Tournaments",
                column: "TrackID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Feedbacks");

            migrationBuilder.DropTable(
                name: "RaceRegistrations");

            migrationBuilder.DropTable(
                name: "Horses");

            migrationBuilder.DropTable(
                name: "Jockeys");

            migrationBuilder.DropTable(
                name: "Races");

            migrationBuilder.DropTable(
                name: "Accounts");

            migrationBuilder.DropTable(
                name: "Tournaments");

            migrationBuilder.DropTable(
                name: "Tracks");
        }
    }
}
