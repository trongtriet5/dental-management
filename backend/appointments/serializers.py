from rest_framework import serializers
from .models import Appointment, AppointmentHistory
from customers.serializers import CustomerSerializer, ServiceSerializer, BranchSerializer
from users.serializers import DoctorSerializer
from django.utils.dateformat import format
from customers.models import Service  # Import from customers.models
from django.contrib.auth import get_user_model

User = get_user_model()


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    services = serializers.PrimaryKeyRelatedField(many=True, queryset=Service.objects.all())
    service_names = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    datetime = serializers.DateTimeField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    is_today = serializers.BooleanField(read_only=True)
    appointment_date = serializers.DateField(format='%d/%m/%Y', input_formats=['%d/%m/%Y', '%Y-%m-%d'])
    appointment_time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M'])
    end_time = serializers.TimeField(format='%H:%M', required=False, allow_null=True)
    calculated_end_time = serializers.TimeField(format='%H:%M', read_only=True)
    created_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    updated_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    # Consultant handling: accept optional consultant id on write, expose id+name on read
    consultant = serializers.SerializerMethodField(read_only=True)
    consultant_name = serializers.SerializerMethodField(read_only=True)
    consultant_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Appointment
        fields = ['id', 'customer_name', 'customer_phone', 'doctor', 'doctor_name', 
                 'branch', 'branch_name', 'services', 'service_names', 'services_with_quantity',
                 'appointment_date', 'appointment_time', 'end_time', 'calculated_end_time', 'datetime', 'duration_minutes', 
                 'appointment_type', 'status', 'status_display', 'is_waitlist', 'waitlist_position', 'notes', 'consultant', 'consultant_name', 'is_past', 'is_today', 'created_by', 'created_by_name', 
                 'created_at', 'updated_at', 'consultant_id']
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def to_internal_value(self, data):
        # Handle date format conversion before validation
        if 'appointment_date' in data and data['appointment_date']:
            date_str = data['appointment_date']
            if '/' in date_str and len(date_str.split('/')) == 3:
                # Convert DD/MM/YYYY to YYYY-MM-DD
                try:
                    from datetime import datetime
                    date_obj = datetime.strptime(date_str, '%d/%m/%Y')
                    data['appointment_date'] = date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    pass  # Let Django handle the error
        
        # Accept consultant_id as a convenience and inject into notes in a consistent format
        try:
            consultant_val = data.get('consultant_id')
            if consultant_val is not None and consultant_val != '':
                try:
                    consultant_int = int(consultant_val)
                    # Ensure notes start with CONSULTANT_ID:<id>\n (but avoid duplicating if already present)
                    existing_notes = data.get('notes') or ''
                    import re
                    if not re.match(r'^CONSULTANT_ID:\d+', str(existing_notes or '')):
                        prefix = f"CONSULTANT_ID:{consultant_int}"
                        data['notes'] = f"{prefix}\n{existing_notes}".strip()
                except (ValueError, TypeError):
                    pass

            validated_data = super().to_internal_value(data)
        except serializers.ValidationError as e:
            if 'services' in e.detail and 'Invalid pk' in str(e.detail['services']):
                raise serializers.ValidationError(
                    {'services': 'One or more provided service IDs are invalid or do not exist.'}
                )
            raise e
        return validated_data

    def validate(self, data):
        doctor = data.get('doctor')
        appointment_date = data.get('appointment_date')
        appointment_time = data.get('appointment_time')
        end_time = data.get('end_time')
        duration_minutes = data.get('duration_minutes', 30)  # Default 30 minutes if not provided

        # Validate end_time if provided
        if end_time and appointment_time:
            from datetime import datetime, timedelta
            start_datetime = datetime.combine(appointment_date, appointment_time)
            end_datetime = datetime.combine(appointment_date, end_time)
            
            if end_datetime <= start_datetime:
                raise serializers.ValidationError(
                    "Giờ kết thúc phải sau giờ bắt đầu"
                )
            
            # If end_time is provided, calculate the actual duration and update duration_minutes
            calculated_duration = int((end_datetime - start_datetime).total_seconds() / 60)
            data['duration_minutes'] = calculated_duration

        if doctor and appointment_date and appointment_time:
            from datetime import datetime, timedelta
            
            # Convert to datetime for easier calculation
            appointment_datetime = datetime.combine(appointment_date, appointment_time)
            appointment_end_datetime = appointment_datetime + timedelta(minutes=duration_minutes)
            
            # Check for existing appointments for the same doctor on the same date
            queryset = Appointment.objects.filter(
                doctor=doctor,
                appointment_date=appointment_date
            )

            # If updating an existing appointment, exclude itself from the check
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)

            # Check for exact time conflicts (unique_together constraint)
            exact_time_conflicts = queryset.filter(appointment_time=appointment_time)
            if exact_time_conflicts.exists():
                conflict = exact_time_conflicts.first()
                raise serializers.ValidationError(
                    f"Bác sĩ đã có lịch hẹn vào cùng thời điểm ({appointment_time}) với khách hàng '{conflict.customer_name}'. "
                    f"Vui lòng chọn thời gian khác hoặc thay đổi bác sĩ."
                )

            # Check for time overlap conflicts
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
                        'time': existing_appointment.appointment_time.strftime('%H:%M'),
                        'duration': existing_appointment.duration_minutes,
                        'customer': existing_appointment.customer_name,
                        'status': existing_appointment.get_status_display()
                    })

            if conflicting_appointments:
                error_message = "Bác sĩ đã có lịch hẹn trùng thời gian:\n"
                for conflict in conflicting_appointments:
                    error_message += f"- {conflict['time']} ({conflict['duration']} phút) - {conflict['customer']} ({conflict['status']})\n"
                error_message += "Vui lòng chọn thời gian khác."
                raise serializers.ValidationError(error_message.strip())

        # Check if appointment is in the past
        if appointment_date and appointment_time:
            from django.utils import timezone
            appointment_datetime = datetime.combine(appointment_date, appointment_time)
            
            # Make appointment_datetime timezone-aware for comparison
            if appointment_datetime.tzinfo is None:
                appointment_datetime = timezone.make_aware(appointment_datetime)
            
            now = timezone.now().replace(second=0, microsecond=0)
            
            # Ensure both datetimes are in the same timezone for comparison
            if appointment_datetime.tzinfo != now.tzinfo:
                appointment_datetime = appointment_datetime.astimezone(now.tzinfo)
            
            today = now.date()
            
            # Allow appointments for today and future dates
            if appointment_date < today:
                raise serializers.ValidationError(
                    "Không thể đặt lịch hẹn trong quá khứ. Vui lòng chọn ngày hôm nay hoặc trong tương lai."
                )
            
            # For today's appointments, check if time is in the past
            if appointment_date == today and appointment_datetime < now:
                raise serializers.ValidationError(
                    "Không thể đặt lịch hẹn trong quá khứ. Vui lòng chọn thời gian trong tương lai."
                )

        # Check business hours
        if appointment_date and appointment_time:
            appointment_hour = appointment_time.hour
            day_of_week = appointment_date.weekday()  # 0 = Monday, 6 = Sunday
            
            # Sunday (weekday 6)
            if day_of_week == 6:
                if not (8 <= appointment_hour < 12):
                    raise serializers.ValidationError(
                        "Chủ nhật chỉ có thể đặt lịch từ 8:00 đến 12:00"
                    )
            # Monday to Saturday (weekday 0-5)
            else:
                if not (8 <= appointment_hour < 20):
                    raise serializers.ValidationError(
                        "Thứ 2 đến thứ 7 chỉ có thể đặt lịch từ 8:00 đến 20:00"
                    )

        return data

    def create(self, validated_data):
        services_data = validated_data.pop('services', [])
        validated_data['created_by'] = self.context['request'].user
        appointment = Appointment.objects.create(**validated_data)
        if services_data:
            try:
                # Make sure we're passing IDs to set()
                service_ids = [service.id for service in services_data]
                appointment.services.set(service_ids)
            except Service.DoesNotExist as e:
                raise serializers.ValidationError({'services': f'One or more services are invalid: {e}'})
        return appointment

    def update(self, instance, validated_data):
        services_data = validated_data.pop('services', None)
        
        instance = super().update(instance, validated_data)
        
        if services_data is not None:
            instance.services.set(services_data)
        
        return instance

    def get_service_names(self, obj):
        return ", ".join([service.name for service in obj.services.all()])

    def _parse_consultant_id(self, notes: str | None):
        if not notes:
            return None
        import re
        m = re.match(r'^CONSULTANT_ID:(\d+)', notes.strip())
        if m:
            try:
                return int(m.group(1))
            except (TypeError, ValueError):
                return None
        return None

    def get_consultant(self, obj):
        return self._parse_consultant_id(getattr(obj, 'notes', None))

    def get_consultant_name(self, obj):
        consultant_id = self._parse_consultant_id(getattr(obj, 'notes', None))
        if not consultant_id:
            return None
        try:
            user = User.objects.get(id=consultant_id)
            return user.get_full_name()
        except User.DoesNotExist:
            return None


class AppointmentListSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    service_names = serializers.SerializerMethodField()
    services = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    doctor = serializers.IntegerField(source='doctor.id', read_only=True)
    branch = serializers.IntegerField(source='branch.id', read_only=True)
    datetime = serializers.DateTimeField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    is_today = serializers.BooleanField(read_only=True)
    appointment_date = serializers.DateField(format='%d/%m/%Y', input_formats=['%d/%m/%Y', '%Y-%m-%d'])
    end_time = serializers.TimeField(format='%H:%M', read_only=True)
    calculated_end_time = serializers.TimeField(format='%H:%M', read_only=True)
    created_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    consultant = serializers.SerializerMethodField(read_only=True)
    consultant_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Appointment
        fields = ['id', 'customer_name', 'customer_phone', 'doctor', 'doctor_name', 'service_names', 'services', 
                 'branch', 'branch_name', 'appointment_date', 'appointment_time', 'end_time', 'calculated_end_time', 'datetime', 'status', 
                 'notes', 'consultant', 'consultant_name', 'created_by_name', 'is_past', 'is_today', 'created_at']

    def get_service_names(self, obj):
        return ", ".join([service.name for service in obj.services.all()])

    def _parse_consultant_id(self, notes: str | None):
        if not notes:
            return None
        import re
        m = re.match(r'^CONSULTANT_ID:(\d+)', notes.strip())
        if m:
            try:
                return int(m.group(1))
            except (TypeError, ValueError):
                return None
        return None

    def get_consultant(self, obj):
        return self._parse_consultant_id(getattr(obj, 'notes', None))

    def get_consultant_name(self, obj):
        consultant_id = self._parse_consultant_id(getattr(obj, 'notes', None))
        if not consultant_id:
            return None
        try:
            user = User.objects.get(id=consultant_id)
            return user.get_full_name()
        except User.DoesNotExist:
            return None


class AppointmentHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    created_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    
    class Meta:
        model = AppointmentHistory
        fields = ['id', 'appointment', 'changed_by', 'changed_by_name', 'change_type', 
                 'old_value', 'new_value', 'notes', 'created_at']
        read_only_fields = ['created_at']


class AppointmentCalendarSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    service_names = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    title = serializers.SerializerMethodField()
    # include ids needed for calendar rendering on frontend
    doctor = serializers.IntegerField(source='doctor.id', read_only=True)
    branch = serializers.IntegerField(source='branch.id', read_only=True)
    appointment_date = serializers.DateField(format='%d/%m/%Y', input_formats=['%d/%m/%Y', '%Y-%m-%d'])
    consultant = serializers.SerializerMethodField(read_only=True)
    consultant_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Appointment
        fields = ['id', 'title', 'customer_name', 'customer_phone', 'doctor', 'doctor_name', 'service_names', 'branch', 'branch_name',
                 'appointment_date', 'appointment_time', 'status', 'notes', 'consultant', 'consultant_name']
    
    def get_title(self, obj):
        return f"{obj.customer_name} - {obj.service_names}"

    def get_service_names(self, obj):
        return ", ".join([service.name for service in obj.services.all()])

    def _parse_consultant_id(self, notes: str | None):
        if not notes:
            return None
        import re
        m = re.match(r'^CONSULTANT_ID:(\d+)', notes.strip())
        if m:
            try:
                return int(m.group(1))
            except (TypeError, ValueError):
                return None
        return None

    def get_consultant(self, obj):
        return self._parse_consultant_id(getattr(obj, 'notes', None))

    def get_consultant_name(self, obj):
        consultant_id = self._parse_consultant_id(getattr(obj, 'notes', None))
        if not consultant_id:
            return None
        try:
            user = User.objects.get(id=consultant_id)
            return user.get_full_name()
        except User.DoesNotExist:
            return None
