#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from appointments.models import Appointment
from customers.models import Service

print("=== DEBUG APPOINTMENTS ===")

# Check appointments
appointments = Appointment.objects.all()
print(f"Total appointments: {appointments.count()}")

for app in appointments:
    print(f"\nAppointment {app.id}:")
    print(f"  Customer: {app.customer_name}")
    print(f"  Phone: {app.customer_phone}")
    print(f"  Date: {app.appointment_date}")
    print(f"  Services count: {app.services.count()}")
    
    services = app.services.all()
    for service in services:
        print(f"    - Service ID: {service.id}, Name: {service.name}, Code: {service.code}")

print(f"\n=== SERVICES ===")
print(f"Total services: {Service.objects.count()}")

# Check if there are any services with missing fields
services_with_issues = []
for service in Service.objects.all():
    if not service.code or not service.name:
        services_with_issues.append(service)

if services_with_issues:
    print(f"Services with issues: {len(services_with_issues)}")
    for service in services_with_issues:
        print(f"  - ID: {service.id}, Name: '{service.name}', Code: '{service.code}'")
else:
    print("All services look good!")
