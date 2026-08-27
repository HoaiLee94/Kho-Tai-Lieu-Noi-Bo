using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = "Employee"; // Admin, Employee

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [System.ComponentModel.DataAnnotations.Schema.InverseProperty("UploadedBy")]
        public ICollection<Document> UploadedDocuments { get; set; } = new List<Document>();
    }
}
