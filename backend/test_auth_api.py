#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

print("=== TEST API WITH AUTHENTICATION ===")

# Create or get a test user
user, created = User.objects.get_or_create(
    username='testuser',
    defaults={
        'email': 'test@example.com',
        'first_name': 'Test',
        'last_name': 'User'
    }
)

if created:
    user.set_password('testpass123')
    user.save()
    print("Created test user")
else:
    print("Using existing test user")

# Get JWT token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

print(f"Access token: {access_token[:50]}...")

# Test API call
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

try:
    response = requests.get('http://localhost:8000/api/appointments/appointments/', headers=headers)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Got {len(data.get('results', data))} appointments")
        
        # Print first appointment details
        if data.get('results'):
            first_app = data['results'][0]
        else:
            first_app = data[0] if data else None
            
        if first_app:
            print(f"\nFirst appointment:")
            print(f"  ID: {first_app.get('id')}")
            print(f"  Customer: {first_app.get('customer_name')}")
            print(f"  Services: {first_app.get('services', [])}")
            print(f"  Service Names: {first_app.get('service_names', '')}")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Request error: {e}")
