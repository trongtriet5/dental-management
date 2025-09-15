from django.db import models

class AdministrativeUnit(models.Model):
    """Đơn vị hành chính"""
    id = models.IntegerField(primary_key=True, verbose_name="ID đơn vị hành chính")
    full_name = models.CharField(max_length=200, verbose_name="Tên đầy đủ")
    full_name_en = models.CharField(max_length=200, blank=True, null=True, verbose_name="Tên đầy đủ tiếng Anh")
    short_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Tên viết tắt")
    short_name_en = models.CharField(max_length=100, blank=True, null=True, verbose_name="Tên viết tắt tiếng Anh")
    code_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Mã tên")
    code_name_en = models.CharField(max_length=100, blank=True, null=True, verbose_name="Mã tên tiếng Anh")

    class Meta:
        verbose_name = "Đơn vị hành chính"
        verbose_name_plural = "Đơn vị hành chính"
        db_table = 'administrative_units'
        managed = False

    def __str__(self):
        return self.full_name

class AdministrativeRegion(models.Model):
    """Vùng hành chính"""
    id = models.IntegerField(primary_key=True, verbose_name="ID vùng hành chính")
    name = models.CharField(max_length=100, verbose_name="Tên vùng")
    name_en = models.CharField(max_length=100, blank=True, null=True, verbose_name="Tên vùng tiếng Anh")
    code_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Mã tên")
    code_name_en = models.CharField(max_length=100, blank=True, null=True, verbose_name="Mã tên tiếng Anh")

    class Meta:
        verbose_name = "Vùng hành chính"
        verbose_name_plural = "Vùng hành chính"
        db_table = 'administrative_regions'
        managed = False

    def __str__(self):
        return self.name

class Province(models.Model):
    """Tỉnh/Thành phố"""
    code = models.CharField(max_length=10, primary_key=True, verbose_name="Mã tỉnh/thành phố")
    name = models.CharField(max_length=100, verbose_name="Tên tỉnh/thành phố")
    name_en = models.CharField(max_length=100, blank=True, null=True, verbose_name="Tên tiếng Anh")
    full_name = models.CharField(max_length=200, verbose_name="Tên đầy đủ")
    full_name_en = models.CharField(max_length=200, blank=True, null=True, verbose_name="Tên đầy đủ tiếng Anh")
    code_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Mã tên")
    administrative_unit = models.ForeignKey(AdministrativeUnit, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Đơn vị hành chính")

    class Meta:
        verbose_name = "Tỉnh/Thành phố"
        verbose_name_plural = "Tỉnh/Thành phố"
        ordering = ['name']
        db_table = 'location_provinces'  # Sử dụng bảng có sẵn trong Supabase
        managed = False

    def __str__(self):
        return self.name

class Ward(models.Model):
    """Phường/Xã"""
    code = models.CharField(max_length=10, primary_key=True, verbose_name="Mã phường/xã")
    name = models.CharField(max_length=100, verbose_name="Tên phường/xã")
    name_en = models.CharField(max_length=100, blank=True, null=True, verbose_name="Tên tiếng Anh")
    full_name = models.CharField(max_length=200, verbose_name="Tên đầy đủ")
    full_name_en = models.CharField(max_length=200, blank=True, null=True, verbose_name="Tên đầy đủ tiếng Anh")
    code_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Mã tên")
    province = models.ForeignKey(Province, on_delete=models.CASCADE, to_field='code', db_column='province_code', verbose_name="Tỉnh/Thành phố", default='01')
    administrative_unit = models.ForeignKey(AdministrativeUnit, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Đơn vị hành chính")

    class Meta:
        verbose_name = "Phường/Xã"
        verbose_name_plural = "Phường/Xã"
        ordering = ['name']
        db_table = 'location_wards'  # Sử dụng bảng có sẵn trong Supabase
        managed = False

    def __str__(self):
        return f"{self.name}"
