# HƯỚNG DẪN CHI TIẾT GIAO DIỆN VÀ HÌNH ẢNH MINH HỌA (Dành cho Báo cáo Luận văn)

Tài liệu này hướng dẫn bạn cách giới thiệu từng tính năng, mô tả và chỉ rõ vị trí chèn hình ảnh tương ứng theo luồng sử dụng của App.

---

## PHẦN 1: HỆ THỐNG TRUY CẬP (ACCESS SYSTEM)

### 1.1 Khởi động và Login Portal
- **Mô tả:** Người dùng bắt đầu bằng việc truy cập vào cổng đăng nhập. Hệ thống cung cấp hai lựa chọn vai trò (Student/Teacher) với giao diện tối giản, tập trung vào trải nghiệm người dùng.
- **Hình ảnh chèn vào đây:** `Figure 4.1. Cổng đăng nhập VeritasExam chia theo vai trò`. (Chụp màn hình Login Portal).

### 1.2 Đăng ký thành viên (Comprehensive Registration)
- **Mô tả:** Hệ thống thu thập thông tin chi tiết của người dùng như Tuổi, Trường học, Lý do sử dụng để phân loại dữ liệu học thuật.
- **Hình ảnh chèn vào đây:** `Figure 4.2. Form đăng ký tài khoản với các trường thông tin chi tiết`. (Mở Modal đăng ký và chụp).

---

## PHẦN 2: TRẢI NGHIỆM SINH VIÊN (STUDENT EXPERIENCE)

### 2.1 Student Dashboard & Thống kê học tập
- **Mô tả:** Sau khi đăng nhập, sinh viên được chào đón bằng Dashboard hiển thị các chỉ số học thuật (GPA, số bài hoàn thành) và danh sách các bài thi đang chờ làm (Pending Quizzes).
- **Hình ảnh chèn vào đây:** `Figure 4.3. Dashboard sinh viên với các biểu đồ thống kê kết quả học tập`. (Chụp toàn bộ trang Dashboard sinh viên).

### 2.2 Quản lý Khóa học & Tìm kiếm (Course Management)
- **Mô tả:** Sinh viên có thể tìm kiếm lớp học bằng nhiều bộ lọc (Mã môn, Tên giáo viên). Sau đó gửi yêu cầu tham gia (Join Request) để được giáo viên phê duyệt.
- **Hình ảnh chèn vào đây:** `Figure 4.4. Tính năng tìm kiếm và gửi yêu cầu tham gia lớp học`. (Chụp trang "Join Course" với kết quả tìm kiếm).

### 2.3 Lịch thi trực quan (Exam Calendar)
- **Mô tả:** Toàn bộ thời hạn nộp bài được tích hợp vào một giao diện Calendar, giúp sinh viên quản lý thời gian thi hiệu quả.
- **Hình ảnh chèn vào đây:** `Figure 4.5. Giao diện lịch thi tích hợp hệ thống nhắc lịch`. (Chụp tab "Calendar").

---

## PHẦN 3: LOGIC GIÁM THỊ AI (THE HEART OF PROCTORING)

### 3.1 Thiết lập trước kỳ thi (Pre-Exam Setup)
- **Mô tả:** Trước khi vào bài, sinh viên phải qua bước "Verify". AI sẽ khởi động tuần tự để ổn định hệ thống. Sinh viên phải điều chỉnh mặt vào khung Silhouette Guide.
- **Hình ảnh chèn vào đây:** `Figure 4.6. Giao diện Pre-Exam Setup: Kiểm tra phần cứng và AI`. (Chụp màn hình khi đang ở Silhouette Guide).

### 3.2 Giao diện làm bài & Giám sát thời gian thực
- **Mô tả:** Trong lúc làm bài, AI liên tục theo dõi hướng nhìn (Eye Gaze), tư thế đầu và sự hiện diện của sinh viên. Mọi vi phạm đều được ghi nhật ký (Log) ở Sidebar.
- **Hình ảnh chèn vào đây:** `Figure 4.7. Giao diện thi kết hợp cửa sổ giám sát AI thời gian thực`. (Chụp màn hình lúc đang làm bài thi).

### 3.3 Minh họa các trường hợp AI phát hiện vi phạm
- **Nội dung:** Bạn nên tạo một bảng hoặc danh sách các ảnh chụp AI đang hoạt động:
  1. **Hình ảnh:** `Figure 4.8a. AI phát hiện sinh viên nhìn ra ngoài (Looking Away)`.
  2. **Hình ảnh:** `Figure 4.8b. AI phát hiện rời khỏi vị trí thi (Face Missing)`.
  3. **Hình ảnh:** `Figure 4.8c. Hệ thống phát hiện chuyển Tab trình duyệt (Tab Switch)`.

---

## PHẦN 4: QUẢN TRỊ DÀNH CHO GIẢNG VIÊN (TEACHER MANAGEMENT)

### 4.1 Công cụ tạo đề (Quiz Creator)
- **Mô tả:** Giảng viên có thể xây dựng đề thi linh hoạt với câu hỏi trắc nghiệm và tự luận, thiết lập thời gian và điểm số cho từng câu.
- **Hình ảnh chèn vào đây:** `Figure 4.9. Giao diện công cụ thiết kế đề thi chuyên nghiệp`. (Chụp trang tạo Quiz).

### 4.2 Chấm bài & Đánh giá rủi ro (Grading & Risk Review)
- **Mô tả:** Đây là trang giáo viên xem lại bài nộp. Hệ thống hiển thị video bằng chứng, ảnh Snapshot và Timeline vi phạm do AI ghi lại để giáo viên kết luận cuối cùng.
- **Hình ảnh chèn vào đây:** `Figure 4.10. Hệ thống Review bằng chứng thi và chấm điểm tự luận`. (Chụp trang chấm điểm bài làm cụ thể).

---

## PHẦN 5: CÁC TÍNH NĂNG BỔ TRỢ

### 5.1 Trung tâm thông báo (Notifications)
- **Mô tả:** Hệ thống thông báo thời gian thực giúp sinh viên cập nhật kết quả thi ngay lập tức.
- **Hình ảnh chèn vào đây:** `Figure 4.11. Trung tâm thông báo thời gian thực trên Sidebar`. (Chụp lúc click vào biểu tượng chuông).

### 5.2 Khả năng hiển thị đa thiết bị (Responsive Design)
- **Mô tả:** Minh họa việc App hoạt động hoàn hảo trên các kích thước màn hình khác nhau.
- **Hình ảnh chèn vào đây:** `Figure 4.12. Giao diện ứng dụng tối ưu trên thiết bị di động (Mobile Responsive)`. (Chụp màn hình App ở chế độ di động).
