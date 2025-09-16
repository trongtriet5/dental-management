from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Branch(models.Model):
    """Chi nhánh nha khoa"""
    name = models.CharField(max_length=200, verbose_name="Tên chi nhánh")
    address = models.TextField(verbose_name="Địa chỉ")
    phone = models.CharField(max_length=15, verbose_name="Số điện thoại")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_branches',
        verbose_name="Quản lý",
    )
    is_active = models.BooleanField(default=True, verbose_name="Hoạt động")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Chi nhánh"
        verbose_name_plural = "Chi nhánh"
        ordering = ['name']

    def __str__(self):
        return self.name


class Customer(models.Model):
    """Khách hàng/Bệnh nhân"""
    GENDER_CHOICES = [
        ('male', 'Nam'),
        ('female', 'Nữ'),
        ('other', 'Khác'),
    ]

    STATUS_CHOICES = [
        ('active', 'Đang CS'),
        ('inactive', 'Ngừng CS'),
        ('lead', 'Tiềm năng'),
    ]

    # Thông tin cơ bản
    first_name = models.CharField(max_length=100, verbose_name="Tên")
    last_name = models.CharField(max_length=100, verbose_name="Họ")
    phone = models.CharField(max_length=15, unique=True, verbose_name="Số điện thoại")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, verbose_name="Giới tính")
    date_of_birth = models.DateField(verbose_name="Ngày sinh")
    province = models.ForeignKey('locations.Province', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Tỉnh/Thành")
    ward = models.ForeignKey('locations.Ward', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Phường/Xã")
    street = models.CharField(max_length=255, blank=True, null=True, verbose_name="Số nhà, tên đường")
    address_old = models.TextField(verbose_name="Địa chỉ cũ", blank=True, null=True)

    # Thông tin y tế
    medical_history = models.TextField(blank=True, null=True, verbose_name="Tiền sử bệnh")
    allergies = models.TextField(blank=True, null=True, verbose_name="Dị ứng")
    notes = models.TextField(blank=True, null=True, verbose_name="Ghi chú")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name="Trạng thái")

    # Thông tin hệ thống
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, verbose_name="Chi nhánh")
    services_used = models.ManyToManyField('Service', blank=True, related_name='customers', verbose_name="Dịch vụ sử dụng")
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_customers',
        verbose_name="Tạo bởi",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Khách hàng"
        verbose_name_plural = "Khách hàng"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.last_name} {self.first_name}"

    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name}"

    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )


class Service(models.Model):
    """Dịch vụ nha khoa"""
    name = models.CharField(max_length=255, verbose_name="Tên dịch vụ")
    description = models.TextField(blank=True, null=True, verbose_name="Mô tả")
    level = models.CharField(max_length=50, default='Standard', verbose_name="Cấp độ")
    level_number = models.PositiveSmallIntegerField(default=1, verbose_name="Cấp độ số")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Giá")
    duration_minutes = models.PositiveIntegerField(default=60, verbose_name="Thời gian (phút)")
    is_active = models.BooleanField(default=True, verbose_name="Hoạt động")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Dịch vụ"
        verbose_name_plural = "Dịch vụ"
        ordering = ['name', 'level_number']

    def __str__(self):
        return f"{self.name} - Cấp {self.level_number} - {self.price:,} VNĐ"

