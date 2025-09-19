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
from customers.models import Customer, Service, Branch
from users.models import User

def check_data():
    print("=== CHECKING DATABASE DATA ===")
    
    # Check appointments
    appointments = Appointment.objects.all()
    print(f"Total appointments: {appointments.count()}")
    
    if appointments.exists():
        print("\n=== SAMPLE APPOINTMENTS ===")
        for apt in appointments[:5]:
            print(f"ID: {apt.id}")
            print(f"Customer: {apt.customer_name}")
            print(f"Date: {apt.appointment_date}")
            print(f"Time: {apt.appointment_time}")
            print(f"Doctor: {apt.doctor}")
            print(f"Status: {apt.status}")
            print("---")
    else:
        print("No appointments found!")
    
    # Check customers
    customers = Customer.objects.all()
    print(f"\nTotal customers: {customers.count()}")
    
    # Check services
    services = Service.objects.all()
    print(f"Total services: {services.count()}")
    
    # Check doctors
    doctors = User.objects.filter(role='doctor')
    print(f"Total doctors: {doctors.count()}")
    
    # Check branches
    branches = Branch.objects.all()
    print(f"Total branches: {branches.count()}")

if __name__ == "__main__":
    check_data()
