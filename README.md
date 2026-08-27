# Kho Tài Liệu Nghiệp Vụ TTCSKH EVNSPC

Hệ thống quản lý, tra cứu, và phê duyệt tài liệu nghiệp vụ dùng nội bộ cho Trung Tâm Chăm Sóc Khách Hàng EVNSPC.

## 🚀 Tính năng nổi bật
- **Role-based Access Control (RBAC):** Phân quyền chi tiết tới 6 nhóm người dùng (SystemAdmin, ContentAdmin, Editor, Reviewer, CSRAgent, Reader).
- **Quy trình duyệt văn bản (Workflow):** Hỗ trợ luồng Nháp -> Chờ Duyệt -> Đã Công Bố / Từ Chối.
- **Quản lý Phiên bản (Versioning):** Tải lên bản thay thế cho các văn bản cũ, tự động đánh dấu phiên bản.
- **Trạng thái Hiệu lực (Validity):** Các văn bản hết hạn hoặc bị thay thế sẽ có cảnh báo đỏ `⚠️ HẾT HIỆU LỰC` để tránh gây nhầm lẫn cho điện thoại viên.
- **Real-time Notifications:** Sử dụng SignalR để đẩy thông báo "In-app" tức thì khi có bài cần duyệt.
- **Background Jobs (Email):** Sử dụng Hangfire để lập lịch gửi email thông báo ngầm mà không làm chậm hệ thống.
- **Tìm kiếm & Xem trước (Preview):** Tích hợp PDF/Image Viewer trực tiếp trong trình duyệt, tìm kiếm siêu tốc.

## 🛠 Công nghệ sử dụng
- **Backend:** .NET 8 (C#), Entity Framework Core, SQL Server, SignalR, Hangfire.
- **Frontend:** Next.js 14, React, Tailwind CSS, Recharts, React-Toastify.
- **Khác:** JWT Authentication.

## 📦 Hướng dẫn cài đặt

1. **Khởi chạy Backend:**
   ```bash
   cd backend
   dotnet restore
   dotnet ef database update
   dotnet run
   ```
   *Dashboard của Hangfire có thể truy cập tại: `http://localhost:5166/hangfire`*
   *Swagger API UI: `http://localhost:5166/swagger`*

2. **Khởi chạy Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Giao diện người dùng: `http://localhost:3000`*

## 🔒 Tài khoản thử nghiệm
- **SystemAdmin:** admin / 123456
- **Reviewer:** reviewer / 123456
- **Editor:** editor / 123456
- **CSRAgent:** csragent / 123456
