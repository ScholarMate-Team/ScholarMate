# scholarships/models.py
from django.db import models
from django.contrib.auth.models import User # User 모델 import 필요 (Wishlist에 사용됨)

class Scholarship(models.Model):
    # 기본 정보
    product_id = models.CharField(max_length=50, unique=True, verbose_name="고유 번호")  # 고유 번호
    name = models.CharField(max_length=255, verbose_name="장학금 이름")  # 장학금 이름
    product_type = models.CharField(max_length=100, verbose_name="장학금 유형")  # 장학금 유형

    # 모집 및 기간
    recruitment_start = models.DateField(verbose_name="모집 시작일", null=True, blank=True) # null=True, blank=True 추가
    recruitment_end = models.DateField(verbose_name="모집 종료일", null=True, blank=True) # null=True, blank=True 추가

    # 대상 및 자격 조건
    university_type = models.CharField(max_length=100, null=True, blank=True, verbose_name="대학 유형")  # 대학 유형 (예: 4년제, 전문대)
    academic_year_type = models.CharField(max_length=255, null=True, blank=True, verbose_name="학년 유형")  # 학년 유형 (예: 1학년, 2학년, 대학원)
    major_field = models.CharField(max_length=255, null=True, blank=True, verbose_name="학과 구분")  # 학과 구분 (예: 공과대학, 인문사회계열, 특정 학과명)
    residency_requirement_details = models.TextField(null=True, blank=True, verbose_name="지역 조건 상세")  # 지역 조건 상세 설명 (예: "서울시 특정 구 거주자")
    grade_criteria_details = models.TextField(null=True, blank=True, verbose_name="성적 기준 상세")  # 성적 기준 상세 (예: "직전 학기 평점 3.5 이상")
    income_criteria_details = models.TextField(null=True, blank=True, verbose_name="소득 기준 상세")  # 소득 기준 상세 (예: "소득 분위 8분위 이내")
    specific_qualification_details = models.TextField(null=True, blank=True, verbose_name="특정 자격 조건 상세")  # 특정 자격 조건 (예: "국가유공자 자녀", "다문화 가정 자녀")
    eligibility_restrictions = models.TextField(null=True, blank=True, verbose_name="자격 제한")  # 자격 제한 (예: "휴학생 제외")
    region = models.CharField(max_length=512, blank=True, help_text="전처리된 지역 정보 (쉼표로 구분)")
    is_region_processed = models.BooleanField(default=False, help_text="지역 정보 전처리 완료 여부")

    # 기타 정보
    managing_organization_type = models.CharField(max_length=255, null=True, blank=True, verbose_name="운영 기관 구분")  # 운영 기관 구분
    foundation_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="운영 기관 이름")  # 운영 기관 이름
    selection_method_details = models.TextField(null=True, blank=True, verbose_name="선발 기준 및 절차")  # 선발 기준 및 절차
    number_of_recipients_details = models.TextField(null=True, blank=True, verbose_name="선발 인원 상세")  # 선발 인원
    required_documents_details = models.TextField(null=True, blank=True, verbose_name="제출 서류 상세")  # 제출 서류
    support_details = models.TextField(null=True, blank=True, verbose_name="지원금액 상세")  # 지원금액
    recommendation_required = models.BooleanField(default=False, verbose_name="추천서 필요 여부")  # 추천서 필요 여부

    class Meta:
        verbose_name = "장학금"
        verbose_name_plural = "장학금 목록"

    def __str__(self):
        return self.name

    def to_dict(self):
        """
        GPT 모델에 전달하기 위한 장학금 정보를 딕셔너리 형태로 반환합니다.
        날짜 필드는 ISO 8601 형식의 문자열로 변환합니다.
        """
        return {
            "product_id": self.product_id,
            "name": self.name,
            "product_type": self.product_type,
            "recruitment_start": self.recruitment_start.isoformat() if self.recruitment_start else None,
            "recruitment_end": self.recruitment_end.isoformat() if self.recruitment_end else None,
            "university_type": self.university_type,
            "academic_year_type": self.academic_year_type, # 변경된 필드명 사용
            "major_field": self.major_field,     
            "region": self.region,               
            "residency_requirement_details": self.residency_requirement_details,
            "grade_criteria_details": self.grade_criteria_details,
            "income_criteria_details": self.income_criteria_details,
            "specific_qualification_details": self.specific_qualification_details,
            "eligibility_restrictions": self.eligibility_restrictions,
            "managing_organization_type": self.managing_organization_type,
            "foundation_name": self.foundation_name,
            "selection_method_details": self.selection_method_details,
            "number_of_recipients_details": self.number_of_recipients_details,
            "required_documents_details": self.required_documents_details,
            "support_details": self.support_details,
            "recommendation_required": self.recommendation_required,
        }


class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="사용자")
    scholarship = models.ForeignKey(Scholarship, on_delete=models.CASCADE, verbose_name="장학금")
    added_at = models.DateTimeField(auto_now_add=True, verbose_name="추가일")

    class Meta:
        unique_together = ('user', 'scholarship')
        verbose_name = "찜 목록"
        verbose_name_plural = "찜 목록"

    def __str__(self):
        return f"{self.user.username}님의 찜 목록: {self.scholarship.name}"

