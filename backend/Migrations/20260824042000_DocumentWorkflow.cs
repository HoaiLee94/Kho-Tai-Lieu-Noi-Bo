using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class DocumentWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPublic",
                table: "Documents");

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "Documents",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewComments",
                table: "Documents",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReviewerId",
                table: "Documents",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Documents",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ReviewerId",
                table: "Documents",
                column: "ReviewerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Users_ReviewerId",
                table: "Documents",
                column: "ReviewerId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Users_ReviewerId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_ReviewerId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "ReviewComments",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "ReviewerId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Documents");

            migrationBuilder.AddColumn<bool>(
                name: "IsPublic",
                table: "Documents",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
