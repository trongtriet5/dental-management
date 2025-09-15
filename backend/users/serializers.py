from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    password_confirm = serializers.CharField(write_only=True, required=False)
    created_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    updated_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    date_of_birth = serializers.DateField(format='%d/%m/%Y', input_formats=['%d/%m/%Y'])
    avatar_url = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 
                 'phone', 'address', 'specialization', 'gender', 'date_of_birth', 
                 'avatar', 'avatar_url', 'bio', 'is_active', 'password', 'password_confirm',
                 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'password_confirm': {'write_only': True, 'required': False},
            'avatar': {'required': False}
        }
    
    def validate(self, attrs):
        # Only validate password if both fields are provided
        if 'password' in attrs and 'password_confirm' in attrs:
            if attrs['password'] != attrs['password_confirm']:
                raise serializers.ValidationError("Mật khẩu không khớp")
            
            # Basic password validation - chỉ kiểm tra độ dài tối thiểu
            if len(attrs['password']) < 6:
                raise serializers.ValidationError("Mật khẩu phải có ít nhất 6 ký tự")
                
        return attrs
    
    def create(self, validated_data):
        password_confirm = validated_data.pop('password_confirm', None)
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        # Remove password fields if not provided
        validated_data.pop('password', None)
        validated_data.pop('password_confirm', None)
        
        # Handle avatar update
        if 'avatar' in validated_data:
            # Delete old avatar if exists
            if instance.avatar:
                instance.delete_old_avatar()
        
        return super().update(instance, validated_data)


class UserListSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    date_of_birth = serializers.DateField(format='%d/%m/%Y', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 
                 'phone', 'is_active', 'created_at', 'date_of_birth']


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'specialization', 'phone']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['full_name'] = f"{instance.last_name} {instance.first_name}"
        return data


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile management"""
    avatar_url = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField(source='get_full_name')
    role_display = serializers.ReadOnlyField(source='get_role_display')
    created_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    updated_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    date_of_birth = serializers.DateField(format='%d/%m/%Y', input_formats=['%d/%m/%Y', '%Y-%m-%d'])
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name',
                 'role', 'role_display', 'phone', 'address', 'specialization', 
                 'gender', 'date_of_birth', 'avatar', 'avatar_url', 'bio', 
                 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'username', 'role', 'is_active', 'created_at', 'updated_at']
    
    def update(self, instance, validated_data):
        # Handle avatar update
        if 'avatar' in validated_data:
            # Delete old avatar if exists
            if instance.avatar:
                instance.delete_old_avatar()
        
        return super().update(instance, validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password_confirm = serializers.CharField(required=True)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mật khẩu cũ không đúng")
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Mật khẩu mới không khớp")
        
        # Basic password validation - chỉ kiểm tra độ dài tối thiểu
        new_password = attrs['new_password']
        if len(new_password) < 6:
            raise serializers.ValidationError("Mật khẩu phải có ít nhất 6 ký tự")
        
        return attrs
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
