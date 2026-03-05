# Hướng dẫn chạy dự án Edge AI Exam Monitor

Dự án bao gồm 2 phần chính:
1. **Frontend**: React + TypeScript (Giao diện web cho sinh viên).
2. **Backend/Software**: Java Spring Boot (Phần mềm quản lý và giám sát).

## 1. Yêu cầu hệ thống
- **Node.js**: v18+ 
- **Java JDK**: 17+
- **IDE**: Visual Studio Code

## 2. Cách chạy phần Web (Frontend)
1. Mở thư mục gốc trong VS Code.
2. Mở Terminal (`Ctrl + ` `).
3. Chạy lệnh:
   ```bash
   npm install
   npm run dev
   ```
4. Truy cập: `http://localhost:3000`

## 3. Cách chạy phần Software (Java Backend)
1. Cài đặt extension `Extension Pack for Java` trong VS Code.
2. Mở thư mục `software-java`.
3. Tìm file `src/main/java/com/edgeai/monitor/EdgeAiApplication.java`.
4. Nhấn nút **Run** phía trên hàm `main`.
5. Backend sẽ chạy tại: `http://localhost:8080`

## 4. Các tính năng mô phỏng trong Prototype
- **Nhận diện khuôn mặt**: Tự động cảnh báo nếu không thấy mặt hoặc có nhiều mặt.
- **Theo dõi hướng nhìn**: Cảnh báo nếu nhìn ra ngoài màn hình quá lâu.
- **Giám sát hệ thống**: Cảnh báo nếu chuyển tab trình duyệt hoặc thu nhỏ cửa sổ thi.
- **Chỉ số Edge AI**: Biểu đồ mô phỏng hiệu năng xử lý tại máy khách.
