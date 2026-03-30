# Hướng dẫn chạy dự án Edge AI Exam Monitor

Dự án bao gồm:
1. **Frontend**: React + TypeScript (Giao diện web cho sinh viên và giáo viên).
2. **Backend**: Node.js + Express (Hệ thống quản lý và giám sát).

## 1. Yêu cầu hệ thống
- **Node.js**: v18+ 
- **MySQL**: 8.0+
- **IDE**: Visual Studio Code

## 2. Cách chạy dự án
1. Mở thư mục gốc trong VS Code.
2. Mở Terminal (`Ctrl + ` `).
3. Chạy lệnh cài đặt:
   ```bash
   npm install
   ```
4. Chạy dự án:
   ```bash
   npm run dev
   ```
5. Truy cập: `http://localhost:3000`

## 4. Các tính năng mô phỏng trong Prototype
- **Nhận diện khuôn mặt**: Tự động cảnh báo nếu không thấy mặt hoặc có nhiều mặt.
- **Theo dõi hướng nhìn**: Cảnh báo nếu nhìn ra ngoài màn hình quá lâu.
- **Giám sát hệ thống**: Cảnh báo nếu chuyển tab trình duyệt hoặc thu nhỏ cửa sổ thi.
- **Chỉ số Edge AI**: Biểu đồ mô phỏng hiệu năng xử lý tại máy khách.
