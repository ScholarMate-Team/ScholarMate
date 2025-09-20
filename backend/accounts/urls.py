# accounts/urls.py
from django.urls import path
from .views import (
    # 이메일 인증 / 아이디 찾기
    SendEmailCodeView, VerifyEmailCodeView,
    UsernameLookupView, RevealUsernameView,

    # 비밀번호 재설정 (코드 인증 기반)
    SendPwResetCodeView, VerifyPwResetCodeView, ResetPasswordWithCodeView,
)

urlpatterns = [
    # =========================
    # 이메일 인증 (공용)
    # =========================
    path("email/send-code/",   SendEmailCodeView.as_view(),   name="send-email-code"),
    path("email/verify-code/", VerifyEmailCodeView.as_view(), name="verify-email-code"),

    # =========================
    # 아이디 찾기
    # =========================
    path("users/lookup-username/",   UsernameLookupView.as_view(), name="lookup-username"),
    path("account/reveal-username/", RevealUsernameView.as_view(), name="reveal-username"),

    # =========================
    # 비밀번호 재설정 (코드 인증 즉시 변경)
    # =========================
    path("password/send-code/",       SendPwResetCodeView.as_view(),    name="password-send-code"),
    path("password/verify-code/",     VerifyPwResetCodeView.as_view(),  name="password-verify-code"),
    path("password/reset-with-code/", ResetPasswordWithCodeView.as_view(), name="password-reset-with-code"),
]
