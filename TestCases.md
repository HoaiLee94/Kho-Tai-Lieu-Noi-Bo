# Bộ Test Cases: Kho Tài Liệu Nghiệp Vụ EVNSPC

Bộ test case này tập trung kiểm thử các luồng xử lý trọng yếu nhất của hệ thống, bao gồm Vòng đời Văn bản, Quản lý Phiên bản, và Hệ thống Thông báo (Giai đoạn 10).

---

## 1. Luồng tải lên và phê duyệt văn bản (Workflow & Real-time)

| ID | Kịch bản kiểm thử (Test Scenario) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) |
|---|---|---|---|
| TC_WF_01 | Editor tạo văn bản nháp và gửi duyệt | 1. Đăng nhập Editor.<br>2. Upload tài liệu (Bản Nháp).<br>3. Ấn "Gửi duyệt" | Trạng thái chuyển thành "Chờ duyệt". Reviewer nhận được Toast notification ngay lập tức. |
| TC_WF_02 | Reviewer duyệt văn bản | 1. Đăng nhập Reviewer.<br>2. Xem tài liệu "Chờ duyệt".<br>3. Ấn "Duyệt & Công bố" | Trạng thái chuyển thành "Đã công bố". Email (Hangfire) được xếp hàng đợi gửi cho Editor. |
| TC_WF_03 | Reviewer từ chối văn bản | 1. Đăng nhập Reviewer.<br>2. Ấn "Từ chối", nhập lý do "Lỗi font chữ". | Trạng thái trở về "Bản nháp". Lý do từ chối hiện lên cho Editor. Editor nhận được Toast/Email. |

## 2. Quản lý Phiên bản và Hiệu lực (Versioning & Validity)

| ID | Kịch bản kiểm thử (Test Scenario) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) |
|---|---|---|---|
| TC_VER_01 | Editor tải lên bản thay thế cho văn bản đã công bố | 1. Đăng nhập Editor.<br>2. Tìm 1 văn bản "Đã công bố".<br>3. Ấn "Thay thế".<br>4. Nhập phiên bản "v2.0" và tải lên. | Sinh ra 1 văn bản Nháp mới với Version=v2.0, ParentDocumentId trỏ về bản cũ. Bản cũ vẫn "Đã công bố". |
| TC_VER_02 | Duyệt bản thay thế và kiểm tra hiệu lực | 1. Đăng nhập Reviewer.<br>2. Ấn duyệt bản thay thế v2.0 (từ TC_VER_01). | Bản v2.0 chuyển thành "Đã công bố". Bản gốc (v1.0) tự động chuyển ValidityStatus = "Replaced" (Bị thay thế). |
| TC_VER_03 | Đình chỉ thủ công văn bản | 1. Đăng nhập ContentAdmin.<br>2. Ấn "Đình chỉ" 1 văn bản đang Active. | ValidityStatus của văn bản chuyển sang "Expired" (Hết hiệu lực). |

## 3. Trải nghiệm Điện thoại viên (Tra cứu & Cảnh báo)

| ID | Kịch bản kiểm thử (Test Scenario) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) |
|---|---|---|---|
| TC_SCH_01 | Tìm kiếm văn bản còn hiệu lực | 1. Đăng nhập CSRAgent.<br>2. Vào Tra Cứu, tìm từ khóa văn bản v2.0. | Văn bản v2.0 hiển thị bình thường, giao diện sáng rõ. |
| TC_SCH_02 | Tìm kiếm văn bản bị thay thế / hết hạn | 1. Đăng nhập CSRAgent.<br>2. Vào Tra Cứu, tìm văn bản v1.0 (đã bị Replaced). | Văn bản v1.0 hiển thị mờ đi, nền đỏ nhạt. Có nhãn chớp nháy "⚠️ BỊ THAY THẾ". |
| TC_SCH_03 | Mở lịch sử phiên bản | 1. Ấn "Chi tiết" ở 1 văn bản.<br>2. Ấn tab "Lịch sử phiên bản". | Khung Preview chia đôi: Bên trái hiển thị PDF, bên phải liệt kê v1.0 và v2.0 cùng ngày giờ tải lên. |

## 4. Kiểm thử phi chức năng & Bảo mật

| ID | Kịch bản kiểm thử (Test Scenario) | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) |
|---|---|---|---|
| TC_SEC_01 | Reader cố tình gọi API duyệt văn bản | 1. Lấy JWT Token của Reader.<br>2. Gửi POST đến `/api/Documents/1/approve_publish`. | Hệ thống từ chối truy cập (403 Forbidden). ExceptionMiddleware không bị crash. |
| TC_PERF_01 | Hangfire Dashboard phân quyền | 1. Truy cập `/hangfire`. | Dashboard hiển thị danh sách các Job Email đã chạy thành công. (Ghi chú: Nên thêm Auth filter cho Hangfire ở Production). |
