from django.db.models import F
from rest_framework import viewsets, filters, permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import Notice
from .serializers import NoticeListSerializer, NoticeDetailSerializer

class NoticePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

class NoticeViewSet(viewsets.ModelViewSet):
    """
    GET list/retrieve: AllowAny (비로그인 조회 허용)
    POST/PUT/PATCH/DELETE: IsAdminUser (관리자만)
    """
    queryset = Notice.objects.all()
    pagination_class = NoticePagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content"]
    ordering_fields = ["created_at", "is_pinned"]
    ordering = ["-is_pinned", "-created_at"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        # 일반 조회(list/retrieve)는 공개글만; 관리 액션에서는 전체
        qs = super().get_queryset()
        if self.action in ["list", "retrieve"]:
            return qs.filter(is_published=True)
        return qs

    def get_serializer_class(self):
        return NoticeListSerializer if self.action == "list" else NoticeDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        # 공개글만 조회수 증가 (관리자 미리보기 시 증가 방지)
        obj = self.get_object()
        if obj.is_published:
            Notice.objects.filter(pk=obj.pk).update(view_count=F("view_count") + 1)
            obj.refresh_from_db()
        serializer = self.get_serializer(obj)
        return Response(serializer.data)
