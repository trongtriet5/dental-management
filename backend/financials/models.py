from django.db import models
from django.contrib.auth import get_user_model
from customers.models import Customer, Service, Branch

User = get_user_model()


class Payment(models.Model):
    """Thanh toán"""
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Tiền mặt'),
        ('card', 'Thẻ'),
        ('bank_transfer', 'Chuyển khoản'),
        ('insurance', 'Bảo hiểm'),
        ('other', 'Khác'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Chờ thanh toán'),
        ('paid', 'Đã thanh toán'),
        ('partial', 'Thanh toán một phần'),
        ('refunded', 'Đã hoàn tiền'),
        ('cancelled', 'Đã hủy'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, verbose_name="Khách hàng")
    appointment = models.ForeignKey('appointments.Appointment', on_delete=models.CASCADE, 
                                  null=True, blank=True, verbose_name="Lịch hẹn")
    services = models.ManyToManyField(Service, verbose_name="Dịch vụ", blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, verbose_name="Chi nhánh")
    
    amount = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="Số tiền")
    paid_amount = models.DecimalField(max_digits=10, decimal_places=0, default=0, 
                                    verbose_name="Số tiền đã trả")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, 
                                    verbose_name="Phương thức thanh toán")
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, 
                            default='pending', verbose_name="Trạng thái")
    
    payment_date = models.DateTimeField(blank=True, null=True, verbose_name="Ngày thanh toán")
    notes = models.TextField(blank=True, null=True, verbose_name="Ghi chú")
    
    # Thông tin hệ thống
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, 
                                 related_name='created_payments', verbose_name="Tạo bởi")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Thanh toán"
        verbose_name_plural = "Thanh toán"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.customer.full_name} - {self.amount:,} VNĐ"
    
    @property
    def remaining_amount(self):
        return self.amount - self.paid_amount
    
    @property
    def is_fully_paid(self):
        return self.paid_amount >= self.amount
    
    @property
    def payment_percentage(self):
        if self.amount > 0:
            return (self.paid_amount / self.amount) * 100
        return 0


class Expense(models.Model):
    """Chi phí"""
    EXPENSE_CATEGORY_CHOICES = [
        ('supplies', 'Vật tư'),
        ('equipment', 'Thiết bị'),
        ('rent', 'Thuê mặt bằng'),
        ('utilities', 'Tiện ích'),
        ('salary', 'Lương'),
        ('marketing', 'Marketing'),
        ('other', 'Khác'),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Tiêu đề")
    description = models.TextField(blank=True, null=True, verbose_name="Mô tả")
    amount = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="Số tiền")
    category = models.CharField(max_length=20, choices=EXPENSE_CATEGORY_CHOICES, 
                              verbose_name="Danh mục")
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, verbose_name="Chi nhánh")
    expense_date = models.DateField(verbose_name="Ngày chi")
    
    # Thông tin hệ thống
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, 
                                 related_name='created_expenses', verbose_name="Tạo bởi")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Chi phí"
        verbose_name_plural = "Chi phí"
        ordering = ['-expense_date']
    
    def __str__(self):
        return f"{self.title} - {self.amount:,} VNĐ"


class PaymentHistory(models.Model):
    """Lịch sử thanh toán"""
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, 
                              related_name='payment_history', verbose_name="Thanh toán")
    amount = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="Số tiền")
    payment_method = models.CharField(max_length=20, choices=Payment.PAYMENT_METHOD_CHOICES, 
                                    verbose_name="Phương thức thanh toán")
    notes = models.TextField(blank=True, null=True, verbose_name="Ghi chú")
    
    # Thông tin hệ thống
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, 
                                 verbose_name="Tạo bởi")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Lịch sử thanh toán"
        verbose_name_plural = "Lịch sử thanh toán"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.payment} - {self.amount:,} VNĐ"
