# DANH MỤC TOÀN BỘ TÍNH NĂNG HỆ THỐNG VERITASEXAM (FULL CATALOG)

Tài liệu này là danh sách đầy đủ 100% các tính năng đã được lập trình trong project VeritasExam.

---

## I. MODULE XÁC THỰC & TÀI KHOẢN (AUTH & ACCOUNT)
1. **Login Portal:** Giao diện đăng nhập phân tách rõ ràng 2 luồng Teacher và Student.
2. **Registration System:** Cho phép đăng ký mới với các trường thông tin chi tiết (Tuổi, Trường học, Lý do sử dụng).
3. **Password Security:** Mã hóa mật khẩu 1 chiều bằng thuật toán Bcrypt.
4. **Session Management:** Duy trì phiên làm việc an toàn bằng JWT (JSON Web Token).
5. **Profile Management:** Xem và chỉnh sửa thông tin cá nhân (Họ tên, Khoa, Số điện thoại).
6. **Logout:** Chức năng đăng xuất an toàn, xóa sạch token và dữ liệu phiên làm việc.

## II. MODULE SINH VIÊN (STUDENT FEATURES)
7. **Personal Dashboard:** Hiển thị lời chào cá nhân hóa, thống kê tiến độ học tập (GPA, số bài đã làm).
8. **Course Discovery:** Tìm kiếm khóa học theo từ khóa, mã môn học, tên giáo viên hoặc tên trường.
9. **Join Request System:** Gửi yêu cầu tham gia lớp học và theo dõi trạng thái (Pending/Accepted).
10. **My Courses View:** Danh sách các lớp học sinh viên đã tham gia chính thức.
11. **Quiz Navigation:** Hiển thị bài thi theo trạng thái (Pending, Overdue, Completed).
12. **Exam Calendar:** Xem lịch thi và thời hạn nộp bài dưới dạng Calendar trực quan.
13. **Activity Logs:** Xem lịch sử các hoạt động đã thực hiện trên hệ thống.
14. **Quiz History & Scores:** Trang tổng hợp kết quả các bài thi đã làm, bao gồm điểm số và thời gian làm bài.
15. **Notifications:** Nhận thông báo thời gian thực về lời mời học, kết quả chấm bài từ giáo viên.

## III. HỆ THỐNG GIÁM THỊ AI (AI PROCTORING & EXAM)
16. **Pre-Exam Stabilization:** Quy trình kiểm tra phần cứng và khởi động model AI tuần tự để ổn định CPU.
17. **Hardware Check:** Tự động liệt kê và cho phép chọn webcam phù hợp.
18. **Face Alignment Guide:** Khung hướng dẫn vị trí mặt (Silhouette) để AI nhận diện tốt nhất.
19. **Head Pose Estimation:** Tracking 3 trục (Yaw, Pitch, Roll) để phát hiện nhìn sang trái/phải, lên/xuống.
20. **Iris Tracking:** Theo dõi con ngươi để phát hiện nhìn nghiêng mà không cần quay đầu.
21. **Multi-face Detection:** Cảnh báo khi có nhiều hơn 1 người xuất hiện trong khung hình.
22. **Face Missing Alert:** Cảnh báo khi thí sinh rời khỏi khung hình quá thời gian quy định.
23. **Browser Integrity Monitor:** Phát hiện và ghi lại hành vi chuyển Tab (Tab Switch) hoặc mất focus ứng dụng (App Blur).
24. **Exam Interface:** Giao diện làm bài chuyên nghiệp với câu hỏi trắc nghiệm và tự luận.
25. **Auto-save & Persistence:** Tự động lưu đáp án và thời gian còn lại vào LocalStorage để chống mất dữ liệu khi gặp sự cố mạng.
26. **Real-time Event Sidebar:** Hiển thị các sự kiện giám thị ngay khi chúng xảy ra để thí sinh tự điều chỉnh hành vi.
27. **Video Evidence Recording:** Ghi lại video phiên thi theo từng đoạn (chunks) và tự động sửa metadata video trước khi upload.

## IV. MODULE GIẢNG VIÊN (TEACHER FEATURES)
28. **Teacher Dashboard:** Thống kê các hoạt động mới nhất của sinh viên và các lớp đang quản lý.
29. **Course Creation:** Tạo lớp học mới với các thông tin về cấp học, tên trường và mô tả.
30. **Enrollment Management:** Phê duyệt hoặc từ chối yêu cầu gia nhập lớp của sinh viên.
31. **Student Invitation:** Mời trực tiếp sinh viên vào lớp bằng Student Code hoặc Email.
32. **Quiz Creator:** Công cụ tạo đề thi hỗ trợ nhiều loại câu hỏi, thiết lập điểm số và thời gian.
33. **Quiz Deployment:** Quản lý trạng thái đề thi (Draft, Published, Expired).
34. **Grading Management:** Danh sách tổng hợp các bài nộp cần chấm điểm.
35. **Manual Grading Tool:** Giao diện cho phép giáo viên chấm điểm trực tiếp các câu hỏi tự luận và để lại Feedback.
36. **Evidence Review (The Watcher):** Xem lại chi tiết từng giây của ca thi, bao gồm video, ảnh Snapshot và Timeline vi phạm.
37. **Risk Scoring Engine:** Hệ thống tự động phân loại mức độ rủi ro (Risk Score) dựa trên thuật toán tích hợp các lần vi phạm AI.

## V. CÁC TÍNH NĂNG HỆ THỐNG (SYSTEM FEATURES)
38. **Responsive UI:** Toàn bộ ứng dụng được thiết kế tối ưu cho máy tính, máy tính bảng và điện thoại (Mobile-responsive).
39. **Global Search:** Tìm kiếm thông tin xuyên suốt các module.
40. **Activity Audit Trail:** Lưu trữ mọi dấu vết hoạt động của cả giáo viên và sinh viên để phục vụ đối soát.
