from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def api_server_status(request):
    return HttpResponse("API 서버가 정상적으로 작동하고 있습니다.")

urlpatterns = [
    # 관리자
    path("admin/", admin.site.urls),

    # Accounts (이메일 인증, 아이디 찾기, 비번 재설정 등)
    path("auth/", include("accounts.urls")),

    # 회원가입 / 회원정보 조회 (djoser)
    path("auth/", include("djoser.urls")),

    # JWT 로그인 / 로그아웃 (djoser.jwt)
    path("auth/", include("djoser.urls.jwt")),

    # 장학금 앱
    path("api/", include("scholarships.urls")),

    # 유저 정보 앱
    path("userinfor/", include("userinfor.urls")),

    # Contact 앱
    path("api/contact/", include("contact.urls")),

    # 서버 상태 확인 (루트 URL)
    path("", api_server_status),

    path("api/", include("notices.urls")),

    path("api/", include("community.urls")),
]
