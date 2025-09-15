#!/usr/bin/env python
"""
Script để cập nhật tất cả khách hàng với dữ liệu mặc định
"""
import os
import sys
import django

# Thiết lập Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from customers.models import Customer
from locations.models import Province, Ward

def update_all_customers():
    """Cập nhật tất cả khách hàng với dữ liệu mặc định"""
    print("=== CẬP NHẬT TẤT CẢ KHÁCH HÀNG ===")
    
    # Lấy Hà Nội
    try:
        hanoi = Province.objects.get(code='01')
        print(f"✅ Hà Nội: {hanoi.name} (ID: {hanoi.pk})")
    except Province.DoesNotExist:
        print("❌ Không tìm thấy Hà Nội")
        return
    
    # Lấy phường/xã đầu tiên của Hà Nội
    first_ward = Ward.objects.filter(province=hanoi).first()
    if first_ward:
        print(f"✅ Phường/xã mặc định: {first_ward.name} (ID: {first_ward.pk})")
    
    # Cập nhật tất cả khách hàng
    customers_updated = 0
    
    for customer in Customer.objects.all():
        updated = False
        
        # Cập nhật province nếu chưa có
        if not customer.province_id:
            customer.province = hanoi
            updated = True
            print(f"Cập nhật province cho {customer.full_name}")
        
        # Cập nhật ward nếu chưa có và có first_ward
        if not customer.ward_id and first_ward:
            customer.ward = first_ward
            updated = True
            print(f"Cập nhật ward cho {customer.full_name}")
        
        if updated:
            customer.save()
            customers_updated += 1
    
    print(f"\n✅ Đã cập nhật {customers_updated} khách hàng")
    
    # Kiểm tra lại
    print("\n=== KIỂM TRA LẠI ===")
    customers_with_province = Customer.objects.filter(province__isnull=False).count()
    customers_with_ward = Customer.objects.filter(ward__isnull=False).count()
    
    print(f"Khách hàng có province: {customers_with_province}")
    print(f"Khách hàng có ward: {customers_with_ward}")
    
    # Test serializer với một khách hàng
    if customers_with_province > 0:
        customer = Customer.objects.filter(province__isnull=False).first()
        print(f"\nTest serializer với {customer.full_name}:")
        
        from customers.serializers import CustomerSerializer
        serializer = CustomerSerializer(customer)
        data = serializer.data
        
        print(f"  - province_code: {data.get('province_code')}")
        print(f"  - ward_code: {data.get('ward_code')}")
        print(f"  - province_name: {data.get('province_name')}")
        print(f"  - ward_name: {data.get('ward_name')}")

if __name__ == "__main__":
    update_all_customers()
