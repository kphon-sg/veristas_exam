# HƯỚNG DẪN HÌNH ẢNH VÀ QUY TRÌNH SỬ DỤNG VERITASEXAM (Chương 4 & 5 - Thesis)

Tài liệu này cung cấp hướng dẫn từng bước về giao diện và gợi ý các vị trí chèn hình ảnh minh họa cho luận văn.

---

## BƯỚC 1: HỆ THỐNG ĐĂNG NHẬP (AUTHENTICATION)
**Giao diện:** Màn hình Portal với 2 cửa sổ dành cho Student và Teacher.
- **Hình ảnh cần chèn:** `Figure 4.1: Login Portal Interface`.
- **Mô tả:** Chụp ảnh màn hình lúc người dùng chọn vai trò "Student" hoặc "Teacher". Nhấn mạnh thiết kế đồng nhất và tính bảo mật cao.

## BƯỚC 2: STUDENT DASHBOARD (GIAO DIỆN CHÍNH SINH VIÊN)
**Giao diện:** Dashboard hiện đại với Sidebar màu tối và các thẻ (Cards) hiển thị chức năng.
- **Tính năng cần nêu:** Pending Quizzes (Các kỳ thi đang chờ), Statistics (Biểu đồ thống kê kết quả).
- **Hình ảnh cần chèn:** `Figure 4.2: Student Dashboard with Academic Statistics`.
- **Chỉ dẫn:** Chụp biểu đồ điểm trung bình và danh sách bài thi để minh họa tính hiệu quả trong quản lý học tập.

## BƯỚC 3: QUY TRÌNH VÀO PHÒNG THI (EXAM ENTRY WORKFLOW)
Đây là phần quan trọng nhất để minh họa tính năng AI.
1. **Tìm & Tham gia khóa học:** Sinh viên tìm mã lớp và gửi yêu cầu.
2. **Pre-Exam Setup:** Giao diện kiểm tra camera và AI.
   - **Hình ảnh cần chèn:** `Figure 4.3: Pre-Exam AI Initialization and Hardware Check`.
   - **Mô tả:** Chụp ảnh lúc camera đang hiện khung Silhouette (vòng cung hướng dẫn vị trí mặt) và thanh Model Load Progress (AI Engine loading).

## BƯỚC 4: GIAO DIỆN LÀM BÀI VÀ GIÁM THỊ (EXAM MONITORING)
**Giao diện:** Câu hỏi hiển thị chính giữa, webcam monitor hiển thị ở góc hoặc sidebar.
- **Tính năng cần nêu:** Đồng hồ đếm ngược, danh sách câu hỏi, Event Log (Nhật ký sự kiện bên phải).
- **Hình ảnh cần chèn:** `Figure 4.4: Real-time Exam Interface with AI Monitoring Active`.
- **Hình ảnh bổ sung (Cực kỳ quan trọng):** Chụp lại các thông báo vi phạm của AI:
    - **`Figure 4.5: AI Detection - Student Looking Away`** (Nhìn ra ngoài).
    - **`Figure 4.6: AI Detection - Face Missing`** (Rời khỏi chỗ).
    - **`Figure 4.7: AI Detection - Tab Switching Notification`** (Chuyển Tab).

## BƯỚC 5: TEACHER DASHBOARD - QUẢN LÝ VÀ CHẤM BÀI
**Giao diện:** Dashboard dành cho giáo viên với danh sách lớp và sinh viên.
- **Tính năng cần nêu:** Chấm bài tự luận và xem báo cáo giám thị.
- **Hình ảnh cần chèn:** `Figure 4.8: Teacher Grading Dashboard and Evidence Review`.
- **Mô tả:** Chụp giao diện Review bài làm, nơi hiển thị Timeline các lần vi phạm. Điều này chứng minh khả năng "Academic Audit" của hệ thống.

## BƯỚC 6: BÁO CÁO VI PHẠM CHI TIẾT (VIOLATION EVIDENCE)
- **Hình ảnh cần chèn:** `Figure 4.9: Comprehensive AI Proctoring Evidence Report`.
- **Mô tả:** Chụp bảng danh sách các vi phạm kèm theo ảnh Snapshot mà AI đã tự động chụp lại. Đây là bằng chứng không thể chối cãi cho tính minh bạch.

---

### TÓM TẮT THỨ TỰ HÌNH ẢNH GỢI Ý CHO LUẬN VĂN:
1. **Chương 4 (Implementation):**
   - 4.1 Login / Portal.
   - 4.2 Database Schema (Sơ đồ ERD - đã có trong file Technical Master).
   - 4.3 Pre-Exam Setup (AI Initialization).
   - 4.4 Exam Interface (Màn hình làm bài).
   - 4.5 AI Detection Logic (Minh họa Yaw/Pitch/Iris).

2. **Chương 5 (Results & Evaluation):**
   - 5.1 Báo cáo thống kê của giáo viên.
   - 5.2 Ảnh chụp bằng chứng vi phạm thực tế (Violation Snapshots).
   - 5.3 Biểu đồ so sánh hiệu suất (Latency của Edge AI vs Server-side AI).

---
**Ghi chú:** Khi bạn chụp ảnh, hãy sử dụng tính năng "Inspect Element" hoặc chỉnh sửa dữ liệu giả (Fake data) để trông chuyên nghiệp hơn (ví dụ: tên sinh viên chuẩn, điểm số đẹp).
