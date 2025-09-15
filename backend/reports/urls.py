from django.urls import path
from . import views

urlpatterns = [
    # Report Templates
    path('templates/', views.ReportTemplateListCreateView.as_view(), name='report-template-list-create'),
    path('templates/<int:pk>/', views.ReportTemplateDetailView.as_view(), name='report-template-detail'),
    
    # Generated Reports
    path('generated/', views.GeneratedReportListCreateView.as_view(), name='generated-report-list-create'),
    path('generated/<int:pk>/', views.GeneratedReportDetailView.as_view(), name='generated-report-detail'),
    path('generate/', views.generate_report, name='generate-report'),
    path('generated/<int:pk>/export/xlsx/', views.export_generated_report_excel, name='export-generated-report-excel'),
    path('generated/<int:pk>/export/pdf/', views.export_generated_report_pdf, name='export-generated-report-pdf'),
    
    # Dashboard Widgets
    path('widgets/', views.DashboardWidgetListCreateView.as_view(), name='dashboard-widget-list-create'),
    path('widgets/<int:pk>/', views.DashboardWidgetDetailView.as_view(), name='dashboard-widget-detail'),
    
    # Dashboard
    path('dashboard/', views.dashboard_data, name='dashboard-data'),
]
