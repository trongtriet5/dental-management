from django.urls import path
from . import views

urlpatterns = [
    # User management
    path('', views.UserListCreateView.as_view(), name='user-list-create'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('doctors/', views.DoctorListView.as_view(), name='doctor-list'),
    path('staff/', views.StaffListView.as_view(), name='staff-list'),
    path('stats/', views.user_stats, name='user-stats'),
    
    # Profile management
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/change-password/', views.change_password, name='change-password'),
    path('profile/delete-avatar/', views.delete_avatar, name='delete-avatar'),
    
    # Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    
    # Legacy endpoints (for backward compatibility)
    path('profile/legacy/', views.user_profile, name='user-profile-legacy'),
    path('profile/update/legacy/', views.update_profile, name='update-profile-legacy'),
]
