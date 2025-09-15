# Hướng dẫn cài đặt hệ thống quản lý nha khoa

## Yêu cầu hệ thống

- Python 3.8+
- Node.js 16+
- npm hoặc yarn
- Git

## Cài đặt Backend (Django)

### 1. Tạo virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 3. Chạy migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Tạo superuser

```bash
python manage.py createsuperuser
```

### 5. Tạo dữ liệu mẫu (tùy chọn)

```bash
python create_sample_data.py
```

### 6. Chạy server

```bash
python manage.py runserver
```

Backend sẽ chạy tại `http://localhost:8000`

## Cài đặt Frontend (React)

### 1. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Chạy development server

```bash
npm start
```

Frontend sẽ chạy tại `http://localhost:3000`

## Truy cập hệ thống

### Admin Panel
- URL: `http://localhost:8000/admin`
- Username: admin (hoặc username bạn đã tạo)
- Password: admin123 (hoặc password bạn đã đặt)

### Ứng dụng chính
- URL: `http://localhost:3000`
- Username: admin
- Password: admin123

## Tài khoản mẫu

Sau khi chạy script tạo dữ liệu mẫu, bạn sẽ có các tài khoản sau:

### Admin
- Username: admin
- Password: admin123
- Role: Quản trị viên

### Doctors
- Username: doctor1, Password: doctor123
- Username: doctor2, Password: doctor123
- Username: doctor3, Password: doctor123

## Cấu trúc dự án

```
dental-management-system/
├── backend/                 # Django backend
│   ├── dental_clinic/      # Main Django project
│   ├── users/              # User management
│   ├── customers/          # Customer management
│   ├── appointments/       # Appointment management
│   ├── financials/         # Financial management
│   ├── reports/            # Reports
│   ├── manage.py
│   ├── requirements.txt
│   └── create_sample_data.py
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── public/
│   └── package.json
├── start.bat              # Windows start script
├── start.sh               # Linux/Mac start script
└── README.md
```

## Troubleshooting

### Lỗi thường gặp

1. **Port đã được sử dụng**
   - Backend: Thay đổi port trong `python manage.py runserver 8001`
   - Frontend: Thay đổi port trong `npm start` hoặc set PORT=3001

2. **Lỗi CORS**
   - Kiểm tra CORS_ALLOWED_ORIGINS trong settings.py
   - Đảm bảo frontend chạy trên port 3000

3. **Lỗi database**
   - Xóa file db.sqlite3 và chạy lại migrations
   - Kiểm tra quyền ghi file trong thư mục backend

4. **Lỗi npm install**
   - Xóa node_modules và package-lock.json
   - Chạy lại `npm install`

### Logs và Debug

- Backend logs: Kiểm tra terminal chạy Django
- Frontend logs: Kiểm tra browser console
- Database: Sử dụng Django admin để xem dữ liệu

## Production Deployment

### Backend
1. Cài đặt PostgreSQL hoặc MySQL
2. Cập nhật DATABASES trong settings.py
3. Cài đặt gunicorn: `pip install gunicorn`
4. Chạy: `gunicorn dental_clinic.wsgi:application`

### Frontend
1. Build: `npm run build`
2. Serve static files với nginx hoặc Apache

### Environment Variables
Tạo file `.env` trong thư mục backend:

```env
SECRET_KEY=your-secret-key
DEBUG=False
DATABASE_URL=postgresql://user:password@localhost/dbname
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

## Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs để xem lỗi cụ thể
2. Đảm bảo đã cài đặt đúng phiên bản Python và Node.js
3. Kiểm tra quyền truy cập file và thư mục
4. Tạo issue trên GitHub repository
