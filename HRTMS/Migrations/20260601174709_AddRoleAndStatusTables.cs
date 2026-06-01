using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HRTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleAndStatusTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RaceRegistrations_Jockeys_JockeyId",
                table: "RaceRegistrations");

            migrationBuilder.DropForeignKey(
                name: "FK_Races_Tracks_TrackID",
                table: "Races");

            migrationBuilder.DropIndex(
                name: "IX_Races_TrackID",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "Date",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "TrackID",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "RaceRegistrations");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Jockeys");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Horses");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Accounts");

            migrationBuilder.RenameColumn(
                name: "Round",
                table: "Races",
                newName: "StatusId");

            migrationBuilder.RenameColumn(
                name: "JockeyId",
                table: "RaceRegistrations",
                newName: "JockeyName");

            migrationBuilder.RenameColumn(
                name: "RaceRegistrationId",
                table: "RaceRegistrations",
                newName: "RegistrationId");

            migrationBuilder.RenameIndex(
                name: "IX_RaceRegistrations_JockeyId",
                table: "RaceRegistrations",
                newName: "IX_RaceRegistrations_JockeyName");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Horses",
                newName: "HourseName");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Accounts",
                newName: "AccountId");

            migrationBuilder.AddColumn<int>(
                name: "StatusId",
                table: "Tournaments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RaceName",
                table: "Races",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "StatusId",
                table: "RaceRegistrations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "StatusId",
                table: "Jockeys",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "StatusId",
                table: "Horses",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RoleId",
                table: "Accounts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "StatusId",
                table: "Accounts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Referees",
                columns: table => new
                {
                    RefereeId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AccountId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RefereeName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RefereeLicenseNumber = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Referees", x => x.RefereeId);
                    table.ForeignKey(
                        name: "FK_Referees_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "AccountId");
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RoleName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.RoleId);
                });

            migrationBuilder.CreateTable(
                name: "Rounds",
                columns: table => new
                {
                    RoundId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RaceID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RoundName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rounds", x => x.RoundId);
                    table.ForeignKey(
                        name: "FK_Rounds_Races_RaceID",
                        column: x => x.RaceID,
                        principalTable: "Races",
                        principalColumn: "RaceID");
                });

            migrationBuilder.CreateTable(
                name: "Statuses",
                columns: table => new
                {
                    StatusId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EntityName = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StatusCode = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StatusName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Statuses", x => x.StatusId);
                });

            migrationBuilder.CreateTable(
                name: "RefereePanels",
                columns: table => new
                {
                    RefereePanelId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RaceId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LeadID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Member1ID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Member2ID = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefereePanels", x => x.RefereePanelId);
                    table.ForeignKey(
                        name: "FK_RefereePanels_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "RaceID");
                    table.ForeignKey(
                        name: "FK_RefereePanels_Referees_LeadID",
                        column: x => x.LeadID,
                        principalTable: "Referees",
                        principalColumn: "RefereeId");
                    table.ForeignKey(
                        name: "FK_RefereePanels_Referees_Member1ID",
                        column: x => x.Member1ID,
                        principalTable: "Referees",
                        principalColumn: "RefereeId");
                    table.ForeignKey(
                        name: "FK_RefereePanels_Referees_Member2ID",
                        column: x => x.Member2ID,
                        principalTable: "Referees",
                        principalColumn: "RefereeId");
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "RoleId", "Description", "IsActive", "RoleCode", "RoleName" },
                values: new object[,]
                {
                    { 1, null, true, "ADMIN", "Admin" },
                    { 2, null, true, "REFEREE", "Referee" },
                    { 3, null, true, "JOCKEY", "Jockey" },
                    { 4, null, true, "HORSE_OWNER", "Horse Owner" },
                    { 5, null, true, "SPECTATOR", "Spectator" }
                });

            migrationBuilder.InsertData(
                table: "Statuses",
                columns: new[] { "StatusId", "EntityName", "IsActive", "SortOrder", "StatusCode", "StatusName" },
                values: new object[,]
                {
                    { 1, "Account", true, 1, "ACTIVE", "Active" },
                    { 2, "Account", true, 2, "LOCKED", "Locked" },
                    { 3, "Referee", true, 1, "ACTIVE", "Active" },
                    { 4, "Referee", true, 2, "SUSPENDED", "Suspended" },
                    { 9, "Horse", true, 1, "INJURED", "Injured" },
                    { 10, "Horse", true, 1, "ELIGIBLE", "Eligible" },
                    { 11, "Horse", true, 1, "SUSPENDED", "Suspended" },
                    { 12, "Race", true, 1, "SCHEDULED", "Scheduled" },
                    { 13, "Race", true, 2, "ONGOING", "Ongoing" },
                    { 14, "Race", true, 3, "COMPLETED", "Completed" },
                    { 15, "Race", true, 4, "CANCELLED", "Cancelled" },
                    { 16, "Registration", true, 1, "PENDING", "Pending" },
                    { 17, "Registration", true, 2, "APPROVED", "Approved" },
                    { 18, "Registration", true, 3, "REJECTED", "Rejected" },
                    { 19, "Registration", true, 4, "CANCELLED", "Cancelled" },
                    { 20, "Feedback", true, 1, "RESOLVED", "Resolved" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tournaments_StatusId",
                table: "Tournaments",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_Races_StatusId",
                table: "Races",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceRegistrations_StatusId",
                table: "RaceRegistrations",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_Jockeys_StatusId",
                table: "Jockeys",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_Horses_StatusId",
                table: "Horses",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_RoleId",
                table: "Accounts",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_StatusId",
                table: "Accounts",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_RefereePanels_LeadID",
                table: "RefereePanels",
                column: "LeadID");

            migrationBuilder.CreateIndex(
                name: "IX_RefereePanels_Member1ID",
                table: "RefereePanels",
                column: "Member1ID");

            migrationBuilder.CreateIndex(
                name: "IX_RefereePanels_Member2ID",
                table: "RefereePanels",
                column: "Member2ID");

            migrationBuilder.CreateIndex(
                name: "IX_RefereePanels_RaceId",
                table: "RefereePanels",
                column: "RaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Referees_AccountId",
                table: "Referees",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_RoleCode",
                table: "Roles",
                column: "RoleCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rounds_RaceID",
                table: "Rounds",
                column: "RaceID");

            migrationBuilder.CreateIndex(
                name: "IX_Statuses_EntityName_StatusCode",
                table: "Statuses",
                columns: new[] { "EntityName", "StatusCode" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Accounts_Roles_RoleId",
                table: "Accounts",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "RoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Accounts_Statuses_StatusId",
                table: "Accounts",
                column: "StatusId",
                principalTable: "Statuses",
                principalColumn: "StatusId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Horses_Statuses_StatusId",
                table: "Horses",
                column: "StatusId",
                principalTable: "Statuses",
                principalColumn: "StatusId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Jockeys_Statuses_StatusId",
                table: "Jockeys",
                column: "StatusId",
                principalTable: "Statuses",
                principalColumn: "StatusId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RaceRegistrations_Jockeys_JockeyName",
                table: "RaceRegistrations",
                column: "JockeyName",
                principalTable: "Jockeys",
                principalColumn: "JockeyId");

            migrationBuilder.AddForeignKey(
                name: "FK_RaceRegistrations_Statuses_StatusId",
                table: "RaceRegistrations",
                column: "StatusId",
                principalTable: "Statuses",
                principalColumn: "StatusId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Races_Statuses_StatusId",
                table: "Races",
                column: "StatusId",
                principalTable: "Statuses",
                principalColumn: "StatusId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tournaments_Statuses_StatusId",
                table: "Tournaments",
                column: "StatusId",
                principalTable: "Statuses",
                principalColumn: "StatusId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Accounts_Roles_RoleId",
                table: "Accounts");

            migrationBuilder.DropForeignKey(
                name: "FK_Accounts_Statuses_StatusId",
                table: "Accounts");

            migrationBuilder.DropForeignKey(
                name: "FK_Horses_Statuses_StatusId",
                table: "Horses");

            migrationBuilder.DropForeignKey(
                name: "FK_Jockeys_Statuses_StatusId",
                table: "Jockeys");

            migrationBuilder.DropForeignKey(
                name: "FK_RaceRegistrations_Jockeys_JockeyName",
                table: "RaceRegistrations");

            migrationBuilder.DropForeignKey(
                name: "FK_RaceRegistrations_Statuses_StatusId",
                table: "RaceRegistrations");

            migrationBuilder.DropForeignKey(
                name: "FK_Races_Statuses_StatusId",
                table: "Races");

            migrationBuilder.DropForeignKey(
                name: "FK_Tournaments_Statuses_StatusId",
                table: "Tournaments");

            migrationBuilder.DropTable(
                name: "RefereePanels");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Rounds");

            migrationBuilder.DropTable(
                name: "Statuses");

            migrationBuilder.DropTable(
                name: "Referees");

            migrationBuilder.DropIndex(
                name: "IX_Tournaments_StatusId",
                table: "Tournaments");

            migrationBuilder.DropIndex(
                name: "IX_Races_StatusId",
                table: "Races");

            migrationBuilder.DropIndex(
                name: "IX_RaceRegistrations_StatusId",
                table: "RaceRegistrations");

            migrationBuilder.DropIndex(
                name: "IX_Jockeys_StatusId",
                table: "Jockeys");

            migrationBuilder.DropIndex(
                name: "IX_Horses_StatusId",
                table: "Horses");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_RoleId",
                table: "Accounts");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_StatusId",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "StatusId",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "RaceName",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "StatusId",
                table: "RaceRegistrations");

            migrationBuilder.DropColumn(
                name: "StatusId",
                table: "Jockeys");

            migrationBuilder.DropColumn(
                name: "StatusId",
                table: "Horses");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "StatusId",
                table: "Accounts");

            migrationBuilder.RenameColumn(
                name: "StatusId",
                table: "Races",
                newName: "Round");

            migrationBuilder.RenameColumn(
                name: "JockeyName",
                table: "RaceRegistrations",
                newName: "JockeyId");

            migrationBuilder.RenameColumn(
                name: "RegistrationId",
                table: "RaceRegistrations",
                newName: "RaceRegistrationId");

            migrationBuilder.RenameIndex(
                name: "IX_RaceRegistrations_JockeyName",
                table: "RaceRegistrations",
                newName: "IX_RaceRegistrations_JockeyId");

            migrationBuilder.RenameColumn(
                name: "HourseName",
                table: "Horses",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "AccountId",
                table: "Accounts",
                newName: "Id");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Tournaments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "Date",
                table: "Races",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Races",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TrackID",
                table: "Races",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "RaceRegistrations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Jockeys",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Horses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Accounts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Accounts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Races_TrackID",
                table: "Races",
                column: "TrackID");

            migrationBuilder.AddForeignKey(
                name: "FK_RaceRegistrations_Jockeys_JockeyId",
                table: "RaceRegistrations",
                column: "JockeyId",
                principalTable: "Jockeys",
                principalColumn: "JockeyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Races_Tracks_TrackID",
                table: "Races",
                column: "TrackID",
                principalTable: "Tracks",
                principalColumn: "TrackId");
        }
    }
}
