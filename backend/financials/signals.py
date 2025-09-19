from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from appointments.models import Appointment
from financials.models import Payment
from customers.models import Customer
from django.utils import timezone


 


@receiver(m2m_changed, sender=Appointment.services.through)
def create_payment_for_appointment_services(sender, instance, action, pk_set, **kwargs):
    """Tự động tạo Payment khi thêm services vào Appointment"""
    if action == 'post_add' and pk_set:
        try:
            from customers.models import Service
            
            # Tìm Payment hiện có cho khách hàng ở cùng chi nhánh
            existing_payment = Payment.objects.filter(
                customer=instance.customer,
                branch=instance.branch
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


 
 

def _sync_customer_status_from_payments(customer: Customer):
    """Đồng bộ trạng thái Customer dựa vào các Payment của họ.

    Quy ước:
    - paid => success
    - partial/unpaid => active (nếu còn dịch vụ)
    - cancelled và không có thanh toán khác => active
    """
    try:
        payments = Payment.objects.filter(customer=customer)
        new_status = customer.status
        if payments.filter(status='paid').exists():
            new_status = 'success'
        else:
            new_status = 'active'
        if customer.status != new_status:
            customer.status = new_status
            customer.save(update_fields=['status'])
    except Exception as e:
        print(f"Sync customer status error: {e}")


@receiver(post_save, sender=Payment)
def sync_customer_status_on_payment_save(sender, instance, created, **kwargs):
    _sync_customer_status_from_payments(instance.customer)


@receiver(post_delete, sender=Payment)
def sync_customer_status_on_payment_delete(sender, instance, **kwargs):
    _sync_customer_status_from_payments(instance.customer)
