import random
import uuid

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import EmailOnlySerializer  # email 필드만 받는 Serializer

User = get_user_model()

# =========================
# 공용 캐시 키 유틸 (아이디 찾기/이메일 인증)
# =========================
def _code_key(email: str) -> str:
    return f"email_verify:code:{email.lower()}"

def _cooldown_key(email: str) -> str:
    return f"email_verify:cooldown:{email.lower()}"

def _verified_key(email: str) -> str:
    return f"email_verify:verified:{email.lower()}"

def _lookup_cooldown_key(email: str) -> str:
    return f"lookup_username:cooldown:{email.lower()}"


# =========================
# 1) 이메일 인증번호 전송 (공용)
# =========================
class SendEmailCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        if not email:
            return Response({"detail": "이메일을 입력해 주세요."}, status=status.HTTP_400_BAD_REQUEST)

        # 재전송 쿨다운
        if cache.get(_cooldown_key(email)):
            return Response({"detail": "잠시 후 다시 시도해 주세요."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # 6자리 코드 생성
        code = f"{random.randint(0, 999999):06d}"
        ttl = getattr(settings, "EMAIL_VERIFICATION_CODE_TTL", 120)      # 기본 120초
        cooldown = getattr(settings, "EMAIL_VERIFICATION_COOLDOWN", 60)  # 기본 60초

        # 캐시에 코드/쿨다운 저장
        cache.set(_code_key(email), code, ttl)
        cache.set(_cooldown_key(email), True, cooldown)
        cache.delete(_verified_key(email))  # 이전 검증 상태 초기화

        # 메일 발송
        subject = "[ScholarMate] 이메일 인증번호"
        minutes = max(1, ttl // 60)
        message = f"인증번호: {code}\n유효시간: {minutes}분"
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        except Exception as e:
            return Response({"detail": f"메일 전송 실패: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"detail": "인증번호를 전송했습니다.", "ttl": ttl}, status=status.HTTP_200_OK)


# =========================
# 2) 이메일 인증번호 검증 (공용)
# =========================
class VerifyEmailCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        code = (request.data.get("code") or "").strip()
        if not email or not code:
            return Response({"detail": "이메일과 인증번호를 입력해 주세요."}, status=status.HTTP_400_BAD_REQUEST)

        saved = cache.get(_code_key(email))
        if not saved:
            return Response({"detail": "인증번호가 만료되었거나 전송되지 않았습니다."}, status=status.HTTP_400_BAD_REQUEST)
        if code != saved:
            return Response({"detail": "인증번호가 올바르지 않습니다."}, status=status.HTTP_400_BAD_REQUEST)

        # 검증 성공 플래그(10분 유지)
        cache.set(_verified_key(email), True, 600)
        cache.delete(_code_key(email))  # 일회성 사용

        return Response({"detail": "이메일 인증이 완료되었습니다."}, status=status.HTTP_200_OK)


# =========================
# 3) 아이디 찾기: 마스킹된 아이디를 "메일로" 안내
#    (항상 200 응답으로 Enumeration 방지)
# =========================
def _mask_username(u: str) -> str:
    if not u:
        return ""
    if len(u) <= 2:
        return u[0] + "*"
    return u[:2] + "*" * (len(u) - 2)

class UsernameLookupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = EmailOnlySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"].strip()

        # 쿨다운(기본 60초)
        cooldown_ttl = getattr(settings, "LOOKUP_USERNAME_COOLDOWN", 60)
        if cache.get(_lookup_cooldown_key(email)):
            return Response({"detail": "안내 메일이 발송되었습니다. 메일함을 확인해 주세요."},
                            status=status.HTTP_200_OK)

        # 이메일로 username 목록 조회(대소문자 무시)
        usernames = list(User.objects.filter(email__iexact=email).values_list("username", flat=True))

        # 메일 본문(마스킹)
        if usernames:
            masked = [_mask_username(u) for u in usernames]
            body = (
                "안녕하세요,\n\n"
                "요청하신 이메일로 가입된 아이디(일부 마스킹) 목록입니다:\n"
                f"- " + "\n- ".join(masked) + "\n\n"
                "보안을 위해 일부 문자는 *로 표시됩니다.\n"
                "본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.\n"
            )
        else:
            body = (
                "안녕하세요,\n\n"
                "요청하신 이메일로 가입된 아이디가 확인되지 않았습니다.\n"
                "다른 이메일로 가입하셨을 가능성을 확인해 주세요.\n"
                "감사합니다.\n"
            )

        subject = "[ScholarMate] 아이디 안내"
        try:
            send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        except Exception:
            # 메일 오류여도 동일 응답(Enumeration 방지)
            cache.set(_lookup_cooldown_key(email), True, cooldown_ttl)
            return Response({"detail": "안내 메일이 발송되었습니다. 메일함을 확인해 주세요."},
                            status=status.HTTP_200_OK)

        cache.set(_lookup_cooldown_key(email), True, cooldown_ttl)
        return Response({"detail": "안내 메일이 발송되었습니다. 메일함을 확인해 주세요."},
                        status=status.HTTP_200_OK)


# =========================
# 4) 아이디 실명 조회: 이메일 인증 완료 시 실제 username 목록 반환
# =========================
class RevealUsernameView(APIView):
    """
    VerifyEmailCodeView 성공(캐시에 _verified_key(email)=True)한 이메일에 대해
    해당 이메일로 가입된 모든 username을 실명으로 반환한다.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        if not email:
            return Response({"detail": "이메일을 입력해 주세요."}, status=status.HTTP_400_BAD_REQUEST)

        # 이메일 인증 여부 확인(10분 TTL)
        if not cache.get(_verified_key(email)):
            return Response({"detail": "이메일 인증이 필요합니다."}, status=status.HTTP_400_BAD_REQUEST)

        usernames = list(User.objects.filter(email__iexact=email).values_list("username", flat=True))

        # (선택) 일회성 사용 원하면 주석 해제
        # cache.delete(_verified_key(email))

        return Response({"usernames": usernames}, status=status.HTTP_200_OK)


# =====================================================================
# ==================  비밀번호 재설정: 코드 인증 기반  ==================
# =====================================================================

# --- 비밀번호 전용 캐시 키 (기존 키와 분리해서 충돌 방지) ---
def _pw_code_key(email: str, username: str) -> str:
    return f"pw_reset:code:{email.lower()}:{username}"

def _pw_cooldown_key(email: str, username: str) -> str:
    return f"pw_reset:cooldown:{email.lower()}:{username}"

def _pw_session_key(email: str, username: str) -> str:
    return f"pw_reset:session:{email.lower()}:{username}"

class SendPwResetCodeView(APIView):
    """
    비밀번호 재설정용 6자리 코드를 이메일로 전송한다.
    username + email 조합이 실제 계정과 일치할 때만 전송(보안상 응답은 항상 204 가능).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        if not username or not email:
            return Response({"detail": "아이디와 이메일을 입력해 주세요."}, status=status.HTTP_400_BAD_REQUEST)

        # 존재 여부는 노출하지 않고 동일 응답으로 처리해도 되지만,
        # UX를 위해 여기서는 실제 사용자일 때만 메일 전송.
        try:
            User.objects.get(username=username, email__iexact=email)
        except User.DoesNotExist:
            # 계정 노출 방지: 204로 통일
            return Response(status=status.HTTP_204_NO_CONTENT)

        # 쿨다운
        if cache.get(_pw_cooldown_key(email, username)):
            return Response({"detail": "잠시 후 다시 시도해 주세요."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        code = f"{random.randint(0, 999999):06d}"
        ttl = getattr(settings, "PASSWORD_RESET_CODE_TTL", 600)      # 기본 10분
        cooldown = getattr(settings, "PASSWORD_RESET_COOLDOWN", 60)  # 기본 60초

        cache.set(_pw_code_key(email, username), code, ttl)
        cache.set(_pw_cooldown_key(email, username), True, cooldown)
        cache.delete(_pw_session_key(email, username))  # 이전 세션 무효화

        subject = "[ScholarMate] 비밀번호 재설정 인증코드"
        minutes = max(1, ttl // 60)
        message = f"비밀번호 재설정을 위한 인증코드: {code}\n유효시간: {minutes}분"
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        except Exception as e:
            return Response({"detail": f"메일 전송 실패: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_204_NO_CONTENT)


class VerifyPwResetCodeView(APIView):
    """
    사용자가 입력한 코드가 맞으면, 1회용 reset_session(token)을 발급한다.
    이 토큰은 짧은 TTL(기본 15분)로 캐시에 저장되며, 비밀번호 변경 시 검증된다.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        code = (request.data.get("code") or "").strip()
        if not all([username, email, code]):
            return Response({"detail": "아이디, 이메일, 인증코드를 모두 입력해 주세요."}, status=status.HTTP_400_BAD_REQUEST)

        saved = cache.get(_pw_code_key(email, username))
        if not saved:
            return Response({"detail": "인증번호가 만료되었거나 전송되지 않았습니다."}, status=status.HTTP_400_BAD_REQUEST)
        if saved != code:
            return Response({"detail": "인증번호가 올바르지 않습니다."}, status=status.HTTP_400_BAD_REQUEST)

        # 성공 → 코드 일회성 사용 & 세션 토큰 발급
        cache.delete(_pw_code_key(email, username))
        token = uuid.uuid4().hex
        session_ttl = getattr(settings, "PASSWORD_RESET_SESSION_TTL", 900)  # 기본 15분
        cache.set(_pw_session_key(email, username), token, session_ttl)

        return Response({"reset_token": token, "ttl": session_ttl}, status=status.HTTP_200_OK)


class ResetPasswordWithCodeView(APIView):
    """
    reset_token 검증 후, 새 비밀번호로 즉시 변경한다.
    요청 바디: username, email, reset_token, new_password, re_new_password
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        reset_token = (request.data.get("reset_token") or "").strip()
        new_password = (request.data.get("new_password") or "").strip()
        re_new_password = (request.data.get("re_new_password") or "").strip()

        if not all([username, email, reset_token, new_password, re_new_password]):
            return Response({"detail": "필수 값이 누락되었습니다."}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != re_new_password:
            return Response({"new_password": ["비밀번호가 일치하지 않습니다."]}, status=status.HTTP_400_BAD_REQUEST)

        # 세션 토큰 검증
        saved_token = cache.get(_pw_session_key(email, username))
        if not saved_token or saved_token != reset_token:
            return Response({"detail": "토큰이 유효하지 않습니다. 다시 인증해 주세요."}, status=status.HTTP_400_BAD_REQUEST)

        # 사용자 확인
        try:
            user = User.objects.get(username=username, email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "계정을 찾을 수 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        # Django 비밀번호 검증기(설정돼 있으면) 통과 여부 확인
        try:
            validate_password(new_password, user=user)
        except ValidationError as ve:
            return Response({"new_password": ve.messages}, status=status.HTTP_400_BAD_REQUEST)

        # 비밀번호 변경
        user.set_password(new_password)
        user.save(update_fields=["password"])

        # 세션 토큰 일회성 소진
        cache.delete(_pw_session_key(email, username))

        return Response(status=status.HTTP_204_NO_CONTENT)

