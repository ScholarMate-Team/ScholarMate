# scholarships/admin.py
from django.contrib import admin
from .models import Scholarship # Scholarship 모델 임포트 확인

class ScholarshipAdmin(admin.ModelAdmin):
    list_display = (
        'product_id', 
        'name', 
        'foundation_name', 
        'recruitment_start', 
        'recruitment_end', 
        'university_type',
        'academic_year_type', 
        'major_field',
        'region',
        'is_region_processed',
        'product_type',
        'support_details',
    )
    
    list_filter = (
        'university_type', 
        'academic_year_type', 
        'product_type', 
        'region', 
        'is_region_processed',
        'recommendation_required',
    )
    
    search_fields = (
        'name', 
        'foundation_name', 
        'grade_criteria_details', 
        'income_criteria_details',
        'specific_qualification_details',
        'residency_requirement_details',
        'major_field', 
    )

    # raw_id_fields에서 'foundation_name' 제거
    # 이 필드는 ForeignKey나 ManyToManyField가 아니므로 raw_id_fields에 포함될 수 없습니다.
    # raw_id_fields = ('foundation_name',) 
    
    fieldsets = (
        (None, {
            'fields': ('product_id', 'name', 'foundation_name', 'product_type', 'managing_organization_type')
        }),
        ('모집 기간', {
            'fields': ('recruitment_start', 'recruitment_end')
        }),
        ('대상 조건', {
            'fields': ('university_type', 'academic_year_type', 'major_field','region','is_region_processed',) 
        }),
        ('상세 기준', {
            'fields': ('grade_criteria_details', 'income_criteria_details', 'specific_qualification_details', 'residency_requirement_details', 'eligibility_restrictions')
        }),
        ('선발 및 지원', {
            'fields': ('selection_method_details', 'number_of_recipients_details', 'required_documents_details', 'support_details', 'recommendation_required')
        }),
    )

admin.site.register(Scholarship, ScholarshipAdmin)
