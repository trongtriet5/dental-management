from django.core.management.base import BaseCommand
from django.db import transaction
import json
import os
from locations.models import Province, Ward


class Command(BaseCommand):
    help = 'Import Vietnamese provinces data from JSON file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='vietnamese-provinces.json',
            help='Path to JSON file containing Vietnamese provinces data'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before importing'
        )

    def handle(self, *args, **options):
        file_path = options['file']
        clear_data = options['clear']
        
        if not os.path.exists(file_path):
            self.stdout.write(
                self.style.ERROR(f'File {file_path} not found!')
            )
            return
        
        # Load JSON data
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error loading JSON file: {e}')
            )
            return
        
        # Clear existing data if requested
        if clear_data:
            self.stdout.write('Clearing existing data...')
            Ward.objects.all().delete()
            Province.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS('Existing data cleared!')
            )
        
        # Import provinces
        self.stdout.write('Importing provinces...')
        provinces_created = 0
        provinces_map = {}  # Map old code to new ID
        
        for province_data in data.get('provinces', []):
            if len(province_data) >= 3:
                old_code = province_data[0]
                name = province_data[1]
                name_en = province_data[2] if len(province_data) > 2 else name
                full_name = province_data[3] if len(province_data) > 3 else name
                province_type = province_data[6] if len(province_data) > 6 else 'Tỉnh'
                
                province, created = Province.objects.get_or_create(
                    name=name,
                    defaults={
                        'type': province_type
                    }
                )
                
                if created:
                    provinces_created += 1
                    self.stdout.write(f'  Created province: {name}')
                
                provinces_map[old_code] = province.id
        
        self.stdout.write(
            self.style.SUCCESS(f'Created {provinces_created} provinces')
        )
        
        # Import wards directly from provinces
        self.stdout.write('Importing wards...')
        wards_created = 0
        
        for ward_data in data.get('wards', []):
            if len(ward_data) >= 8:
                old_code = ward_data[0]
                name = ward_data[1]
                name_en = ward_data[2] if len(ward_data) > 2 else name
                full_name = ward_data[3] if len(ward_data) > 3 else name
                ward_type = ward_data[8] if len(ward_data) > 8 else 'Phường'
                province_code = ward_data[6] if len(ward_data) > 6 else None
                
                if province_code and province_code in provinces_map:
                    province_id = provinces_map[province_code]
                    province = Province.objects.get(id=province_id)
                    
                    ward, created = Ward.objects.get_or_create(
                        name=name,
                        province=province,
                        defaults={
                            'type': ward_type
                        }
                    )
                    
                    if created:
                        wards_created += 1
                        self.stdout.write(f'  Created ward: {name}, {province.name}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Created {wards_created} wards')
        )
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nImport completed!\n'
                f'Total provinces: {Province.objects.count()}\n'
                f'Total wards: {Ward.objects.count()}'
            )
        )
