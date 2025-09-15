from django.contrib import admin
from .models import ReportTemplate, GeneratedReport, DashboardWidget


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'report_type', 'is_active', 'created_by', 'created_at')
    list_filter = ('report_type', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'template', 'start_date', 'end_date', 'generated_by', 'generated_at')
    list_filter = ('template__report_type', 'start_date', 'end_date', 'generated_at')
    search_fields = ('title', 'description')
    ordering = ('-generated_at',)
    readonly_fields = ('generated_at',)


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ('name', 'widget_type', 'position', 'is_active', 'created_by', 'created_at')
    list_filter = ('widget_type', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('position', 'name')
    readonly_fields = ('created_at', 'updated_at')
