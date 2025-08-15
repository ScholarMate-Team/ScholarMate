from django.urls import path
from .views import save_scholarship_info, get_scholarship_info

urlpatterns = [
    path("scholarship/save/", save_scholarship_info, name="save_scholarship_info"),  # ✅ 저장 API
    path("scholarship/get/", get_scholarship_info, name="get_scholarship_info"),  # ✅ 조회 API
]
