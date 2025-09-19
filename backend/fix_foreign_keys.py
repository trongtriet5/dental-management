#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from django.db import connection

print("=== CHECKING FOREIGN KEY CONSTRAINTS ===")

cursor = connection.cursor()

# Check all foreign key constraints that reference customers_service
cursor.execute("""
    SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'customers_service'
    ORDER BY tc.table_name;
""")

constraints = cursor.fetchall()
print("Foreign key constraints referencing customers_service:")
for row in constraints:
    print(f"  - {row[0]}.{row[1]} -> {row[2]}.{row[3]} (constraint: {row[4]})")

print("\n=== CHECKING DATA IN REFERENCING TABLES ===")

# Check data in each referencing table
for row in constraints:
    table_name = row[0]
    column_name = row[1]
    
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"\n{table_name}: {count} rows")
        
        if count > 0:
            # Show sample data
            cursor.execute(f"SELECT {column_name} FROM {table_name} LIMIT 5")
            sample_data = cursor.fetchall()
            print(f"  Sample {column_name} values: {[row[0] for row in sample_data]}")
            
    except Exception as e:
        print(f"  Error checking {table_name}: {e}")

print("\n=== SUGGESTIONS ===")
print("To fix the deletion issue, you can:")
print("1. Delete the referencing records first")
print("2. Change the foreign key constraint to CASCADE")
print("3. Use Django admin's 'delete_selected' action which handles dependencies")

print("\n=== TESTING CASCADE DELETION ===")

# Test if we can delete a service that has no dependencies
try:
    from customers.models import Service
    
    # Find a service with no dependencies
    cursor.execute("""
        SELECT s.id, s.name 
        FROM customers_service s 
        LEFT JOIN customers_servicecatalog_services css ON s.id = css.service_id
        LEFT JOIN financials_payment_services fps ON s.id = fps.service_id
        WHERE css.service_id IS NULL AND fps.service_id IS NULL
        LIMIT 1
    """)
    
    result = cursor.fetchone()
    if result:
        service_id, service_name = result
        print(f"Found service with no dependencies: {service_name} (ID: {service_id})")
        
        service = Service.objects.get(id=service_id)
        service.delete()
        print(f"✅ Successfully deleted service: {service_name}")
    else:
        print("❌ No services found without dependencies")
        
except Exception as e:
    print(f"❌ Error testing deletion: {e}")
