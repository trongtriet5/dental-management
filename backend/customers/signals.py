from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Customer, Service
from financials.models import Payment
from appointments.models import Appointment
from django.utils import timezone
from datetime import datetime, timedelta

User = get_user_model()


@receiver(post_save, sender=Customer)
def create_payment_and_appointment_for_customer(sender, instance, created, **kwargs):
    """Tự động tạo Payment record và Appointment khi khách hàng được tạo"""
    if created and instance.services_used.exists():
        try:
            print(f"Creating payment and appointment for customer {instance.full_name} with {instance.services_used.count()} services")
            
            # Tính tổng giá trị dịch vụ
            total_amount = sum(service.price for service in instance.services_used.all())
            print(f"Total amount: {total_amount}")
            
            # Tạo Payment record
            payment = Payment.objects.create(
                customer=instance,
                branch=instance.branch,
                amount=total_amount,
                paid_amount=0,
                payment_method='cash',
                status='pending',
                notes=f'Tự động tạo từ dịch vụ khách hàng',
                created_by=instance.created_by
            )
            # Thêm services vào payment
            payment.services.set(instance.services_used.all())
            print(f"Created payment {payment.id} with amount {payment.amount}")
            
            # Tạo Appointment record
            # Lấy doctor đầu tiên có sẵn hoặc tạo appointment với doctor mặc định
            from users.models import User
            doctor = User.objects.filter(role='doctor', is_active=True).first()
            
            if doctor:
                # Tính tổng thời gian dịch vụ
                total_duration = sum(service.duration_minutes for service in instance.services_used.all())
                
                # Tạo appointment cho ngày mai
                tomorrow = timezone.now().date() + timedelta(days=1)
                appointment_time = datetime.strptime('09:00', '%H:%M').time()
                
                appointment = Appointment.objects.create(
                    customer=instance,
                    doctor=doctor,
                    branch=instance.branch,
                    appointment_date=tomorrow,
                    appointment_time=appointment_time,
                    duration_minutes=total_duration,
                    status='scheduled',
                    notes=f'Tự động tạo từ dịch vụ khách hàng',
                    created_by=instance.created_by
                )
                # Thêm services vào appointment
                appointment.services.set(instance.services_used.all())
                print(f"Created appointment {appointment.id} for {tomorrow} at {appointment_time}")
            else:
                print("No doctor available to create appointment")
                
        except Exception as e:
            print(f"Error creating payment/appointment for customer {instance.id}: {e}")
            # Không raise exception để không làm fail việc tạo customer


@receiver(m2m_changed, sender=Customer.services_used.through)
def update_payment_and_appointment_when_services_change(sender, instance, action, pk_set, **kwargs):
    """Cập nhật Payment và Appointment khi dịch vụ của khách hàng thay đổi"""
    if action in ['post_add', 'post_remove', 'post_clear']:
        # Tìm Payment record hiện tại của khách hàng
        try:
            payment = Payment.objects.filter(customer=instance).first()
            
            if payment:
                # Cập nhật dịch vụ và tổng tiền
                payment.services.set(instance.services_used.all())
                total_amount = sum(service.price for service in instance.services_used.all())
                payment.amount = total_amount
                payment.save()
            elif instance.services_used.exists():
                # Tạo Payment mới nếu chưa có
                total_amount = sum(service.price for service in instance.services_used.all())
                payment = Payment.objects.create(
                    customer=instance,
                    branch=instance.branch,
                    amount=total_amount,
                    paid_amount=0,
                    payment_method='cash',
                    status='pending',
                    notes=f'Tự động tạo từ dịch vụ khách hàng',
                    created_by=instance.created_by
                )
                # Thêm services vào payment
                payment.services.set(instance.services_used.all())
            
            # Cập nhật Appointment nếu có
            appointment = Appointment.objects.filter(customer=instance).first()
            if appointment:
                appointment.services.set(instance.services_used.all())
                total_duration = sum(service.duration_minutes for service in instance.services_used.all())
                appointment.duration_minutes = total_duration
                appointment.save()
            elif instance.services_used.exists():
                # Tạo Appointment mới nếu chưa có
                from users.models import User
                doctor = User.objects.filter(role='doctor', is_active=True).first()
                
                if doctor:
                    total_duration = sum(service.duration_minutes for service in instance.services_used.all())
                    tomorrow = timezone.now().date() + timedelta(days=1)
                    appointment_time = datetime.strptime('09:00', '%H:%M').time()
                    
                    appointment = Appointment.objects.create(
                        customer=instance,
                        doctor=doctor,
                        branch=instance.branch,
                        appointment_date=tomorrow,
                        appointment_time=appointment_time,
                        duration_minutes=total_duration,
                        status='scheduled',
                        notes=f'Tự động tạo từ dịch vụ khách hàng',
                        created_by=instance.created_by
                    )
                    appointment.services.set(instance.services_used.all())
                    
        except Exception as e:
            print(f"Error updating payment and appointment: {e}")
