#!/usr/bin/env python
"""
Script để test serializer với debug chi tiết
"""
import os
import sys
import django

# Thiết lập Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from customers.models import Customer
from customers.serializers import CustomerSerializer

def test_serializer_with_debug():
    """Test serializer với debug chi tiết"""
    print("=== TEST SERIALIZER VỚI DEBUG ===")
    
    customers = Customer.objects.all()[:3]
    for customer in customers:
        print(f"\nKhách hàng: {customer.full_name}")
        print(f"  - province_id: {customer.province_id}")
        print(f"  - ward_id: {customer.ward_id}")
        
        # Kiểm tra trực tiếp province và ward
        try:
            if customer.province:
                print(f"  - province: {customer.province.name} (code: {customer.province.code})")
            else:
                print(f"  - province: None")
        except Exception as e:
            print(f"  - province error: {e}")
        
        try:
            if customer.ward:
                print(f"  - ward: {customer.ward.name} (code: {customer.ward.code})")
            else:
                print(f"  - ward: None")
        except Exception as e:
            print(f"  - ward error: {e}")
        
        # Test serializer
        print(f"  - Testing serializer...")
        try:
            serializer = CustomerSerializer(customer)
            data = serializer.data
            
            print(f"    province_code: {data.get('province_code')}")
            print(f"    ward_code: {data.get('ward_code')}")
            print(f"    province_name: {data.get('province_name')}")
            print(f"    ward_name: {data.get('ward_name')}")
            
        except Exception as e:
            print(f"    Serializer error: {e}")

if __name__ == "__main__":
    test_serializer_with_debug()
