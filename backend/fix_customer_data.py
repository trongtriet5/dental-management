#!/usr/bin/env python
"""
Script để sửa dữ liệu khách hàng không hợp lệ
"""
import os
import sys
import django

# Thiết lập Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from customers.models import Customer
from locations.models import Province, Ward

def fix_customer_data():
    """Sửa dữ liệu khách hàng không hợp lệ"""
    print("Đang kiểm tra và sửa dữ liệu khách hàng...")
    
    # Lấy tỉnh đầu tiên làm mặc định (hoặc Hà Nội nếu có)
    default_province = None
    try:
        # Thử lấy Hà Nội trước
        default_province = Province.objects.get(code='01')
        print(f"Sử dụng Hà Nội làm tỉnh mặc định: {default_province.name}")
    except Province.DoesNotExist:
        # Nếu không có Hà Nội, lấy tỉnh đầu tiên
        default_province = Province.objects.first()
        if default_province:
            print(f"Sử dụng tỉnh đầu tiên làm mặc định: {default_province.name}")
    
    if not default_province:
        print("Không tìm thấy tỉnh nào trong database!")
        return
    
    # Lấy phường/xã đầu tiên của tỉnh mặc định làm mặc định
    default_ward = Ward.objects.filter(province=default_province).first()
    
    customers_fixed = 0
    
    for customer in Customer.objects.all():
        fixed = False
        
        # Sửa province_id không hợp lệ
        if customer.province_id:
            try:
                Province.objects.get(code=customer.province_id)
            except Province.DoesNotExist:
                print(f"Sửa province_id cho khách hàng {customer.full_name} (ID: {customer.id}) từ {customer.province_id} thành {default_province.code}")
                customer.province = default_province
                fixed = True
        
        # Sửa ward_id không hợp lệ
        if customer.ward_id:
            try:
                Ward.objects.get(code=customer.ward_id)
            except Ward.DoesNotExist:
                print(f"Sửa ward_id cho khách hàng {customer.full_name} (ID: {customer.id}) từ {customer.ward_id} thành {default_ward.code if default_ward else 'None'}")
                customer.ward = default_ward
                fixed = True
        
        if fixed:
            customer.save()
            customers_fixed += 1
    
    print(f"Đã sửa {customers_fixed} khách hàng có dữ liệu không hợp lệ.")
    
    # Kiểm tra lại
    print("\nKiểm tra lại dữ liệu...")
    invalid_count = 0
    for customer in Customer.objects.all():
        if customer.province_id:
            try:
                Province.objects.get(code=customer.province_id)
            except Province.DoesNotExist:
                invalid_count += 1
        
        if customer.ward_id:
            try:
                Ward.objects.get(code=customer.ward_id)
            except Ward.DoesNotExist:
                invalid_count += 1
    
    if invalid_count == 0:
        print("✅ Tất cả dữ liệu khách hàng đã hợp lệ!")
    else:
        print(f"❌ Vẫn còn {invalid_count} khách hàng có dữ liệu không hợp lệ.")

if __name__ == "__main__":
    fix_customer_data()
