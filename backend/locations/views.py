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
            return Ward.objects.filter(province__code=province_code)
        return Ward.objects.all()
