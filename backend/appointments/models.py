from django.db import models
from django.contrib.auth import get_user_model
from customers.models import Customer, Branch, Service

User = get_user_model()


class Appointment(models.Model):
    """Lịch hẹn"""
    STATUS_CHOICES = [
        ('scheduled', 'Chờ xác nhận'),
        ('confirmed', 'Đã xác nhận'),
        ('arrived', 'Khách đã đến'),
        ('in_progress', 'Đang điều trị'),
        ('completed', 'Hoàn thành'),
        ('cancelled', 'Đã hủy'),
        ('no_show', 'Không đến'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, verbose_name="Khách hàng")
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'doctor'}, 
                             verbose_name="Bác sĩ")
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, verbose_name="Chi nhánh")
    services = models.ManyToManyField(
        Service,
        related_name='appointments'
    )
    
    appointment_date = models.DateField(verbose_name="Ngày hẹn")
    appointment_time = models.TimeField(verbose_name="Giờ hẹn")
    duration_minutes = models.PositiveIntegerField(verbose_name="Thời gian (phút)")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled', 
                            verbose_name="Trạng thái")
    notes = models.TextField(blank=True, null=True, verbose_name="Ghi chú")
    
    # Thông tin hệ thống
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, 
                                 related_name='created_appointments', verbose_name="Tạo bởi")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Lịch hẹn"
        verbose_name_plural = "Lịch hẹn"
        ordering = ['-appointment_date', '-appointment_time']
        unique_together = ['doctor', 'appointment_date', 'appointment_time']
    
    def __str__(self):
        return f"{self.customer.full_name} - {self.appointment_date} {self.appointment_time}"
    
    @property
    def datetime(self):
        from django.utils import timezone
        from datetime import datetime
        return timezone.make_aware(
            datetime.combine(self.appointment_date, self.appointment_time)
        )
    
    @property
    def is_past(self):
        from django.utils import timezone
        return self.datetime < timezone.now()
    
    @property
    def is_today(self):
        from django.utils import timezone
        return self.appointment_date == timezone.now().date()


class AppointmentHistory(models.Model):
    """Lịch sử thay đổi lịch hẹn"""
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, 
                                  related_name='history', verbose_name="Lịch hẹn")
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, 
                                 verbose_name="Thay đổi bởi")
    change_type = models.CharField(max_length=50, verbose_name="Loại thay đổi")
    old_value = models.TextField(blank=True, null=True, verbose_name="Giá trị cũ")
    new_value = models.TextField(blank=True, null=True, verbose_name="Giá trị mới")
    notes = models.TextField(blank=True, null=True, verbose_name="Ghi chú")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Lịch sử lịch hẹn"
        verbose_name_plural = "Lịch sử lịch hẹn"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.appointment} - {self.change_type}"
