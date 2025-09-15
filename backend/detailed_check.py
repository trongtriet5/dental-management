#!/usr/bin/env python
"""
Script để kiểm tra chi tiết dữ liệu khách hàng
"""
import os
import sys
import django

# Thiết lập Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from customers.models import Customer
from locations.models import Province, Ward

def check_customer_details():
    """Kiểm tra chi tiết dữ liệu khách hàng"""
    print("=== KIỂM TRA CHI TIẾT KHÁCH HÀNG ===")
    
    customers = Customer.objects.all()[:5]
    for customer in customers:
        print(f"\nKhách hàng: {customer.full_name}")
        print(f"  - province_id: {customer.province_id}")
        print(f"  - ward_id: {customer.ward_id}")
        print(f"  - province: {customer.province}")
        print(f"  - ward: {customer.ward}")
        
        # Kiểm tra trực tiếp trong database
        if customer.province_id:
            try:
                province = Province.objects.get(pk=customer.province_id)
                print(f"  - Province object: {province.name} (code: {province.code})")
            except Province.DoesNotExist:
                print(f"  - ❌ Province ID {customer.province_id} không tồn tại")
        
        if customer.ward_id:
            try:
                ward = Ward.objects.get(pk=customer.ward_id)
                print(f"  - Ward object: {ward.name} (code: {ward.code})")
            except Ward.DoesNotExist:
                print(f"  - ❌ Ward ID {customer.ward_id} không tồn tại")

def test_serializer_directly():
    """Test serializer trực tiếp"""
    print(f"\n=== TEST SERIALIZER TRỰC TIẾP ===")
    
    from customers.serializers import CustomerSerializer
    
    customers = Customer.objects.all()[:3]
    for customer in customers:
        print(f"\nKhách hàng: {customer.full_name}")
        
        # Test serializer
        try:
            serializer = CustomerSerializer(customer)
            data = serializer.data
            
            print(f"  - province_code: {data.get('province_code')}")
            print(f"  - ward_code: {data.get('ward_code')}")
            print(f"  - province_name: {data.get('province_name')}")
            print(f"  - ward_name: {data.get('ward_name')}")
            
            # Test các phương thức get_* trực tiếp
            print(f"  - get_province_code: {serializer.get_province_code(customer)}")
            print(f"  - get_ward_code: {serializer.get_ward_code(customer)}")
            print(f"  - get_province_name: {serializer.get_province_name(customer)}")
            print(f"  - get_ward_name: {serializer.get_ward_name(customer)}")
            
        except Exception as e:
            print(f"  - ❌ Lỗi serializer: {e}")

def create_test_customer():
    """Tạo khách hàng test với Hà Nội"""
    print(f"\n=== TẠO KHÁCH HÀNG TEST ===")
    
    try:
        # Lấy Hà Nội
        hanoi = Province.objects.get(code='01')
        print(f"✅ Hà Nội: {hanoi.name} (ID: {hanoi.pk})")
        
        # Lấy phường/xã đầu tiên của Hà Nội
        first_ward = Ward.objects.filter(province=hanoi).first()
        if first_ward:
            print(f"✅ Phường/xã: {first_ward.name} (ID: {first_ward.pk})")
        
        # Tạo khách hàng test
        test_customer = Customer.objects.create(
            first_name='Test',
            last_name='Customer',
            phone='0999999999',
            gender='male',
            date_of_birth='1990-01-01',
            province=hanoi,
            ward=first_ward,
            street='123 Test Street',
            branch_id=1
        )
        
        print(f"✅ Đã tạo khách hàng test: {test_customer.full_name}")
        
        # Test serializer với khách hàng mới
        from customers.serializers import CustomerSerializer
        serializer = CustomerSerializer(test_customer)
        data = serializer.data
        
        print(f"Serializer output:")
        print(f"  - province_code: {data.get('province_code')}")
        print(f"  - ward_code: {data.get('ward_code')}")
        print(f"  - province_name: {data.get('province_name')}")
        print(f"  - ward_name: {data.get('ward_name')}")
        
        # Xóa khách hàng test
        test_customer.delete()
        print("✅ Đã xóa khách hàng test")
        
    except Exception as e:
        print(f"❌ Lỗi tạo khách hàng test: {e}")

if __name__ == "__main__":
    check_customer_details()
    test_serializer_directly()
    create_test_customer()
