from rest_framework import serializers
from .models import Branch, Customer, Service


class BranchSerializer(serializers.ModelSerializer):
    """Serializer for Branch model"""
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    
    class Meta:
        model = Branch
        fields = ['id', 'name', 'address', 'phone', 'email', 'manager', 
                 'manager_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for Service model"""
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'level', 'level_number', 
                 'price', 'duration_minutes', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating customers"""
    services_used = ServiceSerializer(many=True, read_only=True)
    services_used_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Service.objects.filter(is_active=True),
        required=False,
        allow_empty=True,
        source='services_used',
        write_only=True
    )
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    province_code = serializers.SerializerMethodField()
    ward_code = serializers.SerializerMethodField()
    province_name = serializers.SerializerMethodField()
    ward_name = serializers.SerializerMethodField()
    date_of_birth = serializers.DateField(format='%d/%m/%Y', input_formats=['%d/%m/%Y', '%Y-%m-%d'])
    created_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    updated_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)

    class Meta:
        model = Customer
        fields = ['id', 'first_name', 'last_name', 'phone', 'email', 
                 'gender', 'date_of_birth', 'province', 'ward', 'province_code', 'ward_code',
                 'street', 'address_old', 'medical_history', 'allergies', 
                 'notes', 'branch', 'branch_name', 'services_used', 'services_used_ids',
                 'province_name', 'ward_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def to_internal_value(self, data):
        """Override to handle province and ward codes"""
        # Convert province and ward codes to IDs
        if 'province' in data and data['province']:
            try:
                from locations.models import Province
                # Normalize province code: handle values like '1' -> '01'
                prov_code = str(data['province']).strip()
                if prov_code.isdigit() and len(prov_code) == 1:
                    prov_code = prov_code.zfill(2)
                province = Province.objects.get(code=prov_code)
                data['province'] = province.pk
            except:
                data['province'] = None
        
        if 'ward' in data and data['ward']:
            try:
                from locations.models import Ward
                # Normalize ward code (defensive strip only; keep exact if given)
                ward_code = str(data['ward']).strip()
                ward = Ward.objects.get(code=ward_code)
                data['ward'] = ward.pk
            except:
                data['ward'] = None

        return super().to_internal_value(data)

    def to_representation(self, instance):
        """Override to ensure services_used is included in response"""
        data = super().to_representation(instance)
        # Ensure services_used is populated after creation/update
        if instance.pk:
            data['services_used'] = ServiceSerializer(instance.services_used.all(), many=True).data
        return data

    def validate_services_used_ids(self, value):
        if value:
            service_ids = [service.id for service in value]
            existing_services = Service.objects.filter(
                id__in=service_ids, 
                is_active=True
            ).count()
            if existing_services != len(service_ids):
                raise serializers.ValidationError(
                    "One or more provided service IDs are invalid or do not exist."
                )
        return value
    
    def validate(self, attrs):
        try:
            # Ensure branch is provided and valid
            if not attrs.get('branch'):
                raise serializers.ValidationError({
                    'branch': 'Branch is required.'
                })
            
            # Validate phone uniqueness for new customers
            phone = attrs.get('phone')
            if phone:
                # Check if this is an update operation
                instance = getattr(self, 'instance', None)
                if instance:
                    # For updates, exclude current instance from uniqueness check
                    if Customer.objects.filter(phone=phone).exclude(pk=instance.pk).exists():
                        raise serializers.ValidationError({
                            'phone': 'A customer with this phone number already exists.'
                        })
                else:
                    # For new customers, check if phone already exists
                    if Customer.objects.filter(phone=phone).exists():
                        raise serializers.ValidationError({
                            'phone': 'A customer with this phone number already exists.'
                        })
            
            return attrs
        except Exception as e:
            print(f"Validation error: {e}")
            raise
    
    def get_province_code(self, obj):
        try:
            if obj.province:
                return obj.province.code
            return None
        except Exception as e:
            print(f"Error getting province_code for {obj.full_name}: {e}")
            return None
    
    def get_ward_code(self, obj):
        try:
            if obj.ward:
                return obj.ward.code
            return None
        except Exception as e:
            print(f"Error getting ward_code for {obj.full_name}: {e}")
            return None
    
    def get_province_name(self, obj):
        try:
            if obj.province:
                return obj.province.name
            return None
        except Exception as e:
            print(f"Error getting province_name for {obj.full_name}: {e}")
            return None
    
    def get_ward_name(self, obj):
        try:
            if obj.ward:
                return obj.ward.name
            return None
        except Exception as e:
            print(f"Error getting ward_name for {obj.full_name}: {e}")
            return None


class CustomerListSerializer(serializers.ModelSerializer):
    """Simplified serializer for customer list views"""
    full_name = serializers.ReadOnlyField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    province_code = serializers.SerializerMethodField()
    ward_code = serializers.SerializerMethodField()
    province_name = serializers.SerializerMethodField()
    ward_name = serializers.SerializerMethodField()
    age = serializers.ReadOnlyField()
    date_of_birth = serializers.DateField(format='%d/%m/%Y', read_only=True)
    created_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'first_name', 'last_name', 'full_name', 'phone', 'email', 
                 'gender', 'date_of_birth', 'age', 'province_code', 'ward_code', 
                 'street', 'province_name', 'ward_name', 'status',
                 'branch', 'branch_name', 'created_at']
    
    def get_province_code(self, obj):
        try:
            return obj.province.code if obj.province else None
        except Exception:
            return None
    
    def get_ward_code(self, obj):
        try:
            return obj.ward.code if obj.ward else None
        except Exception:
            return None
    
    def get_province_name(self, obj):
        try:
            return obj.province.name if obj.province else None
        except Exception:
            return None
    
    def get_ward_name(self, obj):
        try:
            return obj.ward.name if obj.ward else None
        except Exception:
            return None


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for customer detail views"""
    full_name = serializers.ReadOnlyField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    branch_address = serializers.CharField(source='branch.address', read_only=True)
    province_name = serializers.SerializerMethodField()
    ward_name = serializers.SerializerMethodField()
    province_code = serializers.SerializerMethodField()
    ward_code = serializers.SerializerMethodField()
    services_used = ServiceSerializer(many=True, read_only=True)
    age = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    date_of_birth = serializers.DateField(format='%d/%m/%Y', read_only=True)
    created_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    updated_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'first_name', 'last_name', 'full_name', 'phone', 'email', 
                 'gender', 'date_of_birth', 'age', 'province', 'province_name', 'province_code',
                 'ward', 'ward_name', 'ward_code', 'street', 
                 'address_old', 'medical_history', 'allergies', 'notes', 
                 'branch', 'branch_name', 'branch_address', 'services_used', 
                 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_province_name(self, obj):
        try:
            return obj.province.name if obj.province else None
        except Exception:
            return None
    
    def get_ward_name(self, obj):
        try:
            return obj.ward.name if obj.ward else None
        except Exception:
            return None
    
    def get_province_code(self, obj):
        try:
            return obj.province.code if obj.province else None
        except Exception:
            return None
    
    def get_ward_code(self, obj):
        try:
            return obj.ward.code if obj.ward else None
        except Exception:
            return None
