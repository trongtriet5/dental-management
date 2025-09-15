from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from datetime import datetime, timedelta
from .models import User
from .serializers import UserSerializer, UserListSerializer, DoctorSerializer, ProfileSerializer, ChangePasswordSerializer
from customers.models import Customer
from appointments.models import Appointment
from financials.models import Payment, Expense


class IsAdminOrManager(permissions.BasePermission):
    """Custom permission to only allow admin and manager users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['admin', 'manager']

User = get_user_model()


class UserListCreateView(generics.ListCreateAPIView):
    """List and create users"""
    queryset = User.objects.all()
    permission_classes = [IsAdminOrManager]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserListSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete user"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrManager]
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Prevent admin from deleting themselves
        if instance.id == request.user.id:
            return Response(
                {'error': 'Không thể xóa chính mình'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class DoctorListView(generics.ListAPIView):
    """List all doctors"""
    queryset = User.objects.filter(role='doctor', is_active=True)
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]


class StaffListView(generics.ListAPIView):
    """List all staff/consultants"""
    queryset = User.objects.filter(role='creceptionist', is_active=True)
    serializer_class = DoctorSerializer  # Reuse the same serializer
    permission_classes = [permissions.IsAuthenticated]


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update current user profile"""
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password"""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Mật khẩu đã được thay đổi thành công'}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_avatar(request):
    """Delete user avatar"""
    user = request.user
    if user.avatar:
        user.delete_old_avatar()
        user.avatar = None
        user.save()
        return Response({'message': 'Ảnh đại diện đã được xóa thành công'}, status=status.HTTP_200_OK)
    return Response({'error': 'Không có ảnh đại diện để xóa'}, status=status.HTTP_400_BAD_REQUEST)


# Keep old endpoints for backward compatibility
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """Get current user profile (legacy endpoint)"""
    serializer = ProfileSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """Update current user profile (legacy endpoint)"""
    serializer = ProfileSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """Get user statistics"""
    stats = {
        'total_users': User.objects.count(),
        'active_users': User.objects.filter(is_active=True).count(),
        'doctors': User.objects.filter(role='doctor', is_active=True).count(),
        'managers': User.objects.filter(role__in=['admin', 'manager'], is_active=True).count(),
        'staff': User.objects.filter(role='creceptionist', is_active=True).count(),
    }
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    today = datetime.now().date()
    this_month_start = today.replace(day=1)
    
    # Customer stats
    total_customers = Customer.objects.count()
    
    # Appointment stats
    total_appointments = Appointment.objects.count()
    today_appointments = Appointment.objects.filter(appointment_date=today).count()
    
    # Financial stats
    this_month_revenue = Payment.objects.filter(
        payment_date__gte=this_month_start,
        status__in=['paid', 'partial']
    ).aggregate(total=Sum('paid_amount'))['total'] or 0
    
    this_month_expenses = Expense.objects.filter(
        expense_date__gte=this_month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Pending payments
    pending_payments = Payment.objects.filter(
        status='pending'
    ).count()
    
    stats = {
        'total_customers': total_customers,
        'total_appointments': total_appointments,
        'today_appointments': today_appointments,
        'this_month_revenue': this_month_revenue,
        'this_month_expenses': this_month_expenses,
        'pending_payments': pending_payments,
    }
    
    return Response(stats)