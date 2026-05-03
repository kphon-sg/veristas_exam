# DANH SÁCH CHI TIẾT TÍNH NĂNG HỆ THỐNG VERITASEXAM (Chương 4 - Thesis)

Tài liệu này liệt kê toàn bộ các tính năng đã được triển khai trong hệ thống VeritasExam, phục vụ cho việc mô tả chi tiết trong luận văn.

---

## 1. Hệ thống Xác thực & Phân quyền (Authentication & Authorization)
- **Đăng ký/Đăng nhập đa phương thức:** Hỗ trợ đăng nhập cho cả Giảng viên (Teacher) và Sinh viên (Student).
- **Phân quyền dựa trên vai trò (RBAC):** 
    - **Student:** Chỉ có quyền làm bài, xem kết quả cá nhân và quản lý khóa học tham gia.
    - **Teacher:** Có quyền tạo đề, quản lý lớp học, chấm bài và xem bằng chứng giám thị.
- **Bảo mật:** Sử dụng **Bcrypt** để băm mật khẩu và **JWT** để xác thực các phiên làm việc của API.

## 2. Dành cho Sinh viên (Student Module)
- **Dashboard Tổng quan:** 
    - Hiển thị danh sách bài thi sắp tới (Pending Quizzes).
    - Biểu đồ thống kê kết quả học tập (Điểm trung bình, số bài hoàn thành).
- **Quản lý Khóa học:**
    - Tìm kiếm khóa học theo mã hoặc tên giảng viên.
    - Gửi yêu cầu tham gia khóa học (Join Requests).
    - Xem danh sách các khóa học đã tham gia (My Courses).
- **Lịch thi (Calendar):** Theo dõi thời hạn (Deadline) các bài thi dưới dạng giao diện lịch trực quan.
- **Lịch sử làm bài (Quiz History):** Xem lại kết quả, điểm số và nhận xét của giáo viên cho các bài thi đã nộp.
- **Thông báo (Notifications):** Nhận thông báo khi giáo viên chấm bài hoặc khi được mời vào lớp học mới.

## 3. Hệ thống Giám thị AI (AI Proctoring Module - Tính năng cốt lõi)
- **Thiết lập trước kỳ thi (Pre-Exam Setup):**
    - Kiểm tra thiết bị phần cứng (Webcam).
    - Hướng dẫn vị trí khuôn mặt (Silhouette Guide).
    - Khởi tạo tuần tự (Warmup AI) để đảm bảo ổn định hệ thống.
- **Giám sát thời gian thực (Real-time Monitoring):**
    - **Track 478 Landmark face:** Sử dụng MediaPipe để theo dõi chi tiết tư thế đầu.
    - **Iris Tracking:** Phát hiện cử động mắt nhìn nghiêng/nhìn dọc (Pitch/Yaw).
    - **Nhiều khuôn mặt:** Phát hiện khi có người thứ 2 xuất hiện trong khung hình.
    - **Mất khuôn mặt:** Phát hiện sinh viên rời khỏi vị trí thi.
- **Giám sát Trình duyệt:**
    - Phát hiện chuyển Tab (Tab Switch).
    - Phát hiện mất trọng tâm ứng dụng (App Blur).
- **Ghi nhật ký vi phạm:** Tự động chụp ảnh bằng chứng (Snapshot) và ghi lại mốc thời gian vi phạm chính xác.

## 4. Dành cho Giảng viên (Teacher Module)
- **Quản lý Đề thi (Quiz Creator):**
    - Tạo câu hỏi Trắc nghiệm (Multiple Choice) và Tự luận (Essay).
    - Thiết lập thời gian làm bài, thời hạn nộp bài.
    - Lưu bản nháp (Draft) hoặc Xuất bản (Publish).
- **Quản lý Lớp học:**
    - Tạo lớp học mới, mời sinh viên qua email/student code.
    - Duyệt yêu cầu tham gia lớp học của sinh viên.
- **Chấm bài & Đánh giá (Grading & Review):**
    - Chấm điểm tự động cho các câu hỏi trắc nghiệm.
    - Giao diện chấm bài tự luận trực quan.
    - **Phân tích bằng chứng:** Xem lại dòng thời gian (Timeline) các lần vi phạm được AI ghi nhận.
    - Xem video bằng chứng thi và các ảnh chụp Snapshot tại thời điểm vi phạm.
- **Phân tích Rủi ro:** Hệ thống tự động tính toán "Risk Score" và phân loại trạng thái (NONE, SUSPICIOUS, CHEATING) dựa trên dữ liệu AI.

## 5. Các tính năng bổ trợ kỹ thuật (Technical Features)
- **Video Metadata Fixing:** Đảm bảo video lưu trữ có thể tua (Seekable) để thuận tiện cho việc Audit.
- **Edge AI:** Toàn bộ quá trình xử lý AI diễn ra tại máy khách (Client), giảm tải cho server và bảo vệ quyền riêng tư.
- **Responsive Design:** Giao diện tối ưu cho cả máy tính để bàn và máy tính bảng.
