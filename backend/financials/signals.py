from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from appointments.models import Appointment
from financials.models import Payment
from customers.models import Customer
from django.utils import timezone


@receiver(post_save, sender=Payment)
def auto_merge_duplicate_payments(sender, instance, created, **kwargs):
    """Tự động gộp các Payment records trùng lặp của cùng một appointment"""
    if created and instance.appointment:  # Chỉ chạy khi tạo Payment mới có appointment
        try:
            # Tìm tất cả payments của appointment này
            payments = Payment.objects.filter(appointment=instance.appointment)
            
            if payments.count() > 1:
                print(f"Tự động gộp {payments.count()} Payment records cho appointment {instance.appointment.id}")
                
                # Chọn Payment đầu tiên làm Payment chính
                main_payment = payments.first()
                
                # Gộp tất cả services vào Payment chính
                all_services = set()
                total_amount = 0
                
                for payment in payments:
                    all_services.update(payment.services.all())
                    total_amount += payment.amount
                
                # Cập nhật Payment chính
                main_payment.services.set(all_services)
                main_payment.amount = total_amount
                main_payment.save()
                
                # Xóa các Payment khác
                other_payments = payments.exclude(id=main_payment.id)
                deleted_count = other_payments.count()
                other_payments.delete()
                
                print(f"✅ Đã tự động gộp {deleted_count + 1} Payment records thành Payment {main_payment.id}")
                print(f"   - Services: {len(all_services)}")
                print(f"   - Tổng tiền: {total_amount:,}đ")
                
        except Exception as e:
            print(f"Lỗi khi tự động gộp Payment cho appointment {instance.appointment.id}: {e}")


@receiver(m2m_changed, sender=Appointment.services.through)
def create_payment_for_appointment_services(sender, instance, action, pk_set, **kwargs):
    """Tự động tạo Payment khi thêm services vào Appointment"""
    if action == 'post_add' and pk_set:
        try:
            from customers.models import Service
            
            # Kiểm tra xem đã có Payment cho appointment này chưa
            existing_payment = Payment.objects.filter(
                appointment=instance,
                customer=instance.customer
            ).first()
            
            if existing_payment:
                # Nếu đã có Payment, chỉ thêm services mới vào
                new_services = Service.objects.filter(id__in=pk_set)
                existing_payment.services.add(*new_services)
                
                # Cập nhật lại tổng tiền
                total_amount = sum(service.price for service in existing_payment.services.all())
                existing_payment.amount = total_amount
                existing_payment.save()
                
                print(f"Cập nhật Payment {existing_payment.id} với {len(new_services)} services mới")
            else:
                # Tạo Payment mới cho appointment
                services = Service.objects.filter(id__in=pk_set)
                total_amount = sum(service.price for service in services)
                
                payment = Payment.objects.create(
                    customer=instance.customer,
                    branch=instance.branch,
                    amount=total_amount,
                    payment_method='cash',  # Mặc định tiền mặt
                    notes=f'Tự động tạo từ lịch hẹn {instance.id}'
                )
                
                # Thêm tất cả services vào payment
                payment.services.add(*services)
                
                print(f"Tạo Payment {payment.id} với {len(services)} services, tổng tiền: {total_amount}")
                
        except Exception as e:
            print(f"Lỗi tạo Payment: {e}")


@receiver(post_save, sender=Appointment)
def auto_merge_payments_for_appointment(sender, instance, created, **kwargs):
    """Tự động gộp các Payment records của cùng một appointment"""
    if not created:  # Chỉ chạy khi appointment được cập nhật, không phải tạo mới
        try:
            # Tìm tất cả payments của appointment này
            payments = Payment.objects.filter(appointment=instance)
            
            if payments.count() > 1:
                print(f"Tìm thấy {payments.count()} Payment records cho appointment {instance.id}, đang gộp...")
                
                # Chọn Payment đầu tiên làm Payment chính
                main_payment = payments.first()
                
                # Gộp tất cả services vào Payment chính
                all_services = set()
                total_amount = 0
                
                for payment in payments:
                    all_services.update(payment.services.all())
                    total_amount += payment.amount
                
                # Cập nhật Payment chính
                main_payment.services.set(all_services)
                main_payment.amount = total_amount
                main_payment.save()
                
                # Xóa các Payment khác
                other_payments = payments.exclude(id=main_payment.id)
                deleted_count = other_payments.count()
                other_payments.delete()
                
                print(f"✅ Đã gộp {deleted_count + 1} Payment records thành Payment {main_payment.id}")
                print(f"   - Services: {len(all_services)}")
                print(f"   - Tổng tiền: {total_amount:,}đ")
                
        except Exception as e:
            print(f"Lỗi khi tự động gộp Payment cho appointment {instance.id}: {e}")


@receiver(post_save, sender=Payment)
def update_customer_status_on_payment_success(sender, instance, created, **kwargs):
    """Cập nhật trạng thái khách hàng thành 'Thành công' khi thanh toán thành công"""
    if instance.status == 'paid' and instance.is_fully_paid:
        try:
            customer = instance.customer
            if customer.status != 'success':
                customer.status = 'success'
                customer.save()
                print(f"✅ Đã cập nhật trạng thái khách hàng {customer.full_name} thành 'Thành công'")
                
            # Cập nhật trạng thái appointment thành 'completed' nếu có
            if instance.appointment and instance.appointment.status != 'completed':
                instance.appointment.status = 'completed'
                instance.appointment.save()
                print(f"✅ Đã cập nhật trạng thái lịch hẹn {instance.appointment.id} thành 'Hoàn thành'")
                
        except Exception as e:
            print(f"Lỗi cập nhật trạng thái khách hàng/appointment: {e}")
