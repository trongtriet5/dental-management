from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, date, timedelta
from .models import ReportTemplate, GeneratedReport, DashboardWidget
from .serializers import (ReportTemplateSerializer, GeneratedReportSerializer, 
                         DashboardWidgetSerializer, ReportDataSerializer)
from customers.models import Customer, Service, Branch
from appointments.models import Appointment
from appointments.serializers import AppointmentListSerializer
from financials.models import Payment, Expense
from financials.serializers import PaymentListSerializer
from users.models import User
from django.http import HttpResponse
import io
from openpyxl import Workbook
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4


class ReportTemplateListCreateView(generics.ListCreateAPIView):
    """List and create report templates"""
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['report_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class ReportTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete report template"""
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]


class GeneratedReportListCreateView(generics.ListCreateAPIView):
    """List and create generated reports"""
    queryset = GeneratedReport.objects.all()
    serializer_class = GeneratedReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['template__report_type', 'start_date', 'end_date']
    search_fields = ['title', 'description']
    ordering_fields = ['generated_at', 'start_date', 'end_date']
    ordering = ['-generated_at']


class GeneratedReportDetailView(generics.RetrieveDestroyAPIView):
    """Retrieve or delete generated report"""
    queryset = GeneratedReport.objects.all()
    serializer_class = GeneratedReportSerializer
    permission_classes = [permissions.IsAuthenticated]


class DashboardWidgetListCreateView(generics.ListCreateAPIView):
    """List and create dashboard widgets"""
    queryset = DashboardWidget.objects.all()
    serializer_class = DashboardWidgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['widget_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['position', 'name', 'created_at']
    ordering = ['position', 'name']


class DashboardWidgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete dashboard widget"""
    queryset = DashboardWidget.objects.all()
    serializer_class = DashboardWidgetSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_report(request):
    """Generate report based on parameters"""
    serializer = ReportDataSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    report_type = data['report_type']
    start_date = data['start_date']
    end_date = data['end_date']
    branch_id = data.get('branch_id')
    doctor_id = data.get('doctor_id')
    service_id = data.get('service_id')
    group_by = data.get('group_by')
    
    # Build base queryset
    base_filters = Q(created_at__date__range=[start_date, end_date])
    if branch_id:
        base_filters &= Q(branch_id=branch_id)
    if doctor_id:
        base_filters &= Q(doctor_id=doctor_id)
    if service_id:
        base_filters &= Q(service_id=service_id)
    
    report_data = {}
    
    if report_type == 'revenue':
        report_data = generate_revenue_report(base_filters, group_by)
    elif report_type == 'expense':
        report_data = generate_expense_report(base_filters, group_by)
    elif report_type == 'appointment':
        report_data = generate_appointment_report(base_filters, group_by)
    elif report_type == 'customer':
        report_data = generate_customer_report(base_filters, group_by)
    elif report_type == 'service':
        report_data = generate_service_report(base_filters, group_by)
    elif report_type == 'doctor':
        report_data = generate_doctor_report(base_filters, group_by)
    elif report_type == 'branch':
        report_data = generate_branch_report(base_filters, group_by)
    
    # Create generated report record
    generated_report = GeneratedReport.objects.create(
        template=None,  # Can be linked to template if needed
        title=f"{report_type.title()} Report - {start_date} to {end_date}",
        description=f"Generated report for {report_type} from {start_date} to {end_date}",
        start_date=start_date,
        end_date=end_date,
        data=report_data,
        summary=generate_summary(report_data),
        generated_by=request.user
    )
    
    return Response(GeneratedReportSerializer(generated_report).data)


def generate_revenue_report(filters, group_by):
    """Generate revenue report"""
    payments = Payment.objects.filter(filters)
    
    if group_by == 'service':
        data = payments.values('service__name').annotate(
            total_amount=Sum('amount'),
            paid_amount=Sum('paid_amount'),
            count=Count('id')
        ).order_by('-total_amount')
    elif group_by == 'branch':
        data = payments.values('branch__name').annotate(
            total_amount=Sum('amount'),
            paid_amount=Sum('paid_amount'),
            count=Count('id')
        ).order_by('-total_amount')
    elif group_by == 'doctor':
        data = payments.values('appointment__doctor__last_name', 'appointment__doctor__first_name').annotate(
            total_amount=Sum('amount'),
            paid_amount=Sum('paid_amount'),
            count=Count('id')
        ).order_by('-total_amount')
    else:
        data = [{
            'total_amount': payments.aggregate(total=Sum('amount'))['total'] or 0,
            'paid_amount': payments.aggregate(total=Sum('paid_amount'))['total'] or 0,
            'count': payments.count()
        }]
    
    return list(data)


def generate_expense_report(filters, group_by):
    """Generate expense report"""
    expenses = Expense.objects.filter(filters)
    
    if group_by == 'category':
        data = expenses.values('category').annotate(
            total_amount=Sum('amount'),
            count=Count('id')
        ).order_by('-total_amount')
    elif group_by == 'branch':
        data = expenses.values('branch__name').annotate(
            total_amount=Sum('amount'),
            count=Count('id')
        ).order_by('-total_amount')
    else:
        data = [{
            'total_amount': expenses.aggregate(total=Sum('amount'))['total'] or 0,
            'count': expenses.count()
        }]
    
    return list(data)


def generate_appointment_report(filters, group_by):
    """Generate appointment report"""
    appointments = Appointment.objects.filter(filters)
    
    if group_by == 'status':
        data = appointments.values('status').annotate(count=Count('id')).order_by('-count')
    elif group_by == 'doctor':
        data = appointments.values('doctor__last_name', 'doctor__first_name').annotate(
            count=Count('id')
        ).order_by('-count')
    elif group_by == 'branch':
        data = appointments.values('branch__name').annotate(count=Count('id')).order_by('-count')
    else:
        data = [{'count': appointments.count()}]
    
    return list(data)


def generate_customer_report(filters, group_by):
    """Generate customer report"""
    customers = Customer.objects.filter(filters)
    
    if group_by == 'gender':
        data = customers.values('gender').annotate(count=Count('id')).order_by('-count')
    elif group_by == 'branch':
        data = customers.values('branch__name').annotate(count=Count('id')).order_by('-count')
    else:
        data = [{'count': customers.count()}]
    
    return list(data)


def generate_service_report(filters, group_by):
    """Generate service report"""
    # This would need to be adapted based on how services are tracked
    services = Service.objects.all()
    data = []
    
    for service in services:
        appointments = Appointment.objects.filter(service=service, **filters)
        payments = Payment.objects.filter(service=service, **filters)
        
        data.append({
            'service_name': service.name,
            'appointment_count': appointments.count(),
            'total_revenue': payments.aggregate(total=Sum('amount'))['total'] or 0,
            'paid_revenue': payments.aggregate(total=Sum('paid_amount'))['total'] or 0
        })
    
    return data


def generate_doctor_report(filters, group_by):
    """Generate doctor report"""
    doctors = User.objects.filter(role='doctor')
    data = []
    
    for doctor in doctors:
        appointments = Appointment.objects.filter(doctor=doctor, **filters)
        payments = Payment.objects.filter(appointment__doctor=doctor, **filters)
        
        data.append({
            'doctor_name': doctor.get_full_name(),
            'appointment_count': appointments.count(),
            'total_revenue': payments.aggregate(total=Sum('amount'))['total'] or 0,
            'paid_revenue': payments.aggregate(total=Sum('paid_amount'))['total'] or 0
        })
    
    return data


def generate_branch_report(filters, group_by):
    """Generate branch report"""
    branches = Branch.objects.all()
    data = []
    
    for branch in branches:
        customers = Customer.objects.filter(branch=branch, **filters)
        appointments = Appointment.objects.filter(branch=branch, **filters)
        payments = Payment.objects.filter(branch=branch, **filters)
        expenses = Expense.objects.filter(branch=branch, **filters)
        
        data.append({
            'branch_name': branch.name,
            'customer_count': customers.count(),
            'appointment_count': appointments.count(),
            'total_revenue': payments.aggregate(total=Sum('amount'))['total'] or 0,
            'paid_revenue': payments.aggregate(total=Sum('paid_amount'))['total'] or 0,
            'total_expenses': expenses.aggregate(total=Sum('amount'))['total'] or 0
        })
    
    return data


def generate_summary(report_data):
    """Generate summary from report data"""
    if not report_data:
        return {}
    
    if isinstance(report_data, list) and len(report_data) > 0:
        if 'total_amount' in report_data[0]:
            total_amount = sum(item.get('total_amount', 0) for item in report_data)
            paid_amount = sum(item.get('paid_amount', 0) for item in report_data)
            return {
                'total_amount': total_amount,
                'paid_amount': paid_amount,
                'pending_amount': total_amount - paid_amount,
                'item_count': len(report_data)
            }
        elif 'count' in report_data[0]:
            total_count = sum(item.get('count', 0) for item in report_data)
            return {
                'total_count': total_count,
                'item_count': len(report_data)
            }
    
    return {'item_count': len(report_data) if isinstance(report_data, list) else 1}


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_data(request):
    """Get dashboard data"""
    today = timezone.now().date()
    this_month = today.replace(day=1)
    
    # Basic stats
    stats = {
        'total_customers': Customer.objects.count(),
        'total_appointments': Appointment.objects.count(),
        'today_appointments': Appointment.objects.filter(appointment_date=today).count(),
        'this_month_revenue': Payment.objects.filter(
            created_at__date__gte=this_month
        ).aggregate(total=Sum('amount'))['total'] or 0,
        'this_month_expenses': Expense.objects.filter(
            expense_date__gte=this_month
        ).aggregate(total=Sum('amount'))['total'] or 0,
        'pending_payments': Payment.objects.filter(
            status__in=['pending', 'partial']
        ).count(),
    }
    
    # Recent activities
    recent_appointments = Appointment.objects.filter(
        appointment_date__gte=today
    ).order_by('appointment_date', 'appointment_time')[:5]
    
    recent_payments = Payment.objects.filter(
        status='paid'
    ).order_by('-payment_date')[:5]
    
    return Response({
        'stats': stats,
        'recent_appointments': AppointmentListSerializer(recent_appointments, many=True).data,
        'recent_payments': PaymentListSerializer(recent_payments, many=True).data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_generated_report_excel(request, pk):
    try:
        report = GeneratedReport.objects.get(pk=pk)
    except GeneratedReport.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

    wb = Workbook()
    ws = wb.active
    ws.title = 'Report'
    ws.append([report.title])
    ws.append([f"Từ ngày", str(report.start_date), "Đến ngày", str(report.end_date)])
    ws.append([])

    if isinstance(report.data, list) and report.data:
        # Write headers from keys
        headers = list(report.data[0].keys())
        ws.append(headers)
        for item in report.data:
            ws.append([item.get(h, '') for h in headers])
    else:
        ws.append(['data'])
        ws.append([str(report.data)])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename=report_{pk}.xlsx'
    return response


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_generated_report_pdf(request, pk):
    try:
        report = GeneratedReport.objects.get(pk=pk)
    except GeneratedReport.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 50
    p.setFont('Helvetica-Bold', 14)
    p.drawString(50, y, report.title)
    y -= 20
    p.setFont('Helvetica', 10)
    p.drawString(50, y, f"Từ {report.start_date} đến {report.end_date}")
    y -= 30

    if isinstance(report.data, list):
        # headers
        if report.data:
            headers = list(report.data[0].keys())
            p.setFont('Helvetica-Bold', 10)
            p.drawString(50, y, ' | '.join(headers))
            y -= 15
            p.setFont('Helvetica', 10)
            for row in report.data:
                values = [str(row.get(h, '')) for h in headers]
                p.drawString(50, y, ' | '.join(values))
                y -= 14
                if y < 50:
                    p.showPage()
                    y = height - 50
    else:
        p.drawString(50, y, str(report.data))

    p.showPage()
    p.save()
    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename=report_{pk}.pdf'
    return response
