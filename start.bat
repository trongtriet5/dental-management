@echo off
echo Starting Dental Management System...

echo Starting Django Backend...
start "Django Backend" cmd /k "cd backend && python manage.py runserver"

timeout /t 3 /nobreak > nul

echo Starting React Frontend...
start "React Frontend" cmd /k "cd frontend && npm start"

echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo Admin: http://localhost:8000/admin

pause
