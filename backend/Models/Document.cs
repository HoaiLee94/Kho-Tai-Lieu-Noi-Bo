using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Document
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string FileType { get; set; } = string.Empty;

        public long Size { get; set; }

        public int CategoryId { get; set; }
        [ForeignKey("CategoryId")]
        public Category? Category { get; set; }

        public int UploadedById { get; set; }
        [ForeignKey("UploadedById")]
        public User? UploadedBy { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Draft"; // Draft, PendingReview, Published, Archived

        public int? ReviewerId { get; set; }
        [ForeignKey("ReviewerId")]
        public User? Reviewer { get; set; }

        public string? ReviewComments { get; set; }

        public DateTime? PublishedAt { get; set; }

        // Giai đoạn 10: Versioning
        [MaxLength(20)]
        public string Version { get; set; } = "v1.0";

        public int? ParentDocumentId { get; set; }
        [ForeignKey("ParentDocumentId")]
        public Document? ParentDocument { get; set; }

        // Giai đoạn 10: Validity Management
        [MaxLength(50)]
        public string ValidityStatus { get; set; } = "Active"; // Active, Expired, Replaced
    }
}
