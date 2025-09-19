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

print("=== CHECKING DATABASE TABLES ===")

cursor = connection.cursor()

# Check payment-related tables
cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%payment%'")
payment_tables = cursor.fetchall()
print("Payment-related tables:")
for row in payment_tables:
    print(f"  - {row[0]}")

# Check all tables
cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
all_tables = cursor.fetchall()
print(f"\nAll tables ({len(all_tables)}):")
for row in all_tables:
    print(f"  - {row[0]}")

# Check if financials_payment_services exists
cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_name = 'financials_payment_services'")
result = cursor.fetchone()
if result:
    print(f"\n✅ financials_payment_services table EXISTS")
else:
    print(f"\n❌ financials_payment_services table DOES NOT EXIST")

print("\n=== CHECKING MODELS ===")

# Check financials models
try:
    from financials.models import Payment, Expense
    print(f"Payment model: {Payment._meta.db_table}")
    print(f"Expense model: {Expense._meta.db_table}")
    
    # Check Payment fields
    print(f"\nPayment model fields:")
    for field in Payment._meta.get_fields():
        if hasattr(field, 'related_model') and field.related_model:
            print(f"  - {field.name}: {field.related_model._meta.db_table}")
        else:
            print(f"  - {field.name}: {type(field).__name__}")
            
except Exception as e:
    print(f"Error checking financials models: {e}")
