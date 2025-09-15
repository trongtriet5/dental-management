#!/usr/bin/env python
"""
Script để kiểm tra chi tiết dữ liệu Hà Nội
"""
import os
import sys
import django

# Thiết lập Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from locations.models import Province, Ward
from customers.models import Customer

def check_hanoi_data():
    """Kiểm tra chi tiết dữ liệu Hà Nội"""
    print("=== KIỂM TRA DỮ LIỆU HÀ NỘI ===")
    
    # Kiểm tra tỉnh Hà Nội
    try:
        hanoi = Province.objects.get(code='01')
        print(f"✅ Tỉnh Hà Nội:")
        print(f"  - Code: {hanoi.code}")
        print(f"  - Name: {hanoi.name}")
        print(f"  - Full name: {hanoi.full_name}")
        print(f"  - ID: {hanoi.pk}")
    except Province.DoesNotExist:
        print("❌ Không tìm thấy tỉnh Hà Nội với code '01'")
        return
    except Exception as e:
        print(f"❌ Lỗi khi tìm tỉnh Hà Nội: {e}")
        return
    
    # Kiểm tra phường/xã của Hà Nội
    print(f"\n=== PHƯỜNG/XÃ CỦA HÀ NỘI ===")
    hanoi_wards = Ward.objects.filter(province=hanoi)
    print(f"Số lượng phường/xã của Hà Nội: {hanoi_wards.count()}")
    
    if hanoi_wards.exists():
        print("\nMột số phường/xã của Hà Nội:")
        for ward in hanoi_wards[:10]:
            print(f"  - {ward.code}: {ward.name}")
        
        # Kiểm tra phường Bạch Mai
        try:
            bach_mai = Ward.objects.get(code='01001')
            print(f"\n✅ Phường Bạch Mai:")
            print(f"  - Code: {bach_mai.code}")
            print(f"  - Name: {bach_mai.name}")
            print(f"  - Province: {bach_mai.province.name}")
            print(f"  - ID: {bach_mai.pk}")
        except Ward.DoesNotExist:
            print("\n❌ Không tìm thấy phường Bạch Mai với code '01001'")
            
            # Tìm phường có tên chứa "Bạch Mai"
            bach_mai_wards = Ward.objects.filter(name__icontains='Bạch Mai', province=hanoi)
            if bach_mai_wards.exists():
                print("Tìm thấy phường có tên chứa 'Bạch Mai':")
                for ward in bach_mai_wards:
                    print(f"  - {ward.code}: {ward.name}")
    else:
        print("❌ Không có phường/xã nào của Hà Nội")

def compare_provinces():
    """So sánh Hà Nội với các tỉnh khác"""
    print(f"\n=== SO SÁNH VỚI CÁC TỈNH KHÁC ===")
    
    provinces = Province.objects.all()[:5]
    for province in provinces:
        print(f"\nTỉnh: {province.name} (code: {province.code})")
        wards_count = Ward.objects.filter(province=province).count()
        print(f"  - Số phường/xã: {wards_count}")
        
        if wards_count > 0:
            first_ward = Ward.objects.filter(province=province).first()
            print(f"  - Phường/xã đầu tiên: {first_ward.code} - {first_ward.name}")

def check_customer_data():
    """Kiểm tra dữ liệu khách hàng"""
    print(f"\n=== KIỂM TRA DỮ LIỆU KHÁCH HÀNG ===")
    
    customers = Customer.objects.all()[:5]
    for customer in customers:
        print(f"\nKhách hàng: {customer.full_name}")
        print(f"  - Province: {customer.province}")
        print(f"  - Ward: {customer.ward}")
        
        if customer.province:
            print(f"  - Province name: {customer.province.name}")
            print(f"  - Province code: {customer.province.code}")
        
        if customer.ward:
            print(f"  - Ward name: {customer.ward.name}")
            print(f"  - Ward code: {customer.ward.code}")

if __name__ == "__main__":
    check_hanoi_data()
    compare_provinces()
    check_customer_data()
