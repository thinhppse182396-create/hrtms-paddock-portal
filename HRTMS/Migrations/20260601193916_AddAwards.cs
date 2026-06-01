using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRTMS.Migrations
{
    /// <inheritdoc />
    public partial class AddAwards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Awards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RaceID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Rank = table.Column<int>(type: "int", nullable: false),
                    PriceMoney = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Awards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Awards_Races_RaceID",
                        column: x => x.RaceID,
                        principalTable: "Races",
                        principalColumn: "RaceID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Awards_RaceID_Rank",
                table: "Awards",
                columns: new[] { "RaceID", "Rank" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Awards");
        }
    }
}
