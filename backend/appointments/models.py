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
        ('cancelled', 'Đã huỷ'),
        ('no_show', 'Khách không đến'),
    ]

    APPOINTMENT_TYPE_CHOICES = [
        ('consultation', 'Tham khảo dịch vụ'),
        ('treatment', 'Điều trị'),
        ('follow_up', 'Tái khám'),
        ('emergency', 'Cấp cứu'),
    ]

    # Thông tin khách hàng tạm thời (chỉ để hẹn lịch, không liên kết với hệ thống khách hàng)
    customer_name = models.CharField(max_length=200, verbose_name="Tên khách hàng", default="Khách hàng chưa xác định")
    customer_phone = models.CharField(max_length=20, verbose_name="Số điện thoại khách hàng", default="")
    doctor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'groups__name': 'doctor'},
        verbose_name="Bác sĩ",
    )
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, verbose_name="Chi nhánh")
    services = models.ManyToManyField(
        Service,
        related_name='appointments'
    )
    services_with_quantity = models.JSONField(default=list, blank=True, verbose_name="Dịch vụ với số lượng")

    appointment_date = models.DateField(verbose_name="Ngày hẹn")
    appointment_time = models.TimeField(verbose_name="Giờ bắt đầu")
    end_time = models.TimeField(verbose_name="Giờ kết thúc", null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(verbose_name="Thời gian (phút)")

    appointment_type = models.CharField(
        max_length=20, 
        choices=APPOINTMENT_TYPE_CHOICES, 
        default='consultation', 
        verbose_name="Loại lịch hẹn"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled', verbose_name="Trạng thái")
    is_waitlist = models.BooleanField(default=False, verbose_name="Danh sách chờ")
    waitlist_position = models.PositiveIntegerField(null=True, blank=True, verbose_name="Vị trí trong danh sách chờ")
    notes = models.TextField(blank=True, null=True, verbose_name="Ghi chú")

    # Thông tin hệ thống
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_appointments',
        verbose_name="Tạo bởi",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Lịch hẹn"
        verbose_name_plural = "Lịch hẹn"
        ordering = ['-appointment_date', '-appointment_time']
        unique_together = ['doctor', 'appointment_date', 'appointment_time']

    def __str__(self):
        return f"{self.customer_name} - {self.appointment_date} {self.appointment_time}"

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
    
    def save(self, *args, **kwargs):
        # Tự động tính toán end_time nếu không được cung cấp
        if not self.end_time and self.appointment_time and self.duration_minutes:
            from datetime import datetime, timedelta
            start_datetime = datetime.combine(self.appointment_date, self.appointment_time)
            end_datetime = start_datetime + timedelta(minutes=self.duration_minutes)
            self.end_time = end_datetime.time()
        super().save(*args, **kwargs)
    
    @property
    def calculated_end_time(self):
        """Tính toán giờ kết thúc dựa trên giờ bắt đầu và thời gian"""
        if self.end_time:
            return self.end_time
        
        if self.appointment_time and self.duration_minutes:
            from datetime import datetime, timedelta
            start_datetime = datetime.combine(self.appointment_date, self.appointment_time)
            end_datetime = start_datetime + timedelta(minutes=self.duration_minutes)
            return end_datetime.time()
        
        return None


class AppointmentHistory(models.Model):
    """Lịch sử thay đổi lịch hẹn"""
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='history',
        verbose_name="Lịch hẹn",
    )
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name="Thay đổi bởi")
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

