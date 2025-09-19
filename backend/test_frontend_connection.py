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

print("=== TEST FRONTEND CONNECTION ===")

# Get user and token
user = User.objects.get(username='testuser')
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

# Test all the APIs that the frontend uses
apis_to_test = [
    '/api/appointments/appointments/',
    '/api/customers/customers/',
    '/api/customers/services/',
    '/api/customers/branches/',
    '/api/users/doctors/',
]

for api in apis_to_test:
    try:
        response = requests.get(f'http://localhost:8000{api}', headers=headers)
        print(f"{api}: Status {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', data)
            if isinstance(results, list):
                print(f"  Got {len(results)} items")
            else:
                print(f"  Response: {type(data)}")
        else:
            print(f"  Error: {response.text[:100]}...")
            
    except Exception as e:
        print(f"{api}: Error - {e}")

print("\n=== TEST COMPLETE ===")
print("If all APIs return 200, the issue is likely in the frontend React components.")
print("Check browser console for JavaScript errors.")
