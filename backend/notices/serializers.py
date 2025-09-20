from rest_framework import serializers
from .models import Notice

class NoticeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = ("id", "title", "is_pinned", "created_at")

class NoticeDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = (
            "id",
            "title",
            "content",
            "is_pinned",
            "is_published",
            "view_count",
            "created_at",
            "updated_at",
        )

    def validate_title(self, v):
        if not v or len(v.strip()) < 2:
            raise serializers.ValidationError("제목은 2자 이상 입력해주세요.")
        return v

    def validate(self, attrs):
        # 고정글은 비공개로 둘 수는 있지만, 보통 공개와 함께 쓰니 경고성 체크 예시
        return attrs
