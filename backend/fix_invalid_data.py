#!/usr/bin/env python
"""
Script để sửa tất cả khách hàng có province_id và ward_id không hợp lệ
"""
import os
import sys
import django

# Thiết lập Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from customers.models import Customer
from locations.models import Province, Ward

def fix_invalid_customer_data():
    """Sửa dữ liệu khách hàng có ID không hợp lệ"""
    print("=== SỬA DỮ LIỆU KHÁCH HÀNG KHÔNG HỢP LỆ ===")
    
    # Lấy Hà Nội
    hanoi = Province.objects.get(code='01')
    print(f"Hà Nội: {hanoi.name} (ID: {hanoi.pk})")
    
    # Lấy phường/xã đầu tiên của Hà Nội
    first_ward = Ward.objects.filter(province=hanoi).first()
    if first_ward:
        print(f"Phường/xã mặc định: {first_ward.name} (ID: {first_ward.pk})")
    
    customers_fixed = 0
    
    for customer in Customer.objects.all():
        fixed = False
        
        # Kiểm tra và sửa province_id
        if customer.province_id:
            try:
                Province.objects.get(pk=customer.province_id)
            except Province.DoesNotExist:
                print(f"Sửa province_id cho {customer.full_name}: {customer.province_id} -> {hanoi.pk}")
                customer.province = hanoi
                fixed = True
        
        # Kiểm tra và sửa ward_id
        if customer.ward_id:
            try:
                Ward.objects.get(pk=customer.ward_id)
            except Ward.DoesNotExist:
                if first_ward:
                    print(f"Sửa ward_id cho {customer.full_name}: {customer.ward_id} -> {first_ward.pk}")
                    customer.ward = first_ward
                    fixed = True
        
        if fixed:
            customer.save()
            customers_fixed += 1
    
    print(f"\n✅ Đã sửa {customers_fixed} khách hàng")
    
    # Kiểm tra lại
    print("\n=== KIỂM TRA LẠI ===")
    invalid_count = 0
    for customer in Customer.objects.all():
        if customer.province_id:
            try:
                Province.objects.get(pk=customer.province_id)
            except Province.DoesNotExist:
                invalid_count += 1
                print(f"❌ {customer.full_name} vẫn có province_id không hợp lệ: {customer.province_id}")
        
        if customer.ward_id:
            try:
                Ward.objects.get(pk=customer.ward_id)
            except Ward.DoesNotExist:
                invalid_count += 1
                print(f"❌ {customer.full_name} vẫn có ward_id không hợp lệ: {customer.ward_id}")
    
    if invalid_count == 0:
        print("✅ Tất cả dữ liệu đã hợp lệ!")
    else:
        print(f"❌ Vẫn còn {invalid_count} khách hàng có dữ liệu không hợp lệ")

def test_serializer_after_fix():
    """Test serializer sau khi sửa"""
    print("\n=== TEST SERIALIZER SAU KHI SỬA ===")
    
    from customers.serializers import CustomerSerializer
    
    customers = Customer.objects.all()[:3]
    for customer in customers:
        print(f"\nKhách hàng: {customer.full_name}")
        print(f"  - province_id: {customer.province_id}")
        print(f"  - ward_id: {customer.ward_id}")
        
        try:
            serializer = CustomerSerializer(customer)
            data = serializer.data
            
            print(f"  - province_code: {data.get('province_code')}")
            print(f"  - ward_code: {data.get('ward_code')}")
            print(f"  - province_name: {data.get('province_name')}")
            print(f"  - ward_name: {data.get('ward_name')}")
            
        except Exception as e:
            print(f"  - ❌ Lỗi serializer: {e}")

if __name__ == "__main__":
    fix_invalid_customer_data()
    test_serializer_after_fix()
