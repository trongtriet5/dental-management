from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, date, timedelta
from .models import Appointment, AppointmentHistory
from .serializers import (AppointmentSerializer, AppointmentListSerializer, 
                         AppointmentHistorySerializer,
                         AppointmentCalendarSerializer)
from django.http import HttpResponse
import io
from openpyxl import Workbook
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4


def parse_date_string(date_str):
    """Parse date string from DD/MM/YYYY or YYYY-MM-DD format to date object"""
    if not date_str:
        return None
    
    try:
        # Try DD/MM/YYYY format first
        return datetime.strptime(date_str, '%d/%m/%Y').date()
    except ValueError:
        try:
            # Try YYYY-MM-DD format
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return None


class AppointmentListCreateView(generics.ListCreateAPIView):
    """List and create appointments"""
    queryset = Appointment.objects.prefetch_related('services').all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'doctor', 'branch', 'appointment_date', 'appointment_time']
    search_fields = ['customer_name', 'customer_phone']
    ordering_fields = ['appointment_date', 'appointment_time', 'created_at']
    ordering = ['-appointment_date', '-appointment_time']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Handle custom date filtering for DD/MM/YYYY format
        appointment_date = self.request.GET.get('appointment_date')
        if appointment_date:
            parsed_date = parse_date_string(appointment_date)
            if parsed_date:
                queryset = queryset.filter(appointment_date=parsed_date)
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AppointmentListSerializer
        return AppointmentSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save()



class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete appointment"""
    queryset = Appointment.objects.prefetch_related('services').all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        serializer.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def appointment_calendar(request):
    """Get appointments for calendar view"""
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    doctor_id = request.GET.get('doctor_id')
    branch_id = request.GET.get('branch_id')
    
    # Validate date range: end_date must be greater than or equal to start_date
    if start_date and end_date:
        parsed_start_date = parse_date_string(start_date)
        parsed_end_date = parse_date_string(end_date)
        
        if parsed_start_date and parsed_end_date and parsed_end_date < parsed_start_date:
            return Response(
                {'error': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    queryset = Appointment.objects.prefetch_related('services').all()
    
    # If no date filters, default to a 7-day window centered on today to avoid returning too many records
    if start_date or end_date:
        if start_date:
            parsed_start_date = parse_date_string(start_date)
            if parsed_start_date:
                queryset = queryset.filter(appointment_date__gte=parsed_start_date)
        if end_date:
            parsed_end_date = parse_date_string(end_date)
            if parsed_end_date:
                queryset = queryset.filter(appointment_date__lte=parsed_end_date)
    else:
        today = timezone.now().date()
        queryset = queryset.filter(appointment_date__range=[today, today + timedelta(days=7)])
    if doctor_id:
        queryset = queryset.filter(doctor_id=doctor_id)
    if branch_id:
        queryset = queryset.filter(branch_id=branch_id)
    
    serializer = AppointmentCalendarSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def today_appointments(request):
    """Get today's appointments"""
    today = timezone.now().date()
    appointments = Appointment.objects.prefetch_related('services').filter(
        appointment_date=today,
        status__in=['scheduled', 'confirmed', 'arrived', 'in_progress']
    ).order_by('appointment_time')
    serializer = AppointmentListSerializer(appointments, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def upcoming_appointments(request):
    """Get upcoming appointments"""
    today = timezone.now().date()
    appointments = Appointment.objects.prefetch_related('services').filter(
        appointment_date__gte=today,
        status__in=['scheduled', 'confirmed', 'arrived', 'in_progress']
    ).order_by('appointment_date', 'appointment_time')[:10]
    
    serializer = AppointmentListSerializer(appointments, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_appointment_status(request, pk):
    """Update appointment status"""
    try:
        appointment = Appointment.objects.get(pk=pk)
        new_status = request.data.get('status')
        
        if new_status not in [choice[0] for choice in Appointment.STATUS_CHOICES]:
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = appointment.status
        appointment.status = new_status
        appointment.save()
        
        # Create history record
        AppointmentHistory.objects.create(
            appointment=appointment,
            changed_by=request.user,
            change_type='status_change',
            old_value=old_status,
            new_value=new_status,
            notes=request.data.get('notes', '')
        )
        
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data)
        
    except Appointment.DoesNotExist:
        return Response(
            {'error': 'Appointment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def appointment_stats(request):
    """Get appointment statistics"""
    today = timezone.now().date()
    this_month = today.replace(day=1)
    
    stats = {
        'total_appointments': Appointment.objects.count(),
        'today_appointments': Appointment.objects.filter(appointment_date=today).count(),
        'this_month_appointments': Appointment.objects.filter(
            appointment_date__gte=this_month
        ).count(),
        'appointments_by_status': {
            status[1]: Appointment.objects.filter(status=status[0]).count()
            for status in Appointment.STATUS_CHOICES
        },
        'appointments_by_doctor': [
            {
                'doctor_name': doctor.get_full_name(),
                'count': Appointment.objects.filter(doctor=doctor).count()
            }
            for doctor in request.user.__class__.objects.filter(role='doctor')
        ]
    }
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def appointment_history(request, pk):
    """Get appointment history"""
    try:
        appointment = Appointment.objects.get(pk=pk)
        history = appointment.history.all()
        serializer = AppointmentHistorySerializer(history, many=True)
        return Response(serializer.data)
    except Appointment.DoesNotExist:
        return Response(
            {'error': 'Appointment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_appointment_availability(request):
    """Check if a time slot is available for a doctor"""
    doctor_id = request.GET.get('doctor_id')
    appointment_date = request.GET.get('appointment_date')
    appointment_time = request.GET.get('appointment_time')
    duration_minutes = int(request.GET.get('duration_minutes', 30))
    appointment_id = request.GET.get('appointment_id')  # For update case
    
    if not all([doctor_id, appointment_date, appointment_time]):
        return Response(
            {'error': 'Missing required parameters: doctor_id, appointment_date, appointment_time'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from datetime import datetime, timedelta
        
        # Convert to datetime for easier calculation
        # Handle both DD/MM/YYYY and YYYY-MM-DD formats
        try:
            appointment_datetime = datetime.strptime(f"{appointment_date} {appointment_time}", "%d/%m/%Y %H:%M")
        except ValueError:
            try:
                appointment_datetime = datetime.strptime(f"{appointment_date} {appointment_time}", "%Y-%m-%d %H:%M")
            except ValueError:
                return Response(
                    {'error': f'Invalid date/time format: {appointment_date} {appointment_time}. Expected DD/MM/YYYY HH:MM or YYYY-MM-DD HH:MM'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        appointment_end_datetime = appointment_datetime + timedelta(minutes=duration_minutes)
        
        # Convert appointment_date to YYYY-MM-DD format for Django ORM
        appointment_date_for_filter = appointment_datetime.date()
        
        # Check for existing appointments for the same doctor on the same date
        queryset = Appointment.objects.filter(
            doctor_id=doctor_id,
            appointment_date=appointment_date_for_filter
        )
        
        # If checking for update, exclude the current appointment
        if appointment_id:
            queryset = queryset.exclude(pk=appointment_id)
        
        # Check for time conflicts
        conflicting_appointments = []
        for existing_appointment in queryset:
            existing_datetime = datetime.combine(
                existing_appointment.appointment_date, 
                existing_appointment.appointment_time
            )
            existing_end_datetime = existing_datetime + timedelta(
                minutes=existing_appointment.duration_minutes
            )
            
            # Check if there's any overlap
            if (appointment_datetime < existing_end_datetime and 
                appointment_end_datetime > existing_datetime):
                conflicting_appointments.append({
                    'id': existing_appointment.id,
                    'time': existing_appointment.appointment_time.strftime('%H:%M'),
                    'duration': existing_appointment.duration_minutes,
                    'customer': existing_appointment.customer_name,
                    'status': existing_appointment.get_status_display(),
                    'services': [service.name for service in existing_appointment.services.all()]
                })
        
        # Check if appointment is in the past
        from django.utils import timezone
        # Make appointment_datetime timezone-aware for comparison
        if appointment_datetime.tzinfo is None:
            appointment_datetime = timezone.make_aware(appointment_datetime)
        
        now = timezone.now().replace(second=0, microsecond=0)
        is_past = appointment_datetime < now
        
        return Response({
            'available': len(conflicting_appointments) == 0 and not is_past,
            'conflicts': conflicting_appointments,
            'is_past': is_past,
            'message': 'Thời gian khả dụng' if len(conflicting_appointments) == 0 and not is_past else 'Thời gian không khả dụng'
        })
        
    except ValueError as e:
        return Response(
            {'error': f'Invalid date/time format: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Error checking availability: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_appointments_excel(request):
    """Export appointments to Excel honoring basic filters"""
    queryset = Appointment.objects.prefetch_related('services').all()
    status_param = request.GET.get('status')
    doctor = request.GET.get('doctor')
    branch = request.GET.get('branch')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    # Validate date range: date_to must be greater than or equal to date_from
    if date_from and date_to:
        parsed_date_from = parse_date_string(date_from)
        parsed_date_to = parse_date_string(date_to)
        
        if parsed_date_from and parsed_date_to and parsed_date_to < parsed_date_from:
            return Response(
                {'error': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    if status_param:
        queryset = queryset.filter(status=status_param)
    if doctor:
        queryset = queryset.filter(doctor_id=doctor)
    if branch:
        queryset = queryset.filter(branch_id=branch)
    if date_from:
        parsed_date_from = parse_date_string(date_from)
        if parsed_date_from:
            queryset = queryset.filter(appointment_date__gte=parsed_date_from)
    if date_to:
        parsed_date_to = parse_date_string(date_to)
        if parsed_date_to:
            queryset = queryset.filter(appointment_date__lte=parsed_date_to)

    wb = Workbook()
    ws = wb.active
    ws.title = 'Appointments'
    headers = ['ID', 'Khách hàng', 'Bác sĩ', 'Dịch vụ', 'Chi nhánh', 'Ngày', 'Giờ', 'Trạng thái']
    ws.append(headers)
    for a in queryset.select_related('customer', 'doctor', 'branch'):
        ws.append([
            a.id,
            a.customer_name,
            a.doctor.get_full_name(),
            ", ".join([s.name for s in a.services.all()]),
            a.branch.name,
            a.appointment_date.strftime('%Y-%m-%d'),
            a.appointment_time.strftime('%H:%M'),
            a.get_status_display(),
        ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename=appointments.xlsx'
    return response


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_appointments_pdf(request):
    queryset = Appointment.objects.prefetch_related('services').all()
    status_param = request.GET.get('status')
    doctor = request.GET.get('doctor')
    branch = request.GET.get('branch')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    
    # Validate date range: date_to must be greater than or equal to date_from
    if date_from and date_to:
        parsed_date_from = parse_date_string(date_from)
        parsed_date_to = parse_date_string(date_to)
        
        if parsed_date_from and parsed_date_to and parsed_date_to < parsed_date_from:
            return Response(
                {'error': 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    if status_param:
        queryset = queryset.filter(status=status_param)
    if doctor:
        queryset = queryset.filter(doctor_id=doctor)
    if branch:
        queryset = queryset.filter(branch_id=branch)
    if date_from:
        parsed_date_from = parse_date_string(date_from)
        if parsed_date_from:
            queryset = queryset.filter(appointment_date__gte=parsed_date_from)
    if date_to:
        parsed_date_to = parse_date_string(date_to)
        if parsed_date_to:
            queryset = queryset.filter(appointment_date__lte=parsed_date_to)

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 50
    p.setFont('Helvetica-Bold', 14)
    p.drawString(50, y, 'Danh sách lịch hẹn')
    y -= 20
    p.setFont('Helvetica', 10)
    p.drawString(50, y, f'Tổng: {queryset.count()}')
    y -= 30
    headers = ['Ngày', 'Giờ', 'KH', 'Bác sĩ', 'Dịch vụ', 'CN', 'TT']
    p.setFont('Helvetica-Bold', 10)
    p.drawString(50, y, ' | '.join(headers))
    y -= 15
    p.setFont('Helvetica', 10)
    for a in queryset.select_related('customer', 'doctor', 'branch'):
        row = [
            a.appointment_date.strftime('%Y-%m-%d'),
            a.appointment_time.strftime('%H:%M'),
            a.customer_name,
            a.doctor.get_full_name(),
            ", ".join([s.name for s in a.services.all()]),
            a.branch.name,
            a.get_status_display(),
        ]
        p.drawString(50, y, ' | '.join(row))
        y -= 14
        if y < 50:
            p.showPage()
            y = height - 50
    p.showPage()
    p.save()
    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename=appointments.pdf'
    return response
