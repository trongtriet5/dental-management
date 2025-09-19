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

print("=== CHECKING SERVICECATALOG REFERENCES ===")

cursor = connection.cursor()

# Check what's in customers_servicecatalog_services
cursor.execute("SELECT * FROM customers_servicecatalog_services")
servicecatalog_data = cursor.fetchall()

print(f"Records in customers_servicecatalog_services: {len(servicecatalog_data)}")
for row in servicecatalog_data:
    print(f"  - {row}")

# Check what services are being referenced
cursor.execute("""
    SELECT s.id, s.name, s.code 
    FROM customers_service s 
    WHERE s.id IN (SELECT service_id FROM customers_servicecatalog_services)
""")
referenced_services = cursor.fetchall()

print(f"\nServices referenced in servicecatalog:")
for row in referenced_services:
    print(f"  - ID: {row[0]}, Name: {row[1]}, Code: {row[2]}")

# Check if servicecatalog table has any actual data
cursor.execute("SELECT COUNT(*) FROM customers_servicecatalog")
servicecatalog_count = cursor.fetchone()[0]
print(f"\nTotal servicecatalogs: {servicecatalog_count}")

if servicecatalog_count > 0:
    cursor.execute("SELECT id, name FROM customers_servicecatalog")
    servicecatalogs = cursor.fetchall()
    print("Service catalogs:")
    for row in servicecatalogs:
        print(f"  - ID: {row[0]}, Name: {row[1]}")

print("\n=== SOLUTIONS ===")
print("1. Delete the servicecatalog_services entries first")
print("2. Or delete the entire servicecatalog if not needed")
print("3. Or keep the services that are referenced")

print("\n=== CLEANING UP SERVICECATALOG ===")

try:
    # Option 1: Delete servicecatalog_services entries
    cursor.execute("DELETE FROM customers_servicecatalog_services")
    deleted_count = cursor.rowcount
    print(f"✅ Deleted {deleted_count} servicecatalog_services entries")
    
    # Option 2: Delete empty servicecatalogs
    cursor.execute("DELETE FROM customers_servicecatalog WHERE id NOT IN (SELECT DISTINCT servicecatalog_id FROM customers_servicecatalog_services)")
    deleted_catalogs = cursor.rowcount
    print(f"✅ Deleted {deleted_catalogs} empty servicecatalogs")
    
    print("\n=== TESTING SERVICE DELETION ===")
    
    # Now try to delete service ID=1
    cursor.execute("SELECT name FROM customers_service WHERE id = 1")
    service_name = cursor.fetchone()
    if service_name:
        service_name = service_name[0]
        print(f"Attempting to delete service: {service_name}")
        
        # Check if service is still referenced
        cursor.execute("""
            SELECT COUNT(*) FROM customers_servicecatalog_services 
            WHERE service_id = 1
        """)
        still_referenced = cursor.fetchone()[0]
        
        if still_referenced > 0:
            print(f"❌ Service still referenced in {still_referenced} places")
        else:
            cursor.execute("DELETE FROM customers_service WHERE id = 1")
            print(f"✅ Successfully deleted service: {service_name}")
    
except Exception as e:
    print(f"❌ Error during cleanup: {e}")

print("\n=== FINAL CHECK ===")
cursor.execute("SELECT COUNT(*) FROM customers_servicecatalog_services")
final_count = cursor.fetchone()[0]
print(f"Remaining servicecatalog_services entries: {final_count}")
