from django.contrib import admin
from .models import Payment, Expense


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('customer', 'get_services', 'amount', 'payment_method', 'branch', 'created_at')
    list_filter = ('payment_method', 'branch', 'created_at')
    search_fields = ('customer__first_name', 'customer__last_name', 'customer__phone')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('services',)
    
    def get_services(self, obj):
        return ', '.join([service.name for service in obj.services.all()])
    get_services.short_description = 'Dịch vụ'
    
    fieldsets = (
        ('Thông tin thanh toán', {
            'fields': ('customer', 'services', 'branch', 'amount')
        }),
        ('Phương thức thanh toán', {
            'fields': ('payment_method', 'notes')
        }),
        ('Thông tin hệ thống', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'amount', 'category', 'branch', 'expense_date', 'created_at')
    list_filter = ('category', 'branch', 'expense_date', 'created_at')
    search_fields = ('title', 'description')
    ordering = ('-expense_date',)
    readonly_fields = ('created_at', 'updated_at')


