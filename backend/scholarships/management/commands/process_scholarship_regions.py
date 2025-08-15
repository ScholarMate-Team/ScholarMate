# scholarships/management/commands/process_scholarship_regions.py
import openai
import os
import time
from django.conf import settings
from django.core.management.base import BaseCommand
from scholarships.models import Scholarship

# 중요: settings.py에서 API 키를 불러오도록 수정하는 것을 강력히 권장합니다.
openai.api_key = settings.OPENAI_API_KEY
class Command(BaseCommand):
    help = "GPT를 사용하여 장학금의 비정형 지역 텍스트를 정형화된 지역명으로 변환합니다."

    def handle(self, *args, **options):
        # 아직 처리되지 않은 장학금만 대상으로 함
        scholarships_to_process = Scholarship.objects.filter(is_region_processed=False)
        
        self.stdout.write(f"총 {scholarships_to_process.count()}개의 장학금 지역 정보를 처리합니다.")

        for scholarship in scholarships_to_process:
            text_to_process = scholarship.residency_requirement_details
            
            if not text_to_process or text_to_process.strip() in ["", "해당없음", "없음"]:
                processed_regions = "전국"
            else:
                processed_regions = self.get_regions_from_gpt(text_to_process)

            scholarship.region = processed_regions
            scholarship.is_region_processed = True
            scholarship.save(update_fields=['region', 'is_region_processed'])

            self.stdout.write(self.style.SUCCESS(
                f"✅ '{scholarship.name}' 처리 완료: -> '{processed_regions}'"
            ))
            time.sleep(0.5)


        self.stdout.write(self.style.SUCCESS("모든 장학금 지역 정보 처리가 완료되었습니다."))

    def get_regions_from_gpt(self, text: str) -> str:
        # --- [핵심 수정] ---
        # 시스템 프롬프트를 새롭고 정교한 버전으로 교체합니다.
        system_prompt = """
        당신은 한국 행정구역 전문가이며, 장학금 공고문에서 지역 조건을 분석하는 AI입니다.
        주어진 텍스트에서 해당하는 모든 지역명을 '특별시/광역시/도' 뿐만 아니라 '시/군/구' 단위까지 포함하여, **가장 구체적인 전체 경로(full path)로** 쉼표(,)로 구분된 단일 문자열로 반환해야 합니다.

        **규칙 및 예시:**
        1.  **전체 경로로 변환:** '영월군' -> '강원도 영월군', '수원시' -> '경기도 수원시'
        2.  **약어 변환:** '서울' -> '서울특별시', '충남' -> '충청남도'
        3.  **복합 경로 처리:** '충청남북도' -> '충청남도,충청북도'
        4.  **구체적인 주소 유지:**
            - "강원도 영월군 주천면" -> "강원도 영월군 주천면"
            - "전라남도 화순군 거주" -> "전라남도 화순군"
        5.  **예외 조건 처리:**
            - "서울, 광역시 제외 전국" -> 경기도,강원도,충청북도,충청남도,전라북도,전라남도,경상북도,경상남도,제주특별자치도,세종특별자치시
            - "온라인 과정 이수자" 또는 "해외 유학생" -> "온라인" 또는 "해외"
        6.  **지역명 미포함 시:** 특정 지역이 명시되지 않았으면 "전국"으로 간주합니다.
        7.  **출력 형식:** 다른 설명 없이 오직 쉼표로 구분된 지역명 문자열만 반환하세요.

        이제 분석을 시작합니다.
        """
        # --- [수정 끝] ---
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=0.0
            )
            result = response.choices[0].message['content'].strip()
            return result.split('\n')[0]
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"GPT API 호출 중 오류 발생: {e}"))
            return ""