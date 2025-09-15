#!/usr/bin/env python
"""
Script để test API customers
"""
import os
import sys
import django

# Thiết lập Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from customers.models import Customer
from locations.models import Province, Ward
from customers.serializers import CustomerListSerializer

def test_customer_api():
    """Test API customers"""
    print("=== TEST API CUSTOMERS ===")
    
    # Kiểm tra số lượng khách hàng
    customers_count = Customer.objects.count()
    print(f"Số lượng khách hàng: {customers_count}")
    
    if customers_count > 0:
        # Test serializer
        try:
            customers = Customer.objects.all()[:5]
            serializer = CustomerListSerializer(customers, many=True)
            print("✅ Serializer hoạt động bình thường")
            print(f"Dữ liệu serializer: {len(serializer.data)} khách hàng")
            
            # Kiểm tra từng khách hàng
            for customer_data in serializer.data:
                print(f"  - {customer_data.get('full_name')}: Province={customer_data.get('province_name')}, Ward={customer_data.get('ward_name')}")
                
        except Exception as e:
            print(f"❌ Lỗi serializer: {e}")
    
    # Kiểm tra tỉnh/thành phố
    print(f"\nSố lượng tỉnh/thành phố: {Province.objects.count()}")
    print(f"Số lượng phường/xã: {Ward.objects.count()}")
    
    # Kiểm tra tỉnh Hà Nội
    try:
        hanoi = Province.objects.get(code='01')
        print(f"✅ Tỉnh Hà Nội: {hanoi.name}")
    except Province.DoesNotExist:
        print("❌ Không tìm thấy tỉnh Hà Nội")

if __name__ == "__main__":
    test_customer_api()
