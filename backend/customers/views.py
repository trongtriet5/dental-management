from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, date, timedelta
from .models import Customer, Service, Branch
from .serializers import (CustomerSerializer, CustomerListSerializer, CustomerDetailSerializer,
                         ServiceSerializer, BranchSerializer)
from django.http import HttpResponse
import io
from openpyxl import Workbook
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4


class BranchListCreateView(generics.ListCreateAPIView):
    """List and create branches"""
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'address', 'phone']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class BranchDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete branch"""
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]


class ServiceListCreateView(generics.ListCreateAPIView):
    """List and create services"""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'category']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at', 'category']
    ordering = ['name']
    pagination_class = None  # Disable pagination to show all services


class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete service"""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]


class CustomerListCreateView(generics.ListCreateAPIView):
    """List and create customers"""
    queryset = Customer.objects.select_related('branch').prefetch_related('services_used').all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gender', 'branch', 'created_at']
    search_fields = ['first_name', 'last_name', 'phone', 'email']
    ordering_fields = ['first_name', 'last_name', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CustomerListSerializer
        return CustomerSerializer
    
    def perform_create(self, serializer):
        try:
            print(f"Creating customer with data: {serializer.validated_data}")
            serializer.save()
            print(f"Customer created successfully")
        except Exception as e:
            print(f"Error creating customer: {e}")
            raise


class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete customer"""
    queryset = Customer.objects.select_related('branch').prefetch_related('services_used').all()
    serializer_class = CustomerDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def customer_stats(request):
    """Get customer statistics"""
    today = timezone.now().date()
    this_month = today.replace(day=1)
    
    stats = {
        'total_customers': Customer.objects.count(),
        'new_customers_this_month': Customer.objects.filter(created_at__date__gte=this_month).count(),
        'customers_by_gender': Customer.objects.values('gender').annotate(count=Count('id')),
        'customers_by_branch': Customer.objects.values('branch__name').annotate(count=Count('id')),
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_customers(request):
    """Search customers by query"""
    query = request.GET.get('q', '')
    if not query:
        return Response({'customers': []})
    
    customers = Customer.objects.filter(
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query) |
        Q(phone__icontains=query) |
        Q(email__icontains=query)
    )[:10]
    
    serializer = CustomerListSerializer(customers, many=True)
    return Response({'customers': serializer.data})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_customers_excel(request):
    """Export customers to Excel"""
    queryset = Customer.objects.all()
    branch = request.GET.get('branch')
    gender = request.GET.get('gender')
    
    if branch:
        queryset = queryset.filter(branch_id=branch)
    if gender:
        queryset = queryset.filter(gender=gender)

    wb = Workbook()
    ws = wb.active
    ws.title = 'Customers'
    headers = ['ID', 'Họ tên', 'SĐT', 'Email', 'Giới tính', 'Tuổi', 'Chi nhánh', 'Ngày tạo']
    ws.append(headers)
    
    for customer in queryset.select_related('branch'):
        ws.append([
            customer.id,
            customer.full_name,
            customer.phone,
            customer.email or '',
            customer.get_gender_display(),
            customer.age,
            customer.branch.name,
            customer.created_at.strftime('%Y-%m-%d'),
        ])
    
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename=customers.xlsx'
    return response


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_customers_pdf(request):
    """Export customers to PDF"""
    queryset = Customer.objects.all()
    branch = request.GET.get('branch')
    gender = request.GET.get('gender')
    
    if branch:
        queryset = queryset.filter(branch_id=branch)
    if gender:
        queryset = queryset.filter(gender=gender)

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 50
    p.setFont('Helvetica-Bold', 14)
    p.drawString(50, y, 'Danh sách khách hàng')
    y -= 30
    p.setFont('Helvetica-Bold', 10)
    p.drawString(50, y, 'Họ tên | SĐT | Email | Giới tính | Tuổi | Chi nhánh')
    y -= 15
    p.setFont('Helvetica', 10)
    
    for customer in queryset.select_related('branch'):
        row = f"{customer.full_name} | {customer.phone} | {customer.email or ''} | {customer.get_gender_display()} | {customer.age} | {customer.branch.name}"
        p.drawString(50, y, row)
        y -= 14
        if y < 50:
            p.showPage()
            y = height - 50
    
    p.showPage()
    p.save()
    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename=customers.pdf'
    return response


# Fix payments view
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from financials.models import Payment


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def debug_customers(request):
    """Debug endpoint để kiểm tra khách hàng và dịch vụ"""
    customers_with_services = Customer.objects.filter(services_used__isnull=False).distinct()
    
    result = {
        'customers_with_services': customers_with_services.count(),
        'customers': []
    }
    
    for customer in customers_with_services:
        services = customer.services_used.all()
        total_price = sum(service.price for service in services)
        
        payments = Payment.objects.filter(customer=customer)
        
        customer_data = {
            'id': customer.id,
            'name': customer.full_name,
            'services': [{'name': s.name, 'price': s.price} for s in services],
            'total_price': total_price,
            'payments_count': payments.count(),
            'payments': [{'id': p.id, 'amount': p.amount, 'services_count': p.services.count()} for p in payments]
        }
        result['customers'].append(customer_data)
    
    return Response(result)


@require_http_methods(["POST"])
@login_required
def fix_payments_view(request):
    """API endpoint để sửa các Payment records hiện có"""
    try:
        # Lấy tất cả customers có services
        customers_with_services = Customer.objects.filter(services_used__isnull=False).distinct()
        fixed_count = 0
        
        for customer in customers_with_services:
            services = customer.services_used.all()
            total_price = sum(service.price for service in services)
            
            # Kiểm tra Payment records hiện có
            payments = Payment.objects.filter(customer=customer)
            
            if payments.count() == 0:
                # Tạo Payment mới
                payment = Payment.objects.create(
                    customer=customer,
                    branch=customer.branch,
                    amount=total_price,
                    payment_method='cash',
                    notes=f'Tự động tạo từ dịch vụ khách hàng'
                )
                payment.services.set(services)
                fixed_count += 1
                
            else:
                # Cập nhật Payment hiện có
                for payment in payments:
                    payment.services.set(services)
                    payment.amount = total_price
                    payment.save()
                    fixed_count += 1
        
        return JsonResponse({
            'success': True,
            'message': f'Đã sửa {fixed_count} Payment records',
            'customers_processed': customers_with_services.count()
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)