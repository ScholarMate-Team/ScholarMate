from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .models import Contact
from .serializers import ContactSerializer

class ContactCreateView(CreateAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        instance = serializer.save()  # DB 저장

        # ----- f-string 내부에 백슬래시가 없도록 미리 전처리 -----
        created_at_str = instance.created_at.strftime("%Y-%m-%d %H:%M:%S")
        msg_html = (instance.message or "").replace("\n", "<br/>")

        subject = "[문의 알림] 새 문의가 도착했습니다"
        text_body = (
            f"이름: {instance.name}\n"
            f"이메일: {instance.email}\n\n"
            f"메시지:\n{instance.message}\n\n"
            f"접수시각: {created_at_str}"
        )
        html_body = (
            "<h3>새 문의가 도착했습니다</h3>"
            f"<p><b>이름:</b> {instance.name}</p>"
            f"<p><b>이메일:</b> {instance.email}</p>"
            f"<p><b>메시지:</b><br/>{msg_html}</p>"
            f"<p><b>접수시각:</b> {created_at_str}</p>"
        )

        to_emails = getattr(settings, "CONTACT_ADMIN_EMAILS", [])
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None)
        if to_emails and from_email:
            try:
                msg = EmailMultiAlternatives(subject, text_body, from_email, to_emails)
                msg.attach_alternative(html_body, "text/html")
                msg.send(fail_silently=True)
            except Exception:
                # 메일 실패는 서비스에 영향 없게 무시(로그만 남기는 정도)
                pass

    def create(self, request, *args, **kwargs):
        super().create(request, *args, **kwargs)
        return Response({"ok": True}, status=status.HTTP_201_CREATED)
