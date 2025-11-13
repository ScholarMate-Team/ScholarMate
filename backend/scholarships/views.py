# scholarships/views.py
from datetime import datetime, date
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.forms.models import model_to_dict
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from .models import Scholarship, Wishlist, RawScholarship
from .serializers import (
    CalendarScholarshipSerializer,
    WishlistSerializer,
    ScholarshipSerializer,
    RawScholarshipSerializer,
)
from userinfor.models import UserScholarship
from .recommendation import recommend

import re
from urllib.parse import urlparse
import openai
openai.api_key = settings.OPENAI_API_KEY


# -------------------- 유틸: URL 정규화/추출 --------------------
def _normalize_url(u: str) -> str | None:
    """문자열을 안전한 URL로 정규화. 쓰레기값은 None으로."""
    if not u or not isinstance(u, str):
        return None
    v = u.strip()

    # 열면 안 되는 값 (한글/영문 혼합)
    invalid_tokens = {
        "", "#", "-", "null", "none", "n/a", "N/A",
        "해당없음", "없음", "미정", "준비중"
    }
    if v in invalid_tokens or v.lower() in {t.lower() for t in invalid_tokens}:
        return None

    # 스킴 없으면 https 붙이기
    if not re.match(r"^https?://", v, re.IGNORECASE):
        v = "https://" + v.lstrip("/")

    # 호스트 최소 유효성 체크 (도메인에 점 포함)
    try:
        parsed = urlparse(v)
        host = parsed.netloc
        if not host or "." not in host:
            return None
        return v
    except Exception:
        return None


def _pick_from(d: dict) -> str | None:
    for key in ("url", "homepage_url", "homepageUrl", "homepage",
                "website", "website_url", "link", "Link"):
        val = d.get(key)
        if isinstance(val, str) and val.strip():
            u = _normalize_url(val)
            if u:
                return u
    return None


def _extract_url(obj) -> str | None:
    # Django 모델
    if hasattr(obj, "_meta"):
        for attr in ("url", "homepage_url", "website", "link"):
            if hasattr(obj, attr):
                u = _normalize_url(getattr(obj, attr, None))
                if u:
                    return u
        obj = model_to_dict(obj)

    # dict
    if isinstance(obj, dict):
        u = _pick_from(obj)
        if u:
            return u
        for nest in ("scholarship", "meta", "data"):
            inner = obj.get(nest)
            if isinstance(inner, dict):
                u = _pick_from(inner)
                if u:
                    return u
    return None


def _resolve_url_from_product_id(pid: str | int) -> str | None:
    """product_id 기준으로 RawScholarship에서 URL을 찾아 정규화해 반환"""
    if not pid:
        return None
    try:
        raw = RawScholarship.objects.get(product_id=pid)
        return _normalize_url(getattr(raw, "url", None))
    except RawScholarship.DoesNotExist:
        return None
# -------------------------------------------------------------


def get_processed_region_from_text(text: str) -> str:
    """주어진 텍스트를 GPT로 분석하여 정형화된 지역명을 반환합니다."""
    if not text or text.strip().lower() in ["", "해당없음"]:
        return "전국"

    if not openai.api_key:
        print("경고: OpenAI API 키가 설정되지 않아 지역 처리를 건너뜁니다.")
        return ""

    system_prompt = """
    당신은 한국 행정구역 전문가이며, 장학금 공고문에서 지역 조건을 분석하는 AI입니다.
    주어진 텍스트에서 해당하는 모든 지역명을 '특별시/광역시/도' 뿐만 아니라 '시/군/구' 단위까지 포함하여, **가장 구체적인 전체 경로(full path)로** 쉼표(,)로 구분된 단일 문자열로 반환하세요.
    지역이 명시되지 않으면 '전국'으로.
    """
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            temperature=0.0,
            timeout=15,
        )
        result = response.choices[0].message["content"].strip()
        return result.split("\n")[0]
    except Exception as e:
        print(f"오류: GPT 지역 처리 중 오류 발생 - {e}")
        return ""


# ======================= 리스트(전체 장학금) =======================
class ScholarshipListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            qs = RawScholarship.objects.all()

            search_query = request.query_params.get("search", "")
            selected_type = request.query_params.get("type", "")
            sort_order = request.query_params.get("sort", "")

            if search_query:
                qs = qs.filter(
                    Q(name__icontains=search_query) |
                    Q(foundation_name__icontains=search_query)
                )

            if selected_type:
                qs = qs.filter(product_type=selected_type)

            if sort_order == "end_date":
                qs = qs.order_by("recruitment_end")

            try:
                page = int(request.query_params.get("page", 1))
                per_page = int(request.query_params.get("perPage", 10))
            except (ValueError, TypeError):
                page, per_page = 1, 10

            total = qs.count()
            start = max(0, (page - 1) * per_page)
            end = start + per_page
            page_rows = qs[start:end]

            data = RawScholarshipSerializer(page_rows, many=True).data
            return Response({"data": data, "total": total}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"[ScholarshipListView] DB 조회 실패: {e}")
            return Response({"error": "데이터를 불러오는 중 오류가 발생했습니다."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =========================== 위시리스트 ===========================
class ToggleWishlistAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        action = request.data.get("action")
        product_id = request.data.get("product_id")

        if action == "remove" and product_id:
            scholarship = get_object_or_404(Scholarship, product_id=product_id)
            Wishlist.objects.filter(user=request.user, scholarship=scholarship).delete()
            return Response({"status": "removed"})

        scholarship_id = request.data.get("scholarship_id")
        if not scholarship_id:
            return Response({"error": "scholarship_id 필요"}, status=400)

        scholarship = get_object_or_404(Scholarship, id=scholarship_id)
        wishlist, created = Wishlist.objects.get_or_create(user=request.user, scholarship=scholarship)
        if not created:
            wishlist.delete()
            return Response({"status": "removed"})
        return Response({"status": "added"})


class UserWishlistAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = Wishlist.objects.filter(user=request.user).order_by("-added_at")
        return Response(WishlistSerializer(items, many=True).data)


class AddToWishlistFromAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data

        product_id = data.get("product_id") or f"{data.get('name', '')}_{data.get('foundation_name', '')}"
        if not product_id:
            return Response({"error": "product_id 또는 장학금 정보(name, foundation_name)는 필수입니다."},
                            status=status.HTTP_400_BAD_REQUEST)

        scholarship, created = Scholarship.objects.get_or_create(product_id=product_id)

        if created:
            residency_text = (
                data.get("residency_requirement_details", "")
                or data.get("지역거주여부 상세내용", "")
            )

            def parse_date_safely(date_str):
                if date_str and isinstance(date_str, str):
                    try:
                        return parse_date(date_str.split("~")[0].strip())
                    except ValueError:
                        return None
                return None

            scholarship.name = data.get("name")
            scholarship.foundation_name = data.get("foundation_name")
            scholarship.recruitment_start = parse_date_safely(data.get("recruitment_start"))
            scholarship.recruitment_end = parse_date_safely(data.get("recruitment_end"))
            scholarship.university_type = data.get("university_type", "")
            scholarship.product_type = data.get("product_type", "")

            scholarship.grade_criteria_details = data.get("grade_criteria_details", "")
            scholarship.income_criteria_details = data.get("income_criteria_details", "")
            scholarship.support_details = data.get("support_details", "")
            scholarship.specific_qualification_details = data.get("specific_qualification_details", "")
            scholarship.residency_requirement_details = residency_text
            scholarship.selection_method_details = (
                data.get("selection_method_details", "") or data.get("선발방법 상세내용", "")
            )
            scholarship.number_of_recipients_details = (
                data.get("number_of_recipients_details", "") or data.get("선발인원 상세내용", "")
            )
            scholarship.eligibility_restrictions = (
                data.get("eligibility_restrictions", "") or data.get("자격제한 상세내용", "")
            )
            scholarship.required_documents_details = (
                data.get("required_documents_details", "") or data.get("제출서류 상세내용", "")
            )
            scholarship.recommendation_required = (
                data.get("recommendation_required", False)
                or (data.get("추천필요여부 상세내용", "") == "필요")
            )
            scholarship.major_field = data.get("major_field", "") or data.get("학과구분", "")
            scholarship.academic_year_type = data.get("academic_year_type", "") or data.get("학년구분", "")
            scholarship.managing_organization_type = data.get("managing_organization_type", "") or data.get("운영기관구분", "")

            for cand in [
                data.get("url"),
                data.get("homepage_url"),
                data.get("website"),
                data.get("website_url"),
                data.get("link"),
                data.get("Link"),
            ]:
                u = _normalize_url(cand) if isinstance(cand, str) else None
                if u:
                    scholarship.url = u
                    break

            try:
                processed_region = get_processed_region_from_text(residency_text)
            except Exception:
                processed_region = ""
            scholarship.region = processed_region
            scholarship.is_region_processed = True

            scholarship.save()

        wishlist, created_w = Wishlist.objects.get_or_create(user=request.user, scholarship=scholarship)
        return Response({"status": "added" if created_w else "exists"}, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_from_wishlist(request, pk):
    try:
        wishlist = Wishlist.objects.get(user=request.user, scholarship__id=pk)
        wishlist.delete()
        return Response({"status": "deleted"}, status=200)
    except Wishlist.DoesNotExist:
        return Response({"error": "해당 장학금이 관심 목록에 없습니다."}, status=404)


class MyCalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wishlisted = Wishlist.objects.filter(user=request.user)
        serializer = CalendarScholarshipSerializer(wishlisted, many=True)
        return Response(serializer.data)


# ======================= 추천 장학금(API) =======================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_recommended_scholarships_api(request):
    print(f"DEBUG: [get_recommended_scholarships_api] 호출됨. 사용자: {request.user.username}, ID: {request.user.id}")

    try:
        # 1️⃣ 사용자 프로필 확인
        try:
            user_profile = UserScholarship.objects.get(user=request.user)
            full_region = " ".join(filter(None, [user_profile.region, user_profile.district]))
            print(f"DEBUG: 프로필 OK: {user_profile.name}, 지역: {full_region}")
        except UserScholarship.DoesNotExist:
            return Response(
                {"error": "사용자 프로필을 찾을 수 없습니다. 장학금 추천을 위해 프로필을 먼저 작성해주세요."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 2️⃣ GPT 추천 결과 가져오기
        rec = recommend(request.user.id)
        if not rec:
            return Response({"scholarships": []}, status=status.HTTP_200_OK)

        # 3️⃣ GPT 결과를 dict로 변환 (product_id -> reason)
        gpt_results_dict = {row.get("product_id"): row.get("reason", "") for row in rec}

        # 4️⃣ 추천 장학금 queryset
        scholarships_queryset = Scholarship.objects.filter(product_id__in=gpt_results_dict.keys())

        # 5️⃣ Serializer 호출 (context에 GPT reason 전달)
        serializer = ScholarshipSerializer(
            scholarships_queryset,
            many=True,
            context={"gpt_results": gpt_results_dict}
        )

        # 6️⃣ url 보정 후 반환
        out = []
        for data in serializer.data:
            product_id = data.get("product_id")
            data["url"] = _extract_url(data) or data.get("url") or _resolve_url_from_product_id(product_id)
            out.append(data)

        print(f"DEBUG: 추천 장학금 개수: {len(out)}")
        return Response({"scholarships": out}, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"장학금 추천 중 오류가 발생했습니다. 다시 시도해 주세요. ({e})"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )