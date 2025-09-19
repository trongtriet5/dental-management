#!/usr/bin/env python
import os
import sys
import django
import json

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from appointments.models import Appointment
from appointments.serializers import AppointmentListSerializer

print("=== TEST API SERIALIZATION ===")

# Test serialization
appointments = Appointment.objects.all()
serializer = AppointmentListSerializer(appointments, many=True)

try:
    data = serializer.data
    print(f"Serialization successful! Got {len(data)} appointments")
    
    for i, app_data in enumerate(data):
        print(f"\nAppointment {i+1}:")
        print(f"  ID: {app_data.get('id')}")
        print(f"  Customer: {app_data.get('customer_name')}")
        print(f"  Services: {app_data.get('services', [])}")
        print(f"  Service Names: {app_data.get('service_names', '')}")
        
except Exception as e:
    print(f"Serialization error: {e}")
    import traceback
    traceback.print_exc()
