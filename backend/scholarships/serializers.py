# scholarships/serializers.py
from rest_framework import serializers
from .models import Wishlist, Scholarship

class ScholarshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scholarship
        fields = '__all__' # 모든 필드를 자동으로 포함합니다.

class WishlistSerializer(serializers.ModelSerializer):
    # WishlistSerializer 내부에서 Scholarship 정보를 중첩하여 표시합니다.
    # 이 경우 ScholarshipSerializer도 변경된 필드명을 자동으로 반영합니다.
    scholarship = ScholarshipSerializer()

    class Meta:
        model = Wishlist
        fields = ['id', 'scholarship', 'added_at']

class CalendarScholarshipSerializer(serializers.ModelSerializer):
    # title 필드는 scholarship.name을 참조합니다.
    title = serializers.CharField(source='scholarship.name')

    # deadline 필드는 scholarship.recruitment_end를 참조하도록 수정합니다.
    # 이전 'recruitment_end' 필드명 오류를 해결합니다.
    deadline = serializers.DateField(source='scholarship.recruitment_end')

    # required_documents_details 필드는 scholarship.required_documents_details를 참조합니다.
    required_documents_details = serializers.CharField(source='scholarship.required_documents_details')

    class Meta:
        model = Wishlist # CalendarScholarshipSerializer는 Wishlist 모델을 사용합니다.
        fields = ['id', 'title', 'deadline', 'required_documents_details'] # 노출할 필드들을 정의합니다.
