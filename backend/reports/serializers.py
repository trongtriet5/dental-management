from rest_framework import serializers
from .models import ReportTemplate, GeneratedReport, DashboardWidget


class ReportTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    created_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    updated_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    
    class Meta:
        model = ReportTemplate
        fields = ['id', 'name', 'report_type', 'description', 'filters', 'is_active', 
                 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class GeneratedReportSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    start_date = serializers.DateField(format='%d/%m/%Y')
    end_date = serializers.DateField(format='%d/%m/%Y')
    generated_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    
    class Meta:
        model = GeneratedReport
        fields = ['id', 'template', 'template_name', 'title', 'description', 
                 'start_date', 'end_date', 'data', 'summary', 'generated_by', 
                 'generated_by_name', 'generated_at']
        read_only_fields = ['generated_at']


class DashboardWidgetSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    created_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    updated_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    
    class Meta:
        model = DashboardWidget
        fields = ['id', 'name', 'widget_type', 'description', 'config', 'position', 
                 'is_active', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ReportDataSerializer(serializers.Serializer):
    """Serializer for report data generation"""
    report_type = serializers.ChoiceField(choices=ReportTemplate.REPORT_TYPE_CHOICES)
    start_date = serializers.DateField(format='%d/%m/%Y')
    end_date = serializers.DateField(format='%d/%m/%Y')
    branch_id = serializers.IntegerField(required=False, allow_null=True)
    doctor_id = serializers.IntegerField(required=False, allow_null=True)
    service_id = serializers.IntegerField(required=False, allow_null=True)
    group_by = serializers.CharField(required=False, allow_null=True)
    filters = serializers.JSONField(required=False, default=dict)
