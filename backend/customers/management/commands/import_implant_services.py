from django.core.management.base import BaseCommand
from customers.models import Service
from django.db import connection
import re


class Command(BaseCommand):
    help = 'Import all dental services data into the database'

    def generate_service_code(self, name):
        """Generate a unique code from service name"""
        # Remove special characters and convert to uppercase
        code = re.sub(r'[^\w\s]', '', name.upper())
        # Replace spaces with underscores
        code = re.sub(r'\s+', '_', code)
        # Limit length to 15 characters to leave room for suffix
        code = code[:15]
        return code

    def create_or_update_service(self, name, description, price, duration, level, level_number):
        """Helper method to create or update service using raw SQL"""
        code = self.generate_service_code(name)
        
        # Determine category based on service name
        if 'IMPLANT' in name.upper():
            category = 'implant'
        elif 'RĂNG SỨ' in name.upper() or 'CROWN' in name.upper():
            category = 'crown'
        elif 'NIỀNG' in name.upper() or 'INVISALIGN' in name.upper() or 'MẮC CÀI' in name.upper():
            category = 'orthodontic'
        else:
            category = 'other'
        
        with connection.cursor() as cursor:
            # Check if service exists
            cursor.execute(
                "SELECT id FROM customers_service WHERE name = %s",
                [name]
            )
            existing_service = cursor.fetchone()
            
            # Generate unique code
            counter = 1
            original_code = code
            while True:
                cursor.execute(
                    "SELECT id FROM customers_service WHERE code = %s",
                    [code]
                )
                if not cursor.fetchone():
                    break
                code = f"{original_code}_{counter}"
                counter += 1
            
            if existing_service:
                # Update existing service
                cursor.execute("""
                    UPDATE customers_service 
                    SET code = %s, category = %s, description = %s, price = %s, 
                        level = %s, level_number = %s, 
                        is_active = true, updated_at = NOW()
                    WHERE name = %s
                """, [code, category, description, price, level, level_number, name])
                return False  # Updated
            else:
                # Create new service
                cursor.execute("""
                    INSERT INTO customers_service 
                    (name, code, category, description, price, 
                     level, level_number, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, true, NOW(), NOW())
                """, [name, code, category, description, price, level, level_number])
                return True  # Created

    def handle(self, *args, **options):
        # Implant services data
        implant_services = [
            {
                'name': 'IMPLANT DIO (HÀN QUỐC)',
                'description': 'Dòng Implant phổ thông - Thích hợp cấy trụ lẻ và toàn hàm',
                'warranty': '7 năm',
                'services': [
                    {'type': 'Trụ lẻ', 'price': 13000000, 'duration': 120, 'level': 3},
                    {'type': 'All-on-4', 'price': 99000000, 'duration': 480, 'level': 3},
                    {'type': 'All-on-6', 'price': 135000000, 'duration': 600, 'level': 3},
                ]
            },
            {
                'name': 'IMPLANT DENTIUM (HÀN QUỐC)',
                'description': 'Dòng Implant phổ thông - Sử dụng trong các trường hợp mất răng lẻ',
                'warranty': '10 năm',
                'services': [
                    {'type': 'Trụ lẻ', 'price': 17000000, 'duration': 120, 'level': 3},
                ]
            },
            {
                'name': 'IMPLANT DENTIUM SUPERLINE (MỸ)',
                'description': 'Dòng Implant phổ thông phổ biến nhất Châu Á - Ưu tiên sử dụng cho trường hợp mất răng lẻ',
                'warranty': '15 năm',
                'services': [
                    {'type': 'Trụ lẻ', 'price': 21000000, 'duration': 120, 'level': 3},
                ]
            },
            {
                'name': 'IMPLANT TEKKA (PHÁP)',
                'description': 'Thương hiệu Implant số 1 tại Pháp - Thích hợp cấy răng lẻ và toàn hàm',
                'warranty': '15 năm',
                'services': [
                    {'type': 'Trụ lẻ', 'price': 25000000, 'duration': 120, 'level': 3},
                    {'type': 'All-on-4', 'price': 160000000, 'duration': 480, 'level': 3},
                    {'type': 'All-on-6', 'price': 180000000, 'duration': 600, 'level': 3},
                ]
            },
            {
                'name': 'IMPLANT MIS C1 (ĐỨC/ISRAEL)',
                'description': 'Thương hiệu Implant số 1 tại Đức - Bác sĩ khuyến nghị cho phương án toàn hàm - Đảm bảo khả năng ăn nhai tốt và tiết kiệm chi phí',
                'warranty': '20 năm',
                'services': [
                    {'type': 'Trụ lẻ', 'price': 22100000, 'duration': 120, 'level': 3},
                    {'type': 'All-on-4', 'price': 144000000, 'duration': 480, 'level': 3},
                    {'type': 'All-on-6', 'price': 162000000, 'duration': 600, 'level': 3},
                ]
            },
            {
                'name': 'IMPLANT SIC (THỤY SĨ/ĐỨC)',
                'description': 'Dòng Implant cao cấp - Thiết kế riêng biệt theo từng vùng xương hàm',
                'warranty': '20 năm',
                'services': [
                    {'type': 'Trụ lẻ', 'price': 26000000, 'duration': 120, 'level': 3},
                ]
            },
            {
                'name': 'IMPLANT ETK (PHÁP)',
                'description': 'Dòng Implant cao cấp - Trụ implant cứng chắc, ăn nhai thuận lợi, bền bỉ theo thời gian',
                'warranty': '20 năm',
                'services': [
                    {'type': 'Trụ lẻ', 'price': 21000000, 'duration': 120, 'level': 3},
                ]
            },
            {
                'name': 'IMPLANT NOBEL BIOCARE (THỤY ĐIỂN/MỸ)',
                'description': 'Dòng Implant cao cấp phổ biến nhất thế giới - Thời gian tích hợp xương nhanh (từ 2-3 tháng) - Ưu tiên sử dụng cho phương án toàn hàm',
                'warranty': '20 năm',
                'services': [
                    {'type': 'Trụ lẻ', 'price': 25500000, 'duration': 120, 'level': 3},
                    {'type': 'All-on-4', 'price': 171000000, 'duration': 480, 'level': 3},
                    {'type': 'All-on-6', 'price': 198000000, 'duration': 600, 'level': 3},
                ]
            },
            {
                'name': 'IMPLANT STRAUMANN SLACTIVE (THỤY SĨ)',
                'description': 'Dòng Implant cao cấp nhất thế giới - Thời gian tích hợp xương nhanh nhất (từ 8-10 tuần) - Sử dụng cho phương án toàn hàm',
                'warranty': '20 năm',
                'services': [
                    {'type': 'Trụ lẻ', 'price': 29750000, 'duration': 120, 'level': 3},
                    {'type': 'All-on-4', 'price': 189000000, 'duration': 480, 'level': 3},
                    {'type': 'All-on-6', 'price': 207000000, 'duration': 600, 'level': 3},
                ]
            },
        ]

        # Dental crown services data
        crown_services = [
            {
                'name': 'Răng sứ kim loại - Ceramco 3 (MỸ)',
                'description': 'Răng sứ kim loại - Bảo hành 3 năm',
                'price': 1000000,
                'duration': 120,
                'level': 'Standard',
                'level_number': 2
            },
            {
                'name': 'Răng sứ kim loại - Chrom-Cobalt (MỸ)',
                'description': 'Răng sứ kim loại - Bảo hành 5 năm',
                'price': 3500000,
                'duration': 120,
                'level': 'Standard',
                'level_number': 2
            },
            {
                'name': 'Răng sứ toàn sứ Đức - Bio Esthetic',
                'description': 'Răng sứ toàn sứ Đức - Bảo hành 10 năm',
                'price': 4500000,
                'duration': 120,
                'level': 'Premium',
                'level_number': 3
            },
            {
                'name': 'Răng sứ toàn sứ Đức - Multilayer DDBio',
                'description': 'Răng sứ toàn sứ Đức - Bảo hành 10 năm',
                'price': 5500000,
                'duration': 120,
                'level': 'Premium',
                'level_number': 3
            },
            {
                'name': 'Răng sứ toàn sứ Đức - Multilayer Cercon HT',
                'description': 'Răng sứ toàn sứ Đức - Bảo hành 10 năm',
                'price': 6500000,
                'duration': 120,
                'level': 'Premium',
                'level_number': 3
            },
            {
                'name': 'Răng sứ toàn sứ MỸ - Lava Plus',
                'description': 'Răng sứ toàn sứ MỸ - Bảo hành 15 năm',
                'price': 8000000,
                'duration': 120,
                'level': 'Premium',
                'level_number': 3
            },
            {
                'name': 'Răng sứ toàn sứ Đức - Nacera 9 Max',
                'description': 'Răng sứ toàn sứ Đức - Bảo hành 15 năm',
                'price': 9000000,
                'duration': 120,
                'level': 'Premium',
                'level_number': 3
            },
            {
                'name': 'Răng sứ toàn sứ Hàn Quốc - Everest Speed',
                'description': 'Răng sứ toàn sứ Hàn Quốc - Bảo hành 20 năm',
                'price': 12000000,
                'duration': 120,
                'level': 'Premium',
                'level_number': 3
            },
            {
                'name': 'Răng sứ toàn sứ MỸ - Lava Esthetic',
                'description': 'Răng sứ toàn sứ MỸ - Bảo hành 20 năm',
                'price': 14000000,
                'duration': 120,
                'level': 'Premium',
                'level_number': 3
            },
        ]

        # Orthodontic services data
        orthodontic_services = [
            # Metal brackets standard
            {'name': 'Mắc cài kim loại tiêu chuẩn - Cấp độ 1', 'price': 35000000, 'duration': 1440, 'level': 'Standard', 'level_number': 1},
            {'name': 'Mắc cài kim loại tiêu chuẩn - Cấp độ 2', 'price': 45000000, 'duration': 1440, 'level': 'Standard', 'level_number': 2},
            {'name': 'Mắc cài kim loại tiêu chuẩn - Cấp độ 3', 'price': 55000000, 'duration': 1440, 'level': 'Standard', 'level_number': 3},
            
            # Metal brackets self-ligating
            {'name': 'Mắc cài kim loại tự buộc/nắp đậy - Cấp độ 1', 'price': 40000000, 'duration': 1440, 'level': 'Standard', 'level_number': 1},
            {'name': 'Mắc cài kim loại tự buộc/nắp đậy - Cấp độ 2', 'price': 50000000, 'duration': 1440, 'level': 'Standard', 'level_number': 2},
            {'name': 'Mắc cài kim loại tự buộc/nắp đậy - Cấp độ 3', 'price': 60000000, 'duration': 1440, 'level': 'Standard', 'level_number': 3},
            
            # Ceramic brackets standard
            {'name': 'Mắc cài sứ tiêu chuẩn - Cấp độ 1', 'price': 45000000, 'duration': 1440, 'level': 'Premium', 'level_number': 1},
            {'name': 'Mắc cài sứ tiêu chuẩn - Cấp độ 2', 'price': 55000000, 'duration': 1440, 'level': 'Premium', 'level_number': 2},
            {'name': 'Mắc cài sứ tiêu chuẩn - Cấp độ 3', 'price': 65000000, 'duration': 1440, 'level': 'Premium', 'level_number': 3},
            
            # Ceramic brackets self-ligating
            {'name': 'Mắc cài sứ tự buộc/nắp đậy - Cấp độ 1', 'price': 50000000, 'duration': 1440, 'level': 'Premium', 'level_number': 1},
            {'name': 'Mắc cài sứ tự buộc/nắp đậy - Cấp độ 2', 'price': 60000000, 'duration': 1440, 'level': 'Premium', 'level_number': 2},
            {'name': 'Mắc cài sứ tự buộc/nắp đậy - Cấp độ 3', 'price': 70000000, 'duration': 1440, 'level': 'Premium', 'level_number': 3},
            
            # Invisalign
            {'name': 'Niềng răng Invisalign - Express', 'price': 50000000, 'duration': 720, 'level': 'Premium', 'level_number': 1},
            {'name': 'Niềng răng Invisalign - Lite (≤14 khay)', 'price': 75000000, 'duration': 720, 'level': 'Premium', 'level_number': 2},
            {'name': 'Niềng răng Invisalign - Moderate (15-26 khay)', 'price': 110000000, 'duration': 1080, 'level': 'Premium', 'level_number': 3},
            {'name': 'Niềng răng Invisalign - Comprehensive (3 năm)', 'price': 120000000, 'duration': 1440, 'level': 'Premium', 'level_number': 3},
            {'name': 'Niềng răng Invisalign - Comprehensive (5 năm)', 'price': 135000000, 'duration': 2160, 'level': 'Premium', 'level_number': 3},
            
            # Children orthodontics
            {'name': 'Niềng răng trẻ em - Mắc cài kim loại tiêu chuẩn - Cấp độ 1', 'price': 11000000, 'duration': 720, 'level': 'Standard', 'level_number': 1},
            {'name': 'Niềng răng trẻ em - Mắc cài kim loại tiêu chuẩn - Cấp độ 2', 'price': 17000000, 'duration': 720, 'level': 'Standard', 'level_number': 2},
            {'name': 'Niềng răng trẻ em - Invisalign - Cấp độ 1', 'price': 74000000, 'duration': 720, 'level': 'Premium', 'level_number': 1},
            {'name': 'Niềng răng trẻ em - Invisalign - Cấp độ 2', 'price': 80000000, 'duration': 720, 'level': 'Premium', 'level_number': 2},
        ]

        # General dental services data
        general_services = [
            # Teeth whitening
            {'name': 'Tẩy trắng răng tại nhà', 'price': 1000000, 'duration': 60, 'level': 'Standard', 'level_number': 1},
            {'name': 'Tẩy trắng nhanh tại phòng khám (Lumacool – USA)', 'price': 2000000, 'duration': 90, 'level': 'Premium', 'level_number': 2},
            
            # Fillings
            {'name': 'Trám răng sữa', 'price': 175000, 'duration': 30, 'level': 'Basic', 'level_number': 1},
            {'name': 'Trám răng mòn cổ', 'price': 300000, 'duration': 45, 'level': 'Standard', 'level_number': 1},
            {'name': 'Trám răng sâu men', 'price': 300000, 'duration': 45, 'level': 'Standard', 'level_number': 1},
            {'name': 'Trám răng sâu ngà nhỏ', 'price': 350000, 'duration': 60, 'level': 'Standard', 'level_number': 1},
            {'name': 'Trám răng sâu ngà to/vỡ lớn', 'price': 450000, 'duration': 90, 'level': 'Standard', 'level_number': 2},
            {'name': 'Trám kẽ răng', 'price': 400000, 'duration': 60, 'level': 'Standard', 'level_number': 2},
            {'name': 'Đắp mặt răng', 'price': 400000, 'duration': 60, 'level': 'Standard', 'level_number': 2},
            {'name': 'Trám răng sau khi điều trị tủy', 'price': 300000, 'duration': 45, 'level': 'Standard', 'level_number': 1},
            {'name': 'Trám Inlay/Onlay/BioDentine', 'price': 3000000, 'duration': 120, 'level': 'Premium', 'level_number': 3},
            
            # Root canal treatment
            {'name': 'Điều trị tủy răng sữa', 'price': 375000, 'duration': 60, 'level': 'Standard', 'level_number': 1},
            {'name': 'Điều trị tủy răng cửa, răng nanh', 'price': 600000, 'duration': 90, 'level': 'Standard', 'level_number': 2},
            {'name': 'Điều trị tủy răng cối nhỏ', 'price': 800000, 'duration': 120, 'level': 'Standard', 'level_number': 2},
            {'name': 'Điều trị tủy răng cối lớn hàm dưới', 'price': 1000000, 'duration': 150, 'level': 'Standard', 'level_number': 3},
            {'name': 'Điều trị tủy răng cối lớn hàm trên', 'price': 1200000, 'duration': 180, 'level': 'Standard', 'level_number': 3},
            {'name': 'Điều trị tủy lại răng cửa, nanh, cối nhỏ', 'price': 1500000, 'duration': 180, 'level': 'Premium', 'level_number': 3},
            {'name': 'Điều trị tủy lại răng cối lớn', 'price': 2000000, 'duration': 240, 'level': 'Premium', 'level_number': 3},
            
            # Tooth extraction
            {'name': 'Nhổ răng sữa', 'price': 50000, 'duration': 15, 'level': 'Basic', 'level_number': 1},
            {'name': 'Nhổ răng lung lay', 'price': 200000, 'duration': 30, 'level': 'Standard', 'level_number': 1},
            {'name': 'Nhổ răng thường không lung lay', 'price': 500000, 'duration': 45, 'level': 'Standard', 'level_number': 2},
            {'name': 'Nhổ chân răng', 'price': 500000, 'duration': 60, 'level': 'Standard', 'level_number': 2},
            {'name': 'Nhổ/Tiểu phẫu răng khôn hàm trên', 'price': 1000000, 'duration': 90, 'level': 'Premium', 'level_number': 3},
            {'name': 'Nhổ/Tiểu phẫu răng khôn hàm dưới', 'price': 2000000, 'duration': 120, 'level': 'Premium', 'level_number': 3},
            {'name': 'Phẫu thuật nạo u nang – cắt chóp – ghép xương', 'price': 8000000, 'duration': 240, 'level': 'Premium', 'level_number': 3},
            
            # Cleaning and periodontal
            {'name': 'Cạo vôi răng & đánh bóng (vôi ít)', 'price': 200000, 'duration': 30, 'level': 'Basic', 'level_number': 1},
            {'name': 'Cạo vôi răng & đánh bóng (vôi nhiều)', 'price': 300000, 'duration': 45, 'level': 'Standard', 'level_number': 1},
            {'name': 'Cạo vôi răng & đánh bóng (vôi rất nhiều)', 'price': 400000, 'duration': 60, 'level': 'Standard', 'level_number': 2},
            {'name': 'Nạo túi nha chu/ Lật vạt làm sạch gốc răng', 'price': 250000, 'duration': 60, 'level': 'Standard', 'level_number': 2},
            
            # Surgical procedures
            {'name': 'Cắt thắng môi/ má bằng Laser', 'price': 500000, 'duration': 45, 'level': 'Standard', 'level_number': 2},
            {'name': 'Cắt nướu bằng Laser', 'price': 500000, 'duration': 30, 'level': 'Standard', 'level_number': 2},
            {'name': 'Phẫu thuật lật vạt & Tái tạo nụ cười hở lợi', 'price': 10000000, 'duration': 180, 'level': 'Premium', 'level_number': 3},
            {'name': 'Phẫu thuật ghép nướu – Điều trị trụt nướu', 'price': 5000000, 'duration': 120, 'level': 'Premium', 'level_number': 3},
            {'name': 'Phẫu thuật ghép nướu – Điều trị trụt nướu (>= 3 răng)', 'price': 10000000, 'duration': 180, 'level': 'Premium', 'level_number': 3},
            {'name': 'Phẫu thuật gọt xương – Điều trị hàm hô', 'price': 10000000, 'duration': 240, 'level': 'Premium', 'level_number': 3},
        ]

        created_count = 0
        updated_count = 0

        # Process implant services
        for implant_data in implant_services:
            brand_name = implant_data['name']
            brand_description = implant_data['description']
            warranty = implant_data['warranty']
            
            for service_data in implant_data['services']:
                service_name = f"{brand_name} - {service_data['type']}"
                service_description = f"{brand_description}\nBảo hành: {warranty}"
                
                created = self.create_or_update_service(
                    service_name,
                    service_description,
                    service_data['price'],
                    service_data['duration'],
                    'Premium',
                    service_data['level']
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Created: {service_name} - {service_data["price"]:,} VND')
                    )
                else:
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'Updated: {service_name} - {service_data["price"]:,} VND')
                    )

        # Process crown services
        for service_data in crown_services:
            created = self.create_or_update_service(
                service_data['name'],
                service_data['description'],
                service_data['price'],
                service_data['duration'],
                service_data['level'],
                service_data['level_number']
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created: {service_data["name"]} - {service_data["price"]:,} VND')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated: {service_data["name"]} - {service_data["price"]:,} VND')
                )

        # Process orthodontic services
        for service_data in orthodontic_services:
            created = self.create_or_update_service(
                service_data['name'],
                'Dịch vụ chỉnh nha - Niềng răng',
                service_data['price'],
                service_data['duration'],
                service_data['level'],
                service_data['level_number']
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created: {service_data["name"]} - {service_data["price"]:,} VND')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated: {service_data["name"]} - {service_data["price"]:,} VND')
                )

        # Process general dental services
        for service_data in general_services:
            created = self.create_or_update_service(
                service_data['name'],
                'Dịch vụ nha khoa tổng quát',
                service_data['price'],
                service_data['duration'],
                service_data['level'],
                service_data['level_number']
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created: {service_data["name"]} - {service_data["price"]:,} VND')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated: {service_data["name"]} - {service_data["price"]:,} VND')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n🎉 Import completed successfully!\n'
                f'📊 Summary:\n'
                f'   • Implant services: {len(implant_services)} brands\n'
                f'   • Crown services: {len(crown_services)} types\n'
                f'   • Orthodontic services: {len(orthodontic_services)} options\n'
                f'   • General dental services: {len(general_services)} procedures\n'
                f'   • Total services created: {created_count}\n'
                f'   • Total services updated: {updated_count}\n'
                f'   • Grand total: {created_count + updated_count} services'
            )
        )
