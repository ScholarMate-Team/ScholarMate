# scholarships/serializers.py
from rest_framework import serializers
from urllib.parse import urlparse
from .models import Wishlist, Scholarship, RawScholarship

# ---------------- URL 정규화 유틸 ----------------
_INVALID = {"", "#", "-", "null", "none", "n/a", "N/A", "해당없음", "없음", "미정", "준비중"}

def _normalize_url(u: str | None) -> str | None:
    if not u or not isinstance(u, str):
        return None
    v = u.strip()
    if v in _INVALID or v.lower() in {t.lower() for t in _INVALID}:
        return None
    if not v.lower().startswith(("http://", "https://")):
        v = "https://" + v.lstrip("/")
    try:
        p = urlparse(v)
        if not p.netloc or "." not in p.netloc:
            return None
        return v
    except Exception:
        return None

def _pick_url_from_model(obj) -> str | None:
    # 모델 객체에서 다양한 후보 필드 지원 (과거 스키마 호환)
    for attr in (
        "url", "homepage_url", "homepageUrl", "homepage",
        "website", "website_url", "home_page",
        "link", "Link", "홈페이지",
    ):
        if hasattr(obj, attr):
            n = _normalize_url(getattr(obj, attr))
            if n:
                return n
    return None
# -------------------------------------------------


class ScholarshipSerializer(serializers.ModelSerializer):
    # 항상 정규화된 url 단일 필드로 노출
    url = serializers.SerializerMethodField()
    reason = serializers.SerializerMethodField()

    class Meta:
        model = Scholarship
        fields = [
            "id",
            "product_id",
            "name",
            "foundation_name",
            "recruitment_start",
            "recruitment_end",
            "university_type",
            "product_type",
            "grade_criteria_details",
            "income_criteria_details",
            "support_details",
            "specific_qualification_details",
            "residency_requirement_details",
            "selection_method_details",
            "number_of_recipients_details",
            "eligibility_restrictions",
            "required_documents_details",
            "recommendation_required",
            "major_field",
            "academic_year_type",
            "managing_organization_type",
            "region",
            "is_region_processed",
            "url",  # ← 표준화된 단일 url
            "reason"
        ]

    def get_url(self, obj: Scholarship) -> str | None:
        # 1) Scholarship 자체 필드에서 시도
        n = _pick_url_from_model(obj)
        if n:
            return n
        # 2) RawScholarship(product_id) 폴백
        if getattr(obj, "product_id", None):
            raw = RawScholarship.objects.filter(product_id=obj.product_id).first()
            if raw:
                n = _pick_url_from_model(raw)
                if n:
                    return n
        return None
    
    def get_reason(self, obj: Scholarship) -> str:
        """
        context에서 GPT 추천 결과를 가져와 product_id 기준으로 reason 반환
        """
        gpt_results = self.context.get("gpt_results", {})
        return gpt_results.get(obj.product_id, "")


class RawScholarshipSerializer(serializers.ModelSerializer):
    # 목록 API 일관성을 위해 여기서도 정규화된 url 하나만 노출
    url = serializers.SerializerMethodField()
    reason = serializers.SerializerMethodField()  # GPT 추천 사유

    class Meta:
        model = RawScholarship
        fields = [
            "id",
            "product_id",
            "name",
            "foundation_name",
            "product_type",
            "recruitment_start",
            "recruitment_end",
            "university_type",
            "academic_year_type",
            "major_field",
            "residency_requirement_details",
            "grade_criteria_details",
            "income_criteria_details",
            "specific_qualification_details",
            "eligibility_restrictions",
            "managing_organization_type",
            "selection_method_details",
            "number_of_recipients_details",
            "required_documents_details",
            "support_details",
            "recommendation_required",
            "url",
            "reason"
        ]

    def get_url(self, obj: RawScholarship) -> str | None:
        return _pick_url_from_model(obj)
    
    def get_reason(self, obj: RawScholarship) -> str:
        gpt_results = self.context.get("gpt_results", {})
        return gpt_results.get(obj.product_id, "")    


class WishlistSerializer(serializers.ModelSerializer):
    # 핵심: nested scholarship을 표준 ScholarshipSerializer로 직렬화
    scholarship = ScholarshipSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ["id", "scholarship", "added_at"]


class CalendarScholarshipSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="scholarship.name")
    deadline = serializers.DateField(source="scholarship.recruitment_end")
    required_documents_details = serializers.CharField(source="scholarship.required_documents_details")

    class Meta:
        model = Wishlist
        fields = ["id", "title", "deadline", "required_documents_details"]

