using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Backend.Hubs;
using Hangfire;
using Backend.Services;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IBackgroundJobClient _backgroundJobs;

        public DocumentsController(
            AppDbContext context, 
            IWebHostEnvironment env,
            IHubContext<NotificationHub> hubContext,
            IBackgroundJobClient backgroundJobs)
        {
            _context = context;
            _env = env;
            _hubContext = hubContext;
            _backgroundJobs = backgroundJobs;
        }

        // GET: api/Documents
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Document>>> GetDocuments([FromQuery] int? categoryId, [FromQuery] string? status, [FromQuery] string? search)
        {
            var query = _context.Documents
                .Include(d => d.Category)
                .Include(d => d.UploadedBy)
                .AsNoTracking()
                .AsQueryable();

            if (categoryId.HasValue)
            {
                query = query.Where(d => d.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(d => d.Status == status);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(d => d.Title.Contains(search) || (d.Description != null && d.Description.Contains(search)));
            }

            return await query.OrderByDescending(d => d.UploadedAt).ToListAsync();
        }

        // GET: api/Documents/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Document>> GetDocument(int id)
        {
            var document = await _context.Documents
                .Include(d => d.Category)
                .Include(d => d.UploadedBy)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null)
            {
                return NotFound();
            }

            return document;
        }

        // POST: api/Documents/upload
        [HttpPost("upload")]
        [Authorize(Roles = "Editor,ContentAdmin,SystemAdmin")]
        public async Task<ActionResult<Document>> UploadDocument(
            [FromForm] string title, 
            [FromForm] string? description, 
            [FromForm] int categoryId, 
            [FromForm] int uploadedById, 
            [FromForm] int? parentDocumentId,
            [FromForm] string? version,
            IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var document = new Document
            {
                Title = title,
                Description = description,
                FilePath = "/uploads/" + uniqueFileName,
                FileType = Path.GetExtension(file.FileName),
                Size = file.Length,
                CategoryId = categoryId,
                UploadedById = uploadedById,
                UploadedAt = DateTime.UtcNow,
                Status = "Draft",
                Version = string.IsNullOrEmpty(version) ? "v1.0" : version,
                ParentDocumentId = parentDocumentId,
                ValidityStatus = "Active"
            };

            // Nếu đây là bản tải lên thay thế (phiên bản mới)
            if (parentDocumentId.HasValue)
            {
                // Tìm document gốc
                var parent = await _context.Documents.FindAsync(parentDocumentId.Value);
                if (parent != null && parent.Status == "Published")
                {
                    // Bản nháp đang chờ, nhưng sau khi duyệt nó sẽ "Replace" bản gốc.
                    // Chúng ta có thể set parent.ValidityStatus = "Replaced" trong hàm duyệt (ApprovePublish).
                }
            }

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, document);
        }

        // DELETE: api/Documents/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Reviewer,ContentAdmin,SystemAdmin")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound();
            }

            // Delete physical file
            var filePath = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), document.FilePath.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Documents/5/submit
        [HttpPost("{id}/submit")]
        [Authorize(Roles = "Editor,ContentAdmin,SystemAdmin")]
        public async Task<IActionResult> SubmitDocument(int id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null) return NotFound();

            if (document.Status != "Draft")
                return BadRequest("Only Draft documents can be submitted.");

            document.Status = "PendingReview";
            await _context.SaveChangesAsync();

            // Real-time notification for Reviewers
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", $"Có tài liệu mới cần duyệt: {document.Title}");

            // Background Job (Email)
            _backgroundJobs.Enqueue<IEmailService>(x => x.SendEmail("reviewers@evnspc.vn", "Tài liệu mới cần duyệt", $"Tài liệu {document.Title} vừa được gửi duyệt."));

            return Ok(document);
        }

        // POST: api/Documents/5/approve_publish
        [HttpPost("{id}/approve_publish")]
        [Authorize(Roles = "Reviewer,ContentAdmin,SystemAdmin")]
        public async Task<IActionResult> ApprovePublishDocument(int id, [FromBody] int reviewerId)
        {
            var document = await _context.Documents.Include(d => d.UploadedBy).FirstOrDefaultAsync(d => d.Id == id);
            if (document == null) return NotFound();

            if (document.Status != "PendingReview")
                return BadRequest("Document is not pending review.");

            document.Status = "Published";
            document.ReviewerId = reviewerId;
            document.PublishedAt = DateTime.UtcNow;

            // Xử lý Versioning: Nếu có bản gốc, đánh dấu bản gốc là bị thay thế
            if (document.ParentDocumentId.HasValue)
            {
                var parent = await _context.Documents.FindAsync(document.ParentDocumentId.Value);
                if (parent != null)
                {
                    parent.ValidityStatus = "Replaced";
                }
            }

            await _context.SaveChangesAsync();

            // SignalR Notification & Email
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", $"Tài liệu '{document.Title}' đã được duyệt và công bố!");
            
            var authorEmail = document.UploadedBy?.Username + "@evnspc.vn"; // Giả lập email từ username
            _backgroundJobs.Enqueue<IEmailService>(x => x.SendEmail(authorEmail, "Tài liệu đã được duyệt", $"Chúc mừng! Tài liệu {document.Title} của bạn đã được duyệt và công bố."));

            return Ok(document);
        }

        // POST: api/Documents/5/reject
        [HttpPost("{id}/reject")]
        [Authorize(Roles = "Reviewer,ContentAdmin,SystemAdmin")]
        public async Task<IActionResult> RejectDocument(int id, [FromBody] RejectRequest req)
        {
            var document = await _context.Documents.Include(d => d.UploadedBy).FirstOrDefaultAsync(d => d.Id == id);
            if (document == null) return NotFound();

            if (document.Status != "PendingReview")
                return BadRequest("Document is not pending review.");

            document.Status = "Draft";
            document.ReviewerId = req.ReviewerId;
            document.ReviewComments = req.Comments;
            await _context.SaveChangesAsync();

            // SignalR Notification & Email
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", $"Tài liệu '{document.Title}' đã bị từ chối với lý do: {req.Comments}");
            
            var authorEmail = document.UploadedBy?.Username + "@evnspc.vn";
            _backgroundJobs.Enqueue<IEmailService>(x => x.SendEmail(authorEmail, "Tài liệu bị từ chối duyệt", $"Tài liệu {document.Title} của bạn cần được chỉnh sửa. Lý do: {req.Comments}"));

            return Ok(document);
        }

        // GET: api/Documents/stats
        [HttpGet("stats")]
        [AllowAnonymous]
        public async Task<IActionResult> GetStats()
        {
            var totalDocuments = await _context.Documents.CountAsync();
            var publishedDocuments = await _context.Documents.CountAsync(d => d.Status == "Published");
            var pendingDocuments = await _context.Documents.CountAsync(d => d.Status == "PendingReview");
            
            var categoryStats = await _context.Categories
                .Select(c => new {
                    Name = c.Name,
                    Count = _context.Documents.Count(d => d.CategoryId == c.Id && d.Status == "Published")
                })
                .ToListAsync();

            return Ok(new
            {
                TotalDocuments = totalDocuments,
                PublishedDocuments = publishedDocuments,
                PendingDocuments = pendingDocuments,
                CategoryStats = categoryStats
            });
        }

        // POST: api/Documents/5/expire
        [HttpPost("{id}/expire")]
        [Authorize(Roles = "ContentAdmin,SystemAdmin")]
        public async Task<IActionResult> ExpireDocument(int id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null) return NotFound();

            document.ValidityStatus = "Expired";
            await _context.SaveChangesAsync();

            return Ok(document);
        }

        // GET: api/Documents/5/history
        [HttpGet("{id}/history")]
        public async Task<ActionResult<IEnumerable<Document>>> GetDocumentHistory(int id)
        {
            // Trả về tài liệu hiện tại và tất cả các tài liệu có ParentDocumentId = id 
            // hoặc liên kết chuỗi version. Để đơn giản, chỉ lấy những cái có cùng ParentDocumentId
            var history = await _context.Documents
                .Include(d => d.UploadedBy)
                .AsNoTracking()
                .Where(d => d.Id == id || d.ParentDocumentId == id || (d.ParentDocumentId != null && _context.Documents.Any(p => p.Id == d.ParentDocumentId && p.Id == id)))
                .OrderByDescending(d => d.UploadedAt)
                .ToListAsync();

            return Ok(history);
        }
    }

    public class RejectRequest
    {
        public int ReviewerId { get; set; }
        public string Comments { get; set; } = string.Empty;
    }
}
