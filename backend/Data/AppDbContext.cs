using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Document> Documents { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure self-referencing relationship for Category
            modelBuilder.Entity<Category>()
                .HasOne(c => c.Parent)
                .WithMany(c => c.SubCategories)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Document -> Category relationship
            modelBuilder.Entity<Document>()
                .HasOne(d => d.Category)
                .WithMany(c => c.Documents)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Document -> User relationship
            modelBuilder.Entity<Document>()
                .HasOne(d => d.UploadedBy)
                .WithMany(u => u.UploadedDocuments)
                .HasForeignKey(d => d.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);

            // --- Database Optimization (Indexing) ---
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.Status);
                
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.ValidityStatus);

            modelBuilder.Entity<Document>()
                .HasIndex(d => d.CategoryId);
                
            modelBuilder.Entity<Document>()
                .HasIndex(d => d.Title);
        }
    }
}
