from django.db import models
from django.contrib.auth import get_user_model
from customers.models import Branch, Service
from financials.models import Payment, Expense

User = get_user_model()


class ReportTemplate(models.Model):
    """Mẫu báo cáo"""
    REPORT_TYPE_CHOICES = [
        ('revenue', 'Báo cáo doanh thu'),
        ('expense', 'Báo cáo chi phí'),
        ('appointment', 'Báo cáo lịch hẹn'),
        ('customer', 'Báo cáo khách hàng'),
        ('service', 'Báo cáo dịch vụ'),
        ('doctor', 'Báo cáo bác sĩ'),
        ('branch', 'Báo cáo chi nhánh'),
    ]
    
    name = models.CharField(max_length=200, verbose_name="Tên mẫu báo cáo")
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES, 
                                 verbose_name="Loại báo cáo")
    description = models.TextField(blank=True, null=True, verbose_name="Mô tả")
    filters = models.JSONField(default=dict, verbose_name="Bộ lọc")
    is_active = models.BooleanField(default=True, verbose_name="Hoạt động")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, 
                                 verbose_name="Tạo bởi")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Mẫu báo cáo"
        verbose_name_plural = "Mẫu báo cáo"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class GeneratedReport(models.Model):
    """Báo cáo đã tạo"""
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, 
                               verbose_name="Mẫu báo cáo")
    title = models.CharField(max_length=200, verbose_name="Tiêu đề")
    description = models.TextField(blank=True, null=True, verbose_name="Mô tả")
    
    # Thời gian báo cáo
    start_date = models.DateField(verbose_name="Từ ngày")
    end_date = models.DateField(verbose_name="Đến ngày")
    
    # Dữ liệu báo cáo
    data = models.JSONField(default=dict, verbose_name="Dữ liệu báo cáo")
    summary = models.JSONField(default=dict, verbose_name="Tóm tắt")
    
    # Thông tin hệ thống
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, 
                                   verbose_name="Tạo bởi")
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Báo cáo đã tạo"
        verbose_name_plural = "Báo cáo đã tạo"
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.title} - {self.start_date} đến {self.end_date}"


class DashboardWidget(models.Model):
    """Widget cho dashboard"""
    WIDGET_TYPE_CHOICES = [
        ('chart', 'Biểu đồ'),
        ('table', 'Bảng'),
        ('metric', 'Số liệu'),
        ('list', 'Danh sách'),
    ]
    
    name = models.CharField(max_length=200, verbose_name="Tên widget")
    widget_type = models.CharField(max_length=20, choices=WIDGET_TYPE_CHOICES, 
                                 verbose_name="Loại widget")
    description = models.TextField(blank=True, null=True, verbose_name="Mô tả")
    config = models.JSONField(default=dict, verbose_name="Cấu hình")
    position = models.PositiveIntegerField(default=0, verbose_name="Vị trí")
    is_active = models.BooleanField(default=True, verbose_name="Hoạt động")
    
    # Thông tin hệ thống
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, 
                                 verbose_name="Tạo bởi")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Widget Dashboard"
        verbose_name_plural = "Widget Dashboard"
        ordering = ['position', 'name']
    
    def __str__(self):
        return self.name
