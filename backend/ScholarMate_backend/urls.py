from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse # HttpResponse를 가져옵니다.


def api_server_status(request):
    return HttpResponse("API 서버가 정상적으로 작동하고 있습니다.")

urlpatterns = [
    path('admin/', admin.site.urls),
    path("auth/", include("djoser.urls")),  # 회원가입, 회원정보 조회
    path("auth/", include("djoser.urls.jwt")),  # JWT 로그인, 로그아웃
    path('api/', include('scholarships.urls')),
    path('userinfor/', include('userinfor.urls')), 
    path('', api_server_status),
    path("api/contact/", include("contact.urls")),  
]
