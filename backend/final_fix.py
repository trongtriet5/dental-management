#!/usr/bin/env python
"""
Script cuối cùng để sửa vấn đề province/ward
"""
import os
import sys
import django

# Thiết lập Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from customers.models import Customer
from locations.models import Province, Ward

def fix_all_customers():
    """Sửa tất cả khách hàng"""
    print("=== SỬA TẤT CẢ KHÁCH HÀNG ===")
    
    # Lấy Hà Nội
    hanoi = Province.objects.get(code='01')
    print(f"Hà Nội: {hanoi.name} (ID: {hanoi.pk})")
    
    # Lấy phường/xã đầu tiên của Hà Nội
    first_ward = Ward.objects.filter(province=hanoi).first()
    if first_ward:
        print(f"Phường/xã mặc định: {first_ward.name} (ID: {first_ward.pk})")
    
    # Cập nhật tất cả khách hàng
    updated_count = 0
    for customer in Customer.objects.all():
        if not customer.province_id:
            customer.province = hanoi
            updated_count += 1
            print(f"Cập nhật province cho {customer.full_name}")
        
        if not customer.ward_id and first_ward:
            customer.ward = first_ward
            print(f"Cập nhật ward cho {customer.full_name}")
        
        customer.save()
    
    print(f"Đã cập nhật {updated_count} khách hàng")
    
    # Test serializer
    print("\n=== TEST SERIALIZER ===")
    from customers.serializers import CustomerSerializer
    
    customer = Customer.objects.first()
    if customer:
        serializer = CustomerSerializer(customer)
        data = serializer.data
        
        print(f"Khách hàng: {customer.full_name}")
        print(f"province_code: {data.get('province_code')}")
        print(f"ward_code: {data.get('ward_code')}")
        print(f"province_name: {data.get('province_name')}")
        print(f"ward_name: {data.get('ward_name')}")

if __name__ == "__main__":
    fix_all_customers()
