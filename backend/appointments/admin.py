from django.contrib import admin
from .models import Appointment, AppointmentHistory


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('customer', 'doctor', 'appointment_date', 'appointment_time', 
                   'get_services_display', 'status', 'branch', 'created_at')

    def get_services_display(self, obj):
        return ", ".join([service.name for service in obj.services.all()])
    get_services_display.short_description = "Dịch vụ"
    list_filter = ('status', 'appointment_date', 'branch', 'doctor', 'created_at')
    search_fields = ('customer__first_name', 'customer__last_name', 'customer__phone', 
                    'doctor__first_name', 'doctor__last_name')
    ordering = ('-appointment_date', '-appointment_time')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Thông tin lịch hẹn', {
            'fields': ('customer', 'doctor', 'branch', 'services', 'appointment_date', 
                      'appointment_time', 'duration_minutes')
        }),
        ('Trạng thái', {
            'fields': ('status', 'notes')
        }),
        ('Thông tin hệ thống', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(AppointmentHistory)
class AppointmentHistoryAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'change_type', 'changed_by', 'created_at')
    list_filter = ('change_type', 'created_at')
    search_fields = ('appointment__customer__first_name', 'appointment__customer__last_name',
                    'changed_by__first_name', 'changed_by__last_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
