from django.conf import settings
from django.core.cache import cache
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from djoser.serializers import UserSerializer as BaseUserSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers

# 이메일 인증용 캐시 키
def _verified_key(email: str) -> str:
    return f"email_verify:verified:{email.lower()}"

# 회원가입 시 이메일 인증 강제(토글 가능)
class UserCreateSerializer(BaseUserCreateSerializer):
    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not getattr(settings, "ENABLE_EMAIL_VERIFICATION", False):
            return attrs  # 토글 OFF면 기존 흐름 유지
        email = attrs.get("email", "")
        if not email:
            raise serializers.ValidationError({"email": "이메일을 입력해 주세요."})
        if not cache.get(_verified_key(email)):
            raise serializers.ValidationError({"email": "이메일 인증이 필요합니다. 인증번호를 확인해 주세요."})
        return attrs

# 단순 이메일 입력용
class EmailOnlySerializer(serializers.Serializer):
    email = serializers.EmailField()

# ===== 여기부터 추가: /auth/users/me/에 is_staff 내려주기 =====
User = get_user_model()

class CustomUserSerializer(BaseUserSerializer):
    """
    /auth/users/me/ 응답에 is_staff / is_superuser 포함
    """
    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = tuple(BaseUserSerializer.Meta.fields) + ("is_staff", "is_superuser")

