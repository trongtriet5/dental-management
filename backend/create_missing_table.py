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
from django.core.management import call_command

print("=== CREATING MISSING TABLE ===")

# Create the missing many-to-many table
cursor = connection.cursor()

try:
    # Check if table exists
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_name = 'financials_payment_services'")
    result = cursor.fetchone()
    
    if result:
        print("✅ Table financials_payment_services already exists")
    else:
        print("❌ Table financials_payment_services does not exist")
        print("Creating table...")
        
        # Create the many-to-many table
        create_table_sql = """
        CREATE TABLE financials_payment_services (
            id SERIAL PRIMARY KEY,
            payment_id INTEGER NOT NULL REFERENCES financials_payment(id) ON DELETE CASCADE,
            service_id INTEGER NOT NULL REFERENCES customers_service(id) ON DELETE CASCADE,
            UNIQUE(payment_id, service_id)
        );
        """
        
        cursor.execute(create_table_sql)
        print("✅ Table financials_payment_services created successfully")
        
        # Create indexes for better performance
        cursor.execute("CREATE INDEX idx_financials_payment_services_payment_id ON financials_payment_services(payment_id);")
        cursor.execute("CREATE INDEX idx_financials_payment_services_service_id ON financials_payment_services(service_id);")
        print("✅ Indexes created successfully")
        
except Exception as e:
    print(f"❌ Error creating table: {e}")

print("\n=== TESTING ADMIN DELETION ===")

# Test if we can now delete services
try:
    from customers.models import Service
    
    # Get a test service
    test_service = Service.objects.filter(name__icontains='test').first()
    if not test_service:
        test_service = Service.objects.first()
    
    if test_service:
        print(f"Testing deletion of service: {test_service.name} (ID: {test_service.id})")
        
        # Check if service is used in any payments
        from financials.models import Payment
        payments_using_service = Payment.objects.filter(services=test_service)
        print(f"Services used in {payments_using_service.count()} payments")
        
        # Try to delete the service
        service_name = test_service.name
        test_service.delete()
        print(f"✅ Successfully deleted service: {service_name}")
        
    else:
        print("❌ No services found to test deletion")
        
except Exception as e:
    print(f"❌ Error testing deletion: {e}")

print("\n=== COMPLETE ===")
