from django.urls import path
from . import views

urlpatterns = [
    # Payments
    path('payments/', views.PaymentListCreateView.as_view(), name='payment-list-create'),
    path('payments/<int:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    path('payments/<int:pk>/add-payment/', views.add_payment, name='add-payment'),
    path('payments/<int:pk>/history/', views.payment_history, name='payment-history'),
    path('payments/export/xlsx/', views.export_payments_excel, name='export-payments-excel'),
    path('payments/export/pdf/', views.export_payments_pdf, name='export-payments-pdf'),
    
    # Expenses
    path('expenses/', views.ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('expenses/<int:pk>/', views.ExpenseDetailView.as_view(), name='expense-detail'),
    path('expenses/export/xlsx/', views.export_expenses_excel, name='export-expenses-excel'),
    path('expenses/export/pdf/', views.export_expenses_pdf, name='export-expenses-pdf'),
    
    # Reports
    path('summary/', views.financial_summary, name='financial-summary'),
    path('revenue-by-service/', views.revenue_by_service, name='revenue-by-service'),
    path('weekly-appointments/', views.weekly_appointments, name='weekly-appointments'),
    path('service-distribution/', views.service_distribution, name='service-distribution'),
    path('stats/', views.financial_stats, name='financial-stats'),
    
    # Utilities
    path('merge-payments/', views.merge_payments, name='merge-payments'),
]
