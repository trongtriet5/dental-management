from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.files.storage import default_storage


def user_avatar_upload_path(instance, filename):
    """Generate upload path for user avatar"""
    ext = filename.split('.')[-1]
    return f'avatars/user_{instance.id}/avatar.{ext}'


class User(AbstractUser):
    """Custom User model for dental clinic management.
    IMPORTANT: Use Django Groups (admin/auth/group) for roles.
    The `role` field remains only for backward compatibility.
    """

    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Quản lý'),
        ('doctor', 'Bác sĩ'),
        ('creceptionist', 'Nhân viên tư vấn & Lễ tân'),
    ]

    GENDER_CHOICES = [
        ('male', 'Nam'),
        ('female', 'Nữ'),
        ('other', 'Khác'),
    ]

    # Deprecated: prefer using Groups for roles
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='receptionist')
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True, null=True)  # For doctors
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    avatar = models.ImageField(upload_to=user_avatar_upload_path, blank=True, null=True)
    bio = models.TextField(blank=True, null=True, help_text="Giới thiệu bản thân")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        primary_role = self.primary_role
        return f"{self.get_full_name()} ({primary_role or 'User'})"

    @property
    def is_doctor(self):
        return self.groups.filter(name='doctor').exists()

    @property
    def is_manager(self):
        return self.groups.filter(name__in=['admin', 'manager']).exists()

    @property
    def is_receptionist(self):
        return self.groups.filter(name__in=['receptionist', 'creceptionist']).exists()

    @property
    def avatar_url(self):
        if self.avatar and hasattr(self.avatar, 'url'):
            return self.avatar.url
        return '/static/images/default-avatar.svg'

    @property
    def primary_role(self):
        priorities = ['admin', 'manager', 'doctor', 'creceptionist', 'receptionist']
        names = list(self.groups.values_list('name', flat=True))
        for name in priorities:
            if name in names:
                return name
        return None

    def delete_old_avatar(self):
        try:
            if self.avatar and default_storage.exists(self.avatar.name):
                default_storage.delete(self.avatar.name)
        except Exception:
            pass

    def get_full_name(self):
        full_name = f"{self.last_name} {self.first_name}"
        return full_name.strip()

