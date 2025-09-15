from django.urls import path
from . import views

urlpatterns = [
    # Branches
    path('branches/', views.BranchListCreateView.as_view(), name='branch-list-create'),
    path('branches/<int:pk>/', views.BranchDetailView.as_view(), name='branch-detail'),
    
    # Services
    path('services/', views.ServiceListCreateView.as_view(), name='service-list-create'),
    path('services/<int:pk>/', views.ServiceDetailView.as_view(), name='service-detail'),
    
    # Customers
    path('customers/', views.CustomerListCreateView.as_view(), name='customer-list-create'),
    path('customers/<int:pk>/', views.CustomerDetailView.as_view(), name='customer-detail'),
    path('customers/stats/', views.customer_stats, name='customer-stats'),
    path('customers/search/', views.search_customers, name='search-customers'),
    path('customers/export/xlsx/', views.export_customers_excel, name='export-customers-excel'),
    path('customers/export/pdf/', views.export_customers_pdf, name='export-customers-pdf'),
    path('customers/debug/', views.debug_customers, name='debug-customers'),
    path('customers/fix-payments/', views.fix_payments_view, name='fix-payments'),
]
