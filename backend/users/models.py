from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.files.storage import default_storage
import os


def user_avatar_upload_path(instance, filename):
    """Generate upload path for user avatar"""
    ext = filename.split('.')[-1]
    return f'avatars/user_{instance.id}/avatar.{ext}'


class User(AbstractUser):
    """Custom User model for dental clinic management"""
    
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
        return f"{self.get_full_name()} ({self.get_role_display()})"
    
    @property
    def is_doctor(self):
        return self.role == 'doctor'
    
    @property
    def is_manager(self):
        return self.role in ['admin', 'manager']
    
    @property
    def is_receptionist(self):
        return self.role == 'receptionist'
    
    @property
    def avatar_url(self):
        """Get avatar URL or return default avatar"""
        if self.avatar and hasattr(self.avatar, 'url'):
            return self.avatar.url
        return '/static/images/default-avatar.svg'
    
    def get_full_name(self):
        """Return the last_name plus the first_name, with a space in between."""
        full_name = f"{self.last_name} {self.first_name}"
        return full_name.strip()
