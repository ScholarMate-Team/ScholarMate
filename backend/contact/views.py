from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .serializers import ContactMessageSerializer
from .models import ContactMessage

class ContactCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR",""))
        ip = ip.split(",")[0].strip() if ip else None

        # 60초 간 단순 레이트리밋(IP당)
        one_min_ago = timezone.now() - timedelta(seconds=60)
        if ContactMessage.objects.filter(created_at__gte=one_min_ago, ip_address=ip).exists():
            return Response({"detail":"잠시 후 다시 시도해주세요."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        s = ContactMessageSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(ip_address=ip, user=request.user if request.user.is_authenticated else None)
        return Response({"ok": True}, status=status.HTTP_201_CREATED)
