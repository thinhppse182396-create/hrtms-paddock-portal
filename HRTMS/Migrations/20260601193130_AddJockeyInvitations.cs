using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HRTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddJockeyInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JockeyInvitations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RegistrationId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    JockeyId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StatusId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JockeyInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JockeyInvitations_Jockeys_JockeyId",
                        column: x => x.JockeyId,
                        principalTable: "Jockeys",
                        principalColumn: "JockeyId");
                    table.ForeignKey(
                        name: "FK_JockeyInvitations_RaceRegistrations_RegistrationId",
                        column: x => x.RegistrationId,
                        principalTable: "RaceRegistrations",
                        principalColumn: "RegistrationId");
                    table.ForeignKey(
                        name: "FK_JockeyInvitations_Statuses_StatusId",
                        column: x => x.StatusId,
                        principalTable: "Statuses",
                        principalColumn: "StatusId");
                });

            migrationBuilder.InsertData(
                table: "Statuses",
                columns: new[] { "StatusId", "EntityName", "IsActive", "SortOrder", "StatusCode", "StatusName" },
                values: new object[,]
                {
                    { 21, "JockeyInvitation", true, 1, "PENDING", "Pending" },
                    { 22, "JockeyInvitation", true, 2, "ACCEPTED", "Accepted" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_JockeyInvitations_JockeyId",
                table: "JockeyInvitations",
                column: "JockeyId");

            migrationBuilder.CreateIndex(
                name: "IX_JockeyInvitations_RegistrationId_JockeyId",
                table: "JockeyInvitations",
                columns: new[] { "RegistrationId", "JockeyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JockeyInvitations_StatusId",
                table: "JockeyInvitations",
                column: "StatusId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JockeyInvitations");

            migrationBuilder.DeleteData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Statuses",
                keyColumn: "StatusId",
                keyValue: 22);
        }
    }
}
