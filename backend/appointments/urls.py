from django.urls import path
from . import views

urlpatterns = [
    # Appointments
    path('appointments/', views.AppointmentListCreateView.as_view(), name='appointment-list-create'),
    path('appointments/<int:pk>/', views.AppointmentDetailView.as_view(), name='appointment-detail'),
    path('appointments/calendar/', views.appointment_calendar, name='appointment-calendar'),
    path('appointments/today/', views.today_appointments, name='today-appointments'),
    path('appointments/upcoming/', views.upcoming_appointments, name='upcoming-appointments'),
    path('appointments/<int:pk>/status/', views.update_appointment_status, name='update-appointment-status'),
    path('appointments/<int:pk>/history/', views.appointment_history, name='appointment-history'),
    path('appointments/check-availability/', views.check_appointment_availability, name='check-appointment-availability'),
    path('appointments/stats/', views.appointment_stats, name='appointment-stats'),
    path('appointments/export/xlsx/', views.export_appointments_excel, name='export-appointments-excel'),
    path('appointments/export/pdf/', views.export_appointments_pdf, name='export-appointments-pdf'),
]
