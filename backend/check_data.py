#!/usr/bin/env python
"""
Script để kiểm tra dữ liệu tỉnh/thành phố và khách hàng
"""
import os
import sys
import django

# Thiết lập Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from customers.models import Customer
from locations.models import Province, Ward

def check_data():
    """Kiểm tra dữ liệu tỉnh/thành phố và khách hàng"""
    print('=== KIỂM TRA DỮ LIỆU TỈNH/THÀNH PHỐ ===')
    print(f'Tổng số tỉnh/thành phố: {Province.objects.count()}')
    
    if Province.objects.exists():
        print('\nDanh sách tỉnh/thành phố:')
        for province in Province.objects.all()[:10]:
            print(f'  - Code: {province.code}, Tên: {province.name}')
        
        # Kiểm tra tỉnh có code '01'
        try:
            province_01 = Province.objects.get(code='01')
            print(f'\n✅ Tìm thấy tỉnh với code 01: {province_01.name}')
        except Province.DoesNotExist:
            print('\n❌ Không tìm thấy tỉnh với code 01!')
            
            # Lấy tỉnh đầu tiên
            first_province = Province.objects.first()
            if first_province:
                print(f'Tỉnh đầu tiên: {first_province.code} - {first_province.name}')
    else:
        print('❌ Không có dữ liệu tỉnh/thành phố nào!')
    
    print('\n=== KIỂM TRA DỮ LIỆU PHƯỜNG/XÃ ===')
    print(f'Tổng số phường/xã: {Ward.objects.count()}')
    
    print('\n=== KIỂM TRA KHÁCH HÀNG ===')
    print(f'Tổng số khách hàng: {Customer.objects.count()}')
    
    # Kiểm tra khách hàng có province_id không hợp lệ
    invalid_customers = []
    for customer in Customer.objects.all():
        if customer.province_id:
            try:
                Province.objects.get(code=customer.province_id)
            except Province.DoesNotExist:
                invalid_customers.append(customer)
    
    print(f'Số khách hàng có province_id không hợp lệ: {len(invalid_customers)}')
    if invalid_customers:
        print('Danh sách khách hàng có province_id không hợp lệ:')
        for customer in invalid_customers[:5]:
            print(f'  - {customer.full_name} (ID: {customer.id}, Province ID: {customer.province_id})')
    
    # Kiểm tra khách hàng có ward_id không hợp lệ
    invalid_ward_customers = []
    for customer in Customer.objects.all():
        if customer.ward_id:
            try:
                Ward.objects.get(code=customer.ward_id)
            except Ward.DoesNotExist:
                invalid_ward_customers.append(customer)
    
    print(f'Số khách hàng có ward_id không hợp lệ: {len(invalid_ward_customers)}')
    if invalid_ward_customers:
        print('Danh sách khách hàng có ward_id không hợp lệ:')
        for customer in invalid_ward_customers[:5]:
            print(f'  - {customer.full_name} (ID: {customer.id}, Ward ID: {customer.ward_id})')

if __name__ == "__main__":
    check_data()
