from django.core.management.base import BaseCommand
from scholarships.models import Scholarship, RawScholarship
import requests
from datetime import datetime
from datetime import date
from django.conf import settings

API_URL = "https://api.odcloud.kr/api/15028252/v1/uddi:ccd5ddd5-754a-4eb8-90f0-cb9bce54870b"
SERVICE_KEY = settings.SERVICE_KEY


# ---------- URL 유틸 ----------
def normalize_url(u: str | None) -> str | None:
    if not u or not isinstance(u, str):
        return None
    v = u.strip()
    if not v or v.lower() in ("#", "null", "none"):
        return None
    if not v.lower().startswith(("http://", "https://")):
        v = "https://" + v.lstrip("/")
    return v


def pick_homepage(item: dict) -> str | None:
    """공공데이터의 다양한 키에서 홈페이지 주소를 추출한다."""
    candidates = [
        "홈페이지", "홈페이지URL", "홈페이지주소",
        "사이트URL", "URL", "링크", "Link", "website",
    ]
    for key in candidates:
        val = item.get(key)
        if isinstance(val, str) and val.strip():
            n = normalize_url(val)
            if n:
                return n
    return None

# 연도를 2025로 강제 변경
def force_year_2025(d: date | None) -> date | None:
    if not d:
        return None
    try:
        return d.replace(year=2025)
    except ValueError:
        # 2월 29일 같은 윤년 문제 처리
        return d.replace(year=2025, day=min(d.day, 28))
# -----------------------------

def adjust_year_with_order(start: date | None, end: date | None):
    """
    시작일은 2025년으로 고정.
    마감일도 2025년으로 맞추되,
    마감일이 시작일보다 이르면 → 2026년으로 자동 조정.
    """
    if not start and not end:
        return None, None

    new_start = force_year_2025(start)

    if end:
        new_end = force_year_2025(end)
        if new_end < new_start:
            try:
                new_end = new_end.replace(year=2026)
            except ValueError:
                new_end = new_end.replace(year=2026, day=min(new_end.day, 28))
    else:
        new_end = None

    return new_start, new_end


class Command(BaseCommand):
    help = "공공 API에서 장학금 정보를 가져와 RawScholarship에 저장하고, 이를 기반으로 Scholarship 테이블을 동기화합니다."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("API에서 원본 장학금 데이터를 가져오는 중..."))
        page = 1

        # 모델 필드 존재 여부(동적으로 체크해 존재하는 컬럼에만 채움)
        raw_fields = {f.name for f in RawScholarship._meta.get_fields()}
        sch_fields = {f.name for f in Scholarship._meta.get_fields()}

        # ---------- 1단계: RawScholarship 적재 ----------
        while True:
            url = f"{API_URL}?serviceKey={SERVICE_KEY}&page={page}&perPage=100&returnType=JSON"
            try:
                response = requests.get(url, timeout=30)
                response.raise_for_status()
            except requests.exceptions.RequestException as e:
                self.stdout.write(self.style.ERROR(f"API 요청 실패: {e}"))
                break

            data = response.json().get("data", [])
            if not data:
                break

            for item in data:
                try:
                    product_name = (item.get("상품명") or "").strip()
                    org_name = (item.get("운영기관명") or "").strip()

                    if not product_name or not org_name:
                        self.stdout.write(self.style.WARNING(f"⚠️ '상품명' 또는 '운영기관명'이 없어 스킵: {item}"))
                        continue

                    product_id = f"{product_name}_{org_name}"
                    recruitment_start_parsed = self.safe_parse_date(item.get("모집시작일"))
                    recruitment_end_parsed = self.safe_parse_date(item.get("모집종료일"))

                    start_adj, end_adj = adjust_year_with_order(
                        recruitment_start_parsed,
                        recruitment_end_parsed
                    )

                    

                    

                    defaults = {
                        "name": product_name,
                        "foundation_name": org_name,
                        "recruitment_start": start_adj,
                        "recruitment_end": end_adj,
                        "university_type": item.get("대학구분", ""),
                        "product_type": item.get("학자금유형구분", ""),
                        "grade_criteria_details": item.get("성적기준 상세내용", ""),
                        "income_criteria_details": item.get("소득기준 상세내용", ""),
                        "support_details": item.get("지원내역 상세내용", ""),
                        "specific_qualification_details": item.get("특정자격 상세내용", ""),
                        "residency_requirement_details": item.get("지역거주여부 상세내용", ""),
                        "selection_method_details": item.get("선발방법 상세내용", ""),
                        "number_of_recipients_details": item.get("선발인원 상세내용", ""),
                        "eligibility_restrictions": item.get("자격제한 상세내용", ""),
                        "required_documents_details": item.get("제출서류 상세내용", ""),
                        "recommendation_required": item.get("추천필요여부 상세내용", "") == "필요",
                        "major_field": item.get("학과구분", ""),
                        "academic_year_type": item.get("학년구분", ""),
                        "managing_organization_type": item.get("운영기관구분", ""),
                    }

                    # ✅ 홈페이지 URL 추출 → RawScholarship에 저장
                    homepage = pick_homepage(item)
                    if homepage:
                        if "url" in raw_fields:
                            defaults["url"] = homepage
                        elif "homepage_url" in raw_fields:
                            defaults["homepage_url"] = homepage

                    RawScholarship.objects.update_or_create(
                        product_id=product_id,
                        defaults=defaults,
                    )
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"❌ RawScholarship 저장 중 오류: {e}"))

            self.stdout.write(f"페이지 {page} 저장 완료...")
            page += 1

        self.stdout.write("\n✅ 원본 데이터 동기화 완료. 이제 추천 시스템 데이터를 가공합니다.")

        # ---------- 2단계: Scholarship 동기화 ----------
        created_count = 0
        updated_count = 0
        raw_scholarships = RawScholarship.objects.all()

        for raw_item in raw_scholarships:
            try:
                # 마감일 지난 장학금 제외
                start, end = adjust_year_with_order(
                    raw_item.recruitment_start,
                    raw_item.recruitment_end
                )

                defaults = {
                    "name": raw_item.name,
                    "foundation_name": raw_item.foundation_name,
                    "recruitment_start": start,
                    "recruitment_end": end,
                    "university_type": raw_item.university_type,
                    "product_type": raw_item.product_type,
                    "grade_criteria_details": raw_item.grade_criteria_details,
                    "income_criteria_details": raw_item.income_criteria_details,
                    "support_details": raw_item.support_details,
                    "specific_qualification_details": raw_item.specific_qualification_details,
                    "residency_requirement_details": raw_item.residency_requirement_details,
                    "selection_method_details": raw_item.selection_method_details,
                    "number_of_recipients_details": raw_item.number_of_recipients_details,
                    "eligibility_restrictions": raw_item.eligibility_restrictions,
                    "required_documents_details": raw_item.required_documents_details,
                    "recommendation_required": raw_item.recommendation_required,
                    "major_field": raw_item.major_field,
                    "academic_year_type": raw_item.academic_year_type,
                    "managing_organization_type": raw_item.managing_organization_type,
                    "region": "",
                    "is_region_processed": False,
                }

                # ✅ Raw의 URL → Scholarship.url로 복사(필드가 있을 때만)
                raw_url = getattr(raw_item, "url", None) or getattr(raw_item, "homepage_url", None)
                raw_url = normalize_url(raw_url)
                if raw_url and "url" in sch_fields:
                    defaults["url"] = raw_url

                Scholarship.objects.update_or_create(
                    product_id=raw_item.product_id,
                    defaults=defaults,
                )
                created_count += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"❌ Scholarship 저장 중 오류: {e}"))

        self.stdout.write(self.style.SUCCESS(f"\n✅ 동기화 완료: {created_count}개 생성/업데이트."))
        # (updated_count를 따로 세고 싶으면 위 update_or_create 결과로 분기해도 됩니다.)

    def safe_parse_date(self, date_str):
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return None
