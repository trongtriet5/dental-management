from django.db import migrations

def create_sample_services(apps, schema_editor):
    Service = apps.get_model('customers', 'Service')
    
    services_data = [
        {
            'name': 'Khám tổng quát',
            'description': 'Khám tổng quát răng miệng',
            'price': 200000,
            'duration_minutes': 30,
            'level_number': 1,
            'is_active': True
        },
        {
            'name': 'Cạo vôi răng',
            'description': 'Cạo vôi răng và làm sạch',
            'price': 300000,
            'duration_minutes': 45,
            'level_number': 1,
            'is_active': True
        },
        {
            'name': 'Trám răng',
            'description': 'Trám răng sâu',
            'price': 500000,
            'duration_minutes': 60,
            'level_number': 2,
            'is_active': True
        },
        {
            'name': 'Nhổ răng',
            'description': 'Nhổ răng không phức tạp',
            'price': 800000,
            'duration_minutes': 30,
            'level_number': 2,
            'is_active': True
        },
        {
            'name': 'Bọc răng sứ',
            'description': 'Bọc răng sứ thẩm mỹ',
            'price': 2500000,
            'duration_minutes': 120,
            'level_number': 3,
            'is_active': True
        },
        {
            'name': 'Niềng răng',
            'description': 'Niềng răng chỉnh nha',
            'price': 15000000,
            'duration_minutes': 180,
            'level_number': 3,
            'is_active': True
        }
    ]
    
    for service_data in services_data:
        Service.objects.get_or_create(
            name=service_data['name'],
            defaults=service_data
        )

def reverse_create_sample_services(apps, schema_editor):
    Service = apps.get_model('customers', 'Service')
    Service.objects.filter(
        name__in=[
            'Khám tổng quát',
            'Cạo vôi răng', 
            'Trám răng',
            'Nhổ răng',
            'Bọc răng sứ',
            'Niềng răng'
        ]
    ).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('customers', '0009_alter_service_duration_minutes_alter_service_name_and_more'),
    ]

    operations = [
        migrations.RunPython(create_sample_services, reverse_create_sample_services),
    ]
