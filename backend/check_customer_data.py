#!/usr/bin/env python
"""
Script để kiểm tra và sửa dữ liệu province/ward sau khi thay đổi to_field
"""
import os
import sys
import django

# Thiết lập Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from customers.models import Customer
from locations.models import Province, Ward

def check_customer_province_ward():
    """Kiểm tra dữ liệu province/ward của khách hàng"""
    print("=== KIỂM TRA DỮ LIỆU KHÁCH HÀNG ===")
    
    customers = Customer.objects.all()
    print(f"Tổng số khách hàng: {customers.count()}")
    
    invalid_customers = []
    
    for customer in customers:
        issues = []
        
        # Kiểm tra province
        if customer.province_id:
            try:
                province = Province.objects.get(pk=customer.province_id)
                print(f"✅ {customer.full_name}: Province {province.name} (ID: {province.pk}, Code: {province.code})")
            except Province.DoesNotExist:
                issues.append(f"Province ID {customer.province_id} không tồn tại")
        
        # Kiểm tra ward
        if customer.ward_id:
            try:
                ward = Ward.objects.get(pk=customer.ward_id)
                print(f"✅ {customer.full_name}: Ward {ward.name} (ID: {ward.pk}, Code: {ward.code})")
            except Ward.DoesNotExist:
                issues.append(f"Ward ID {customer.ward_id} không tồn tại")
        
        if issues:
            invalid_customers.append((customer, issues))
    
    if invalid_customers:
        print(f"\n❌ {len(invalid_customers)} khách hàng có dữ liệu không hợp lệ:")
        for customer, issues in invalid_customers:
            print(f"  - {customer.full_name}: {', '.join(issues)}")
    else:
        print("\n✅ Tất cả khách hàng có dữ liệu hợp lệ")

def test_hanoi_access():
    """Test truy cập Hà Nội"""
    print("\n=== TEST TRUY CẬP HÀ NỘI ===")
    
    try:
        # Test truy cập bằng code
        hanoi_by_code = Province.objects.get(code='01')
        print(f"✅ Truy cập Hà Nội bằng code: {hanoi_by_code.name}")
        
        # Test truy cập bằng ID
        hanoi_by_id = Province.objects.get(pk=hanoi_by_code.pk)
        print(f"✅ Truy cập Hà Nội bằng ID: {hanoi_by_id.name}")
        
        # Test phường/xã của Hà Nội
        wards = Ward.objects.filter(province=hanoi_by_code)
        print(f"✅ Số phường/xã của Hà Nội: {wards.count()}")
        
        if wards.exists():
            print("Một số phường/xã:")
            for ward in wards[:3]:
                print(f"  - {ward.code}: {ward.name}")
        
    except Exception as e:
        print(f"❌ Lỗi truy cập Hà Nội: {e}")

def test_customer_serializer():
    """Test serializer với khách hàng"""
    print("\n=== TEST SERIALIZER ===")
    
    from customers.serializers import CustomerSerializer
    
    customers = Customer.objects.all()[:3]
    for customer in customers:
        try:
            serializer = CustomerSerializer(customer)
            data = serializer.data
            print(f"✅ {customer.full_name}:")
            print(f"  - province_code: {data.get('province_code')}")
            print(f"  - ward_code: {data.get('ward_code')}")
            print(f"  - province_name: {data.get('province_name')}")
            print(f"  - ward_name: {data.get('ward_name')}")
        except Exception as e:
            print(f"❌ Lỗi serializer cho {customer.full_name}: {e}")

if __name__ == "__main__":
    check_customer_province_ward()
    test_hanoi_access()
    test_customer_serializer()
