from rest_framework import serializers
from .models import Payment, Expense
from customers.serializers import CustomerSerializer, ServiceSerializer, BranchSerializer


class PaymentSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField(source='customer.id', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    services_names = serializers.SerializerMethodField()
    services_details = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=0)
    created_at = serializers.DateTimeField(format='%d/%m/%Y', read_only=True)
    updated_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'customer', 'customer_id', 'customer_name', 'services', 'services_names', 
                 'services_details', 'branch', 'branch_name', 'amount', 'payment_method', 
                 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_services_names(self, obj):
        return [service.name for service in obj.services.all()]
    
    def get_services_details(self, obj):
        return [
            {
                'id': service.id,
                'name': service.name,
                'price': service.price,
                'level_number': service.level_number
            }
            for service in obj.services.all()
        ]
    
    def create(self, validated_data):
        print(f"Creating payment with data: {validated_data}")
        
        # Calculate amount from services if not provided or is 0
        services = validated_data.get('services', [])
        if services and (not validated_data.get('amount') or validated_data.get('amount') == 0):
            # Get service objects to calculate total price
            from customers.models import Service
            service_objects = Service.objects.filter(id__in=services)
            total_amount = sum(service.price for service in service_objects)
            validated_data['amount'] = total_amount
            print(f"Calculated amount from services: {total_amount}")
        
        payment = super().create(validated_data)
        print(f"Created payment: {payment.id}, amount: {payment.amount}")
        return payment


class PaymentListSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField(source='customer.id', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    services_names = serializers.SerializerMethodField()
    services_details = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    customer = serializers.IntegerField(source='customer.id', read_only=True)
    branch = serializers.IntegerField(source='branch.id', read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=0)
    created_at = serializers.DateTimeField(format='%d/%m/%Y', read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'customer', 'customer_id', 'customer_name', 'services_names', 'services_details', 
                 'branch', 'branch_name', 'amount', 'payment_method', 'created_at']
    
    def get_services_names(self, obj):
        return [service.name for service in obj.services.all()]
    
    def get_services_details(self, obj):
        return [
            {
                'id': service.id,
                'name': service.name,
                'price': service.price,
                'level_number': service.level_number
            }
            for service in obj.services.all()
        ]




class ExpenseSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=0)
    expense_date = serializers.DateField(format='%d/%m/%Y', input_formats=['%d/%m/%Y', '%Y-%m-%d'])
    created_at = serializers.DateTimeField(format='%d/%m/%Y', read_only=True)
    updated_at = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    
    class Meta:
        model = Expense
        fields = ['id', 'title', 'description', 'amount', 'category', 'branch', 
                 'branch_name', 'expense_date', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        print(f"Creating expense with data: {validated_data}")
        expense = super().create(validated_data)
        print(f"Created expense: {expense.id}, amount: {expense.amount}")
        return expense
    
    def update(self, instance, validated_data):
        print(f"Updating expense with data: {validated_data}")
        print(f"Original instance: {instance.title}, amount: {instance.amount}")
        expense = super().update(instance, validated_data)
        print(f"Updated expense: {expense.id}, amount: {expense.amount}")
        return expense


class ExpenseListSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=0)
    expense_date = serializers.DateField(format='%d/%m/%Y')
    created_at = serializers.DateTimeField(format='%d/%m/%Y', read_only=True)
    
    class Meta:
        model = Expense
        fields = ['id', 'title', 'description', 'amount', 'category', 'branch_name', 'expense_date', 'created_at']


class FinancialSummarySerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=0)
    total_expenses = serializers.DecimalField(max_digits=10, decimal_places=0)
    pending_payments = serializers.DecimalField(max_digits=10, decimal_places=0)
    total_quoted_amount = serializers.DecimalField(max_digits=10, decimal_places=0)
    period_start = serializers.DateField(format='%d/%m/%Y')
    period_end = serializers.DateField(format='%d/%m/%Y')
    total_customers = serializers.IntegerField()
    today_appointments = serializers.IntegerField()
