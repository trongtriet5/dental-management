#!/usr/bin/env python
"""
Script test đơn giản để kiểm tra Hà Nội
"""
import os
import sys
import django

# Thiết lập Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from locations.models import Province, Ward
from customers.serializers import CustomerSerializer

def test_hanoi():
    """Test Hà Nội"""
    print("=== TEST HÀ NỘI ===")
    
    # Test Province
    try:
        hanoi = Province.objects.get(code='01')
        print(f"✅ Hà Nội: {hanoi.name} (ID: {hanoi.pk})")
    except Exception as e:
        print(f"❌ Lỗi tìm Hà Nội: {e}")
        return
    
    # Test Ward
    try:
        wards = Ward.objects.filter(province=hanoi)
        print(f"✅ Số phường/xã của Hà Nội: {wards.count()}")
        
        if wards.exists():
            print("Một số phường/xã:")
            for ward in wards[:3]:
                print(f"  - {ward.code}: {ward.name}")
    except Exception as e:
        print(f"❌ Lỗi tìm phường/xã: {e}")
    
    # Test serializer với dữ liệu giả
    test_data = {
        'first_name': 'Test',
        'last_name': 'User',
        'phone': '0123456789',
        'gender': 'male',
        'date_of_birth': '1990-01-01',
        'province': '01',  # Code của Hà Nội
        'ward': '01001',   # Code của phường đầu tiên
        'branch': 1
    }
    
    print(f"\n=== TEST SERIALIZER ===")
    serializer = CustomerSerializer(data=test_data)
    
    if serializer.is_valid():
        print("✅ Serializer hợp lệ")
        validated_data = serializer.validated_data
        print(f"Province ID: {validated_data.get('province')}")
        print(f"Ward ID: {validated_data.get('ward')}")
    else:
        print("❌ Serializer không hợp lệ:")
        print(serializer.errors)

if __name__ == "__main__":
    test_hanoi()
