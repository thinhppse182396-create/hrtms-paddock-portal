using HRTMS.Models;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Security.Principal;

namespace HRTMS.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Accounts> Accounts { get; set; }
        public DbSet<Horse> Horses { get; set; }
        public DbSet<Tournaments> Tournaments { get; set; }
        public DbSet<Races> Races { get; set; }
        public DbSet<RaceRegistration> RaceRegistrations { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            foreach (var foreignKey in modelBuilder.Model.GetEntityTypes().SelectMany(entity => entity.GetForeignKeys()))
            {
                foreignKey.DeleteBehavior = DeleteBehavior.NoAction;
            }
        }
    }
}
