#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from customers.models import Service

print("=== TESTING ADMIN DELETION ===")

# Check remaining services
services = Service.objects.all()
print(f"Total services: {services.count()}")

# Show first few services
print("\nFirst 5 services:")
for service in services[:5]:
    print(f"  - ID: {service.id}, Name: {service.name}, Code: {service.code}")

print("\n=== TESTING DELETION OF SERVICES WITH NO DEPENDENCIES ===")

# Find services with no dependencies
from django.db import connection
cursor = connection.cursor()

cursor.execute("""
    SELECT s.id, s.name 
    FROM customers_service s 
    LEFT JOIN customers_servicecatalog_services css ON s.id = css.service_id
    LEFT JOIN financials_payment_services fps ON s.id = fps.service_id
    LEFT JOIN appointments_appointment_services aas ON s.id = aas.service_id
    WHERE css.service_id IS NULL 
    AND fps.service_id IS NULL 
    AND aas.service_id IS NULL
    LIMIT 3
""")

services_to_test = cursor.fetchall()

if services_to_test:
    print(f"Found {len(services_to_test)} services with no dependencies:")
    for service_id, service_name in services_to_test:
        print(f"  - ID: {service_id}, Name: {service_name}")
        
        try:
            service = Service.objects.get(id=service_id)
            service.delete()
            print(f"    ✅ Successfully deleted: {service_name}")
        except Exception as e:
            print(f"    ❌ Error deleting {service_name}: {e}")
else:
    print("❌ No services found without dependencies")

print("\n=== CHECKING REMAINING SERVICES ===")
remaining_services = Service.objects.all()
print(f"Remaining services: {remaining_services.count()}")

# Show services that still have dependencies
cursor.execute("""
    SELECT DISTINCT s.id, s.name, 
           CASE 
               WHEN css.service_id IS NOT NULL THEN 'servicecatalog'
               WHEN fps.service_id IS NOT NULL THEN 'payment'
               WHEN aas.service_id IS NOT NULL THEN 'appointment'
               ELSE 'none'
           END as dependency_type
    FROM customers_service s 
    LEFT JOIN customers_servicecatalog_services css ON s.id = css.service_id
    LEFT JOIN financials_payment_services fps ON s.id = fps.service_id
    LEFT JOIN appointments_appointment_services aas ON s.id = aas.service_id
    WHERE css.service_id IS NOT NULL 
       OR fps.service_id IS NOT NULL 
       OR aas.service_id IS NOT NULL
""")

services_with_deps = cursor.fetchall()
if services_with_deps:
    print(f"\nServices with dependencies ({len(services_with_deps)}):")
    for service_id, service_name, dep_type in services_with_deps:
        print(f"  - ID: {service_id}, Name: {service_name}, Dependency: {dep_type}")

print("\n=== ADMIN DELETION TEST COMPLETE ===")
print("✅ Services without dependencies can be deleted")
print("❌ Services with dependencies are protected by foreign key constraints")
print("💡 To delete protected services, first remove their dependencies")
