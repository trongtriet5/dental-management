from django.contrib import admin
from .models import AdministrativeUnit, AdministrativeRegion, Province, Ward

@admin.register(AdministrativeUnit)
class AdministrativeUnitAdmin(admin.ModelAdmin):
    list_display = ['id', 'full_name', 'short_name']
    search_fields = ['full_name', 'short_name']
    ordering = ['id']

@admin.register(AdministrativeRegion)
class AdministrativeRegionAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'code_name']
    search_fields = ['name', 'code_name']
    ordering = ['id']

@admin.register(Province)
class ProvinceAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'full_name', 'administrative_unit']
    list_filter = ['administrative_unit']
    search_fields = ['name', 'full_name']
    ordering = ['name']

@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'full_name', 'province', 'administrative_unit']
    list_filter = ['province', 'administrative_unit']
    search_fields = ['name', 'full_name']
    ordering = ['province', 'name']
