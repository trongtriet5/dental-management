from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_active', 'created_at')
    list_filter = ('is_active', 'is_staff', 'created_at', 'groups')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')
    ordering = ('-created_at',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional info', {
            'fields': ('phone', 'address', 'specialization')
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional info', {
            'fields': ('phone', 'address', 'specialization')
        }),
    )
