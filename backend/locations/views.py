from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Province, Ward
from .serializers import ProvinceSerializer, WardSerializer

class ProvinceListView(generics.ListAPIView):
    queryset = Province.objects.all()
    serializer_class = ProvinceSerializer
    pagination_class = None
    permission_classes = [AllowAny]

class WardListView(generics.ListAPIView):
    serializer_class = WardSerializer
    pagination_class = None
    permission_classes = [AllowAny]

    def get_queryset(self):
        province_code = self.request.query_params.get('province_code')
        if province_code:
            code = str(province_code).strip()
            # Normalize '1' -> '01' for province codes
            if code.isdigit() and len(code) == 1:
                code = code.zfill(2)
            return Ward.objects.filter(province__code=code)
        return Ward.objects.all()
