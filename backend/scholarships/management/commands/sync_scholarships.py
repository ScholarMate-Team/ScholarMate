from django.core.management.base import BaseCommand
from scholarships.models import Scholarship
import requests
from datetime import datetime
from django.conf import settings

API_URL = "https://api.odcloud.kr/api/15028252/v1/uddi:ccd5ddd5-754a-4eb8-90f0-cb9bce54870b"
SERVICE_KEY = settings.SERVICE_KEY
class Command(BaseCommand):
    help = "공공 API에서 장학금 정보를 가져와 DB에 동기화합니다. 지역 정보는 후처리를 위해 플래그를 남깁니다."

    def handle(self, *args, **options):
        page = 1
        created_count = 0
        updated_count = 0
        skipped_count = 0

        while True:
            url = f"{API_URL}?serviceKey={SERVICE_KEY}&page={page}&perPage=100&returnType=JSON"
            try:
                response = requests.get(url, timeout=30) # 타임아웃 설정
                response.raise_for_status() # 2xx 상태 코드가 아니면 예외 발생
            except requests.exceptions.RequestException as e:
                self.stdout.write(self.style.ERROR(f"API 요청 실패: {e}"))
                break

            data = response.json().get("data", [])
            if not data:
                break

            for item in data:
                product_name = item.get("상품명", "").strip()
                org_name = item.get("운영기관명", "").strip()

                if not product_name or not org_name:
                    self.stdout.write(self.style.WARNING(f"⚠️ '상품명' 또는 '운영기관명'이 없어 해당 항목 스킵: {item}"))
                    skipped_count += 1
                    continue

                recruitment_start_parsed = self.safe_parse_date(item.get("모집시작일"))
                if recruitment_start_parsed is None:
                    self.stdout.write(
                        self.style.WARNING(
                            f"⚠️ '{product_name} - {org_name}'의 모집시작일이 없거나 유효하지 않아 스킵합니다."
                        )
                    )
                    skipped_count += 1
                    continue

                recruitment_end_parsed = self.safe_parse_date(item.get("모집종료일"))

                product_id = f"{product_name}_{org_name}"

                # --- [핵심 수정 부분] ---
                defaults = {
                    'name': product_name,
                    'foundation_name': org_name,
                    'recruitment_start': recruitment_start_parsed,
                    'recruitment_end': recruitment_end_parsed,
                    'university_type': item.get("대학구분", ""),
                    'product_type': item.get("학자금유형구분", ""),
                    'grade_criteria_details': item.get("성적기준 상세내용", ""),
                    'income_criteria_details': item.get("소득기준 상세내용", ""),
                    'support_details': item.get("지원내역 상세내용", ""),
                    'specific_qualification_details': item.get("특정자격 상세내용", ""),
                    'residency_requirement_details': item.get("지역거주여부 상세내용", ""), # 원본 텍스트는 그대로 저장
                    'selection_method_details': item.get("선발방법 상세내용", ""),
                    'number_of_recipients_details': item.get("선발인원 상세내용", ""),
                    'eligibility_restrictions': item.get("자격제한 상세내용", ""),
                    'required_documents_details': item.get("제출서류 상세내용", ""),
                    'recommendation_required': item.get("추천필요여부 상세내용", "") == "필요",
                    'major_field': item.get("학과구분", ""),
                    'academic_year_type': item.get("학년구분", ""),
                    'managing_organization_type': item.get("운영기관구분", ""),
                    
                    # 'region' 필드는 여기서 채우지 않습니다 (기본값인 ''로 저장됨).
                    # 대신, 후처리가 필요하다는 플래그를 남깁니다.
                    'is_region_processed': False,
                }
                # --- [수정 끝] ---

                try:
                    obj, created = Scholarship.objects.update_or_create(
                        product_id=product_id,
                        defaults=defaults
                    )
                    
                    # 새로 생성된 경우에만 카운트, 업데이트는 변경사항이 있을 때만 세는 것이 더 정확할 수 있음
                    # 여기서는 기존 로직 유지
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                        
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"❌ '{product_id}' 저장 중 오류 발생: {e}"))
                    skipped_count += 1

            self.stdout.write(f"페이지 {page} 처리 완료...")
            page += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ 동기화 완료: {created_count}개 생성, {updated_count}개 업데이트, {skipped_count}개 스킵."
            )
        )

    def safe_parse_date(self, date_str):
        if not date_str:
            return None
        try:
            # 다양한 날짜 형식을 시도해볼 수 있습니다.
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return None