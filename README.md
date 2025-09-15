# Hệ thống quản lý lịch hẹn nha khoa

Hệ thống quản lý toàn diện cho phòng khám nha khoa với các chức năng quản lý khách hàng, lịch hẹn, thu chi và báo cáo thống kê.

## Tính năng chính

### 🔧 Quản lý khách hàng
- Thêm, sửa, xóa thông tin khách hàng
- Quản lý thông tin y tế (tiền sử bệnh, dị ứng)
- Phân loại theo chi nhánh
- Tìm kiếm và lọc khách hàng

### 📅 Quản lý lịch hẹn
- Đặt lịch hẹn cho khách hàng
- Chọn bác sĩ, chi nhánh, dịch vụ
- Quản lý trạng thái lịch hẹn
- Lịch hẹn hôm nay và sắp tới
- Lịch sử thay đổi lịch hẹn

### 💰 Quản lý thu chi
- Quản lý thanh toán của khách hàng
- Theo dõi thanh toán một phần
- Quản lý chi phí hoạt động
- Lịch sử thanh toán

### 📊 Báo cáo thống kê
- Báo cáo doanh thu theo dịch vụ, bác sĩ, chi nhánh
- Thống kê lịch hẹn và khách hàng
- Dashboard tổng quan
- Xuất báo cáo tùy chỉnh

### 👥 Phân quyền người dùng
- Quản trị viên
- Quản lý
- Nhân viên
- Bác sĩ

## Công nghệ sử dụng

### Backend
- **Django 4.2.7** - Web framework
- **Django REST Framework** - API framework
- **SQLite** - Database (có thể chuyển sang PostgreSQL/MySQL)
- **JWT** - Authentication
- **Django CORS Headers** - CORS handling

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI** - UI components
- **React Router** - Routing
- **Axios** - HTTP client
- **Recharts** - Charts và graphs

### Database
- **SQLite** (development)
- **Firebase** (production - tùy chọn)

## Cài đặt và chạy

### Yêu cầu hệ thống
- Python 3.8+
- Node.js 16+
- npm hoặc yarn

### Backend Setup

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Tạo virtual environment:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. Cài đặt dependencies:
```bash
pip install -r requirements.txt
```

4. Chạy migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Tạo superuser:
```bash
python manage.py createsuperuser
```

6. Chạy server:
```bash
python manage.py runserver
```

Backend sẽ chạy tại `http://localhost:8000`

### Frontend Setup

1. Di chuyển vào thư mục frontend:
```bash
cd frontend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy development server:
```bash
npm start
```

Frontend sẽ chạy tại `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/token/` - Đăng nhập
- `POST /api/auth/token/refresh/` - Làm mới token

### Users
- `GET /api/users/` - Danh sách người dùng
- `GET /api/users/profile/` - Thông tin profile
- `GET /api/users/doctors/` - Danh sách bác sĩ

### Customers
- `GET /api/customers/customers/` - Danh sách khách hàng
- `POST /api/customers/customers/` - Tạo khách hàng mới
- `GET /api/customers/customers/{id}/` - Chi tiết khách hàng
- `PUT /api/customers/customers/{id}/` - Cập nhật khách hàng
- `DELETE /api/customers/customers/{id}/` - Xóa khách hàng

### Appointments
- `GET /api/appointments/appointments/` - Danh sách lịch hẹn
- `POST /api/appointments/appointments/` - Tạo lịch hẹn mới
- `GET /api/appointments/appointments/today/` - Lịch hẹn hôm nay
- `GET /api/appointments/appointments/calendar/` - Lịch hẹn cho calendar

### Financials
- `GET /api/financials/payments/` - Danh sách thanh toán
- `POST /api/financials/payments/` - Tạo thanh toán mới
- `GET /api/financials/summary/` - Tóm tắt tài chính

### Reports
- `GET /api/reports/dashboard/` - Dữ liệu dashboard
- `POST /api/reports/generate/` - Tạo báo cáo

## Cấu trúc dự án

```
dental-management-system/
├── backend/
│   ├── dental_clinic/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── users/
│   ├── customers/
│   ├── appointments/
│   ├── financials/
│   ├── reports/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   └── package.json
└── README.md
```

## Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Liên hệ

Dự án được phát triển bởi [Tên của bạn] - [email@example.com]

Project Link: [https://github.com/USERNAME/dental-management-system](https://github.com/USERNAME/dental-management-system)
