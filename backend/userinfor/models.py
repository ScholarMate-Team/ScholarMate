# userinfor/models.py (수정 사항)
from django.db import models
from django.contrib.auth.models import User

class UserScholarship(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, verbose_name="사용자")

    name = models.CharField(max_length=100, null=True, blank=True, verbose_name="이름")
    gender = models.CharField(max_length=10, null=True, blank=True, verbose_name="성별")
    birth_date = models.DateField(null=True, blank=True, verbose_name="생년월일")

    region = models.CharField(max_length=100, null=True, blank=True, verbose_name="시/도")
    district = models.CharField(max_length=100, null=True, blank=True, verbose_name="시/군/구")

    income_level = models.CharField(max_length=50, null=True, blank=True, verbose_name="소득 분위")
    university_type = models.CharField(max_length=50, null=True, blank=True, verbose_name="대학 유형")
    university_name = models.CharField(max_length=100, null=True, blank=True, verbose_name="학교명")
    major_field = models.CharField(max_length=100, null=True, blank=True, verbose_name="학과")
    academic_year_type = models.CharField(max_length=20, null=True, blank=True, verbose_name="학년")
    semester = models.CharField(max_length=20, null=True, blank=True, verbose_name="학기")

    gpa_last_semester = models.FloatField(null=True, blank=True, verbose_name="직전 학기 평점")
    gpa_overall = models.FloatField(null=True, blank=True, verbose_name="전체 학기 평점")

    is_multi_cultural_family = models.BooleanField(default=False, verbose_name="다문화 가정 여부")
    is_single_parent_family = models.BooleanField(default=False, verbose_name="한부모 가정 여부")
    is_multiple_children_family = models.BooleanField(default=False, verbose_name="다자녀 가정 여부")
    is_national_merit = models.BooleanField(default=False, verbose_name="국가유공자 여부")

    additional_info = models.TextField(null=True, blank=True, verbose_name="추가 정보")

    class Meta:
        verbose_name = "사용자 장학 정보"
        verbose_name_plural = "사용자 장학 정보 목록"

    def __str__(self):
        return f"{self.user.username}님의 장학 정보"

    def to_dict(self):
        """
        프론트엔드에 전달하기 위한 사용자 프로필 정보를 딕셔너리 형태로 반환합니다.
        날짜 필드는 ISO 8601 형식의 문자열로 변환합니다.
        Float 필드의 None 값은 0.0으로, Boolean 필드의 None 값은 false로 변환하여 프론트엔드에서 안전하게 처리하도록 합니다.
        """
                
        return {
            "name": self.name if self.name is not None else "",
            "gender": self.gender if self.gender is not None else "",
            "birth_date": self.birth_date.isoformat() if self.birth_date else None,
            "region": self.region if self.region is not None else "",
            "district": self.district if self.district is not None else "",
            "income_level": self.income_level if self.income_level is not None else "",
            "university_type": self.university_type if self.university_type is not None else "",
            "university_name": self.university_name if self.university_name is not None else "",
            "major_field": self.major_field if self.major_field is not None else "",
            "academic_year_type": self.academic_year_type if self.academic_year_type is not None else "",
            "semester": self.semester if self.semester is not None else "",
            
            # 숫자 필드는 None일 경우 0.0으로 변환하여 안전하게 처리
            "gpa_last_semester": self.gpa_last_semester if self.gpa_last_semester is not None else 0.0,
            "gpa_overall": self.gpa_overall if self.gpa_overall is not None else 0.0,
            
            # Boolean 필드는 None일 경우 false로 변환하여 안전하게 처리
            "is_multi_cultural_family": self.is_multi_cultural_family if self.is_multi_cultural_family is not None else False,
            "is_single_parent_family": self.is_single_parent_family if self.is_single_parent_family is not None else False,
            "is_multiple_children_family": self.is_multiple_children_family if self.is_multiple_children_family is not None else False,
            "is_national_merit": self.is_national_merit if self.is_national_merit is not None else False,
            
            "additional_info": self.additional_info if self.additional_info is not None else "",
        }

