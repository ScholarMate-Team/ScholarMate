"""
Django settings for ScholarMate_backend project.
"""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
from corsheaders.defaults import default_headers  # ✅ CORS 기본 헤더 확장용

# .env 로드
load_dotenv()

# ===== 경로 & 기본 =====
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "your-default-secret-key-for-dev")
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"
ALLOWED_HOSTS = os.environ.get(
    "DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost,34.228.112.95"
).split(",")

# ===== 국제화(i18n) / 시간대 =====
LANGUAGE_CODE = "ko-kr"
USE_I18N = True
TIME_ZONE = "Asia/Seoul"   # 표시/입력 기준
USE_TZ = True              # DB 저장은 UTC (권장)

# ===== 이메일 인증 코드(커스텀 기능용) =====
EMAIL_VERIFICATION_CODE_TTL = 120
EMAIL_VERIFICATION_COOLDOWN = 60
ENABLE_EMAIL_VERIFICATION = True

# ===== Redis 캐시 =====
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ.get("REDIS_CACHE_URL", "redis://127.0.0.1:6379/1"),
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        "KEY_PREFIX": "scholarmate",
        "TIMEOUT": 300,
    }
}

# ===== 이메일(SMTP) =====
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.naver.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "465"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "joon6390@naver.com")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "False") == "True"
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "True") == "True"
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)

CONTACT_ADMIN_EMAILS = [
    e.strip() for e in os.getenv("CONTACT_ADMIN_EMAILS", "").split(",") if e.strip()
]

# ===== 앱 =====
INSTALLED_APPS = [
    # django 기본
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # 추가
    "django.contrib.sites",        # 비번재설정 링크 도메인 구성용
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework.authtoken",
    "djoser",
    "corsheaders",
    "django_filters",

    # 프로젝트 앱
    "scholarships",
    "userinfor",
    "contact",
    "accounts",
    "notices",
    "community",
]

SITE_ID = 1

# ===== DRF =====
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
}

# ===== JWT =====
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=24),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer", "JWT"),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "ALGORITHM": "HS256",
}

# ===== Djoser (비번재설정 핵심) =====
DJOSER = {
    "USER_ID_FIELD": "username",
    "SERIALIZERS": {
        "user_create": "accounts.serializers.UserCreateSerializer",
        "user": "accounts.serializers.CustomUserSerializer",
        "current_user": "accounts.serializers.CustomUserSerializer",
    },
    # 프론트의 라우트에 맞춤
    "PASSWORD_RESET_CONFIRM_URL": "reset-password?uid={uid}&token={token}",
    # 익명 접근 허용(비번재설정)
    "PERMISSIONS": {
        "password_reset": ["rest_framework.permissions.AllowAny"],
        "password_reset_confirm": ["rest_framework.permissions.AllowAny"],
        "user_create": ["rest_framework.permissions.AllowAny"],
        "user": ["rest_framework.permissions.IsAuthenticated"],
        "set_password": ["rest_framework.permissions.IsAuthenticated"],
    },
    # ✅ Sites 미스매치로 500 방지: 도메인 강제 지정
    "DOMAIN": os.getenv("FRONTEND_DOMAIN", "localhost:5173"),
    "SITE_NAME": "ScholarMate",
}

# ===== 미들웨어 =====
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",            # ✅ 최상단 배치 권장
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ===== CORS/CSRF =====
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://34.228.112.95",
).split(",")
CORS_ALLOW_CREDENTIALS = True

# ❗ 기본 헤더를 유지한 채 필요한 헤더만 추가 (preflight 깨짐 방지)
CORS_ALLOW_HEADERS = list(default_headers) + [
    "authorization",
    "content-type",
]

# (필요시) 노출 헤더
# CORS_EXPOSE_HEADERS = ["Content-Disposition"]

CSRF_TRUSTED_ORIGINS = os.environ.get(
    "CSRF_TRUSTED_ORIGINS",
    "http://localhost:5173,http://34.228.112.95",
).split(",")

ROOT_URLCONF = "ScholarMate_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "ScholarMate_backend.wsgi.application"

# ===== DB =====
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.environ["DATABASE_NAME"],
        "USER": os.environ["DATABASE_USER"],
        "PASSWORD": os.environ["DATABASE_PASSWORD"],
        "HOST": os.environ["DATABASE_HOST"],
        "PORT": os.environ["DATABASE_PORT"],
        # "OPTIONS": {"init_command": "SET sql_mode='STRICT_TRANS_TABLES'"},
    }
}

# ===== 비밀번호 검증 =====
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ===== 정적파일 =====
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# ===== API 키 =====
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("WARNING: OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")

SERVICE_KEY = os.environ.get("SERVICE_KEY")
if not SERVICE_KEY:
    print("WARNING: SERVICE_KEY 환경 변수가 설정되지 않았습니다.")

# ===== Celery =====
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "Asia/Seoul"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
