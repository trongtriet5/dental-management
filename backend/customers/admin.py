from django.contrib import admin
from .models import Branch, Customer, Service


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'phone', 'manager', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'address', 'phone', 'email')
    ordering = ('name',)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'email', 'gender', 'age', 'branch', 'created_at')
    list_filter = ('gender', 'branch', 'created_at')
    search_fields = ('first_name', 'last_name', 'phone', 'email')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('first_name', 'last_name', 'phone', 'email', 'gender', 'date_of_birth')
        }),
        ('Địa chỉ', {
            'fields': ('province', 'ward', 'street', 'address_old')
        }),
        ('Thông tin y tế', {
            'fields': ('medical_history', 'allergies', 'notes')
        }),
        ('Thông tin hệ thống', {
            'fields': ('branch', 'services_used', 'created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'duration_minutes', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)
