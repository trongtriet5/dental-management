from django.core.management.base import BaseCommand
from django.db import transaction
from financials.models import Payment
from appointments.models import Appointment


class Command(BaseCommand):
    help = 'Gộp các Payment records của cùng một appointment thành một record duy nhất'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Chỉ hiển thị những gì sẽ được thay đổi mà không thực hiện',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - Không có thay đổi nào được thực hiện'))
        
        # Tìm tất cả appointments có nhiều hơn 1 payment
        appointments_with_multiple_payments = []
        
        for appointment in Appointment.objects.all():
            payments = Payment.objects.filter(appointment=appointment)
            if payments.count() > 1:
                appointments_with_multiple_payments.append({
                    'appointment': appointment,
                    'payments': payments,
                    'count': payments.count()
                })
        
        if not appointments_with_multiple_payments:
            self.stdout.write(self.style.SUCCESS('Không có appointment nào có nhiều Payment records'))
            return
        
        self.stdout.write(f'Tìm thấy {len(appointments_with_multiple_payments)} appointments có nhiều Payment records:')
        
        total_merged = 0
        total_deleted = 0
        
        for item in appointments_with_multiple_payments:
            appointment = item['appointment']
            payments = item['payments']
            count = item['count']
            
            self.stdout.write(f'\nAppointment {appointment.id} - Khách hàng: {appointment.customer.full_name}')
            self.stdout.write(f'  Có {count} Payment records:')
            
            for payment in payments:
                services_names = ', '.join([s.name for s in payment.services.all()])
                self.stdout.write(f'    Payment {payment.id}: {services_names} - {payment.amount:,}đ')
            
            if not dry_run:
                try:
                    with transaction.atomic():
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
                        
                        total_merged += 1
                        total_deleted += deleted_count
                        
                        self.stdout.write(f'  ✅ Đã gộp thành Payment {main_payment.id} với {len(all_services)} services, tổng tiền: {total_amount:,}đ')
                        self.stdout.write(f'  ✅ Đã xóa {deleted_count} Payment records khác')
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  ❌ Lỗi khi gộp Payment cho appointment {appointment.id}: {e}'))
            else:
                self.stdout.write(f'  [DRY RUN] Sẽ gộp thành 1 Payment với {len(set().union(*[p.services.all() for p in payments]))} services')
        
        if not dry_run:
            self.stdout.write(f'\n✅ Hoàn thành!')
            self.stdout.write(f'  - Đã gộp {total_merged} appointments')
            self.stdout.write(f'  - Đã xóa {total_deleted} Payment records trùng lặp')
        else:
            self.stdout.write(f'\n[DRY RUN] Sẽ gộp {len(appointments_with_multiple_payments)} appointments')
