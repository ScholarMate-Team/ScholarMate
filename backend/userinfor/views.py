# userinfor/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import UserScholarship
from django.contrib.auth.models import User
from django.utils.dateparse import parse_date # parse_date 임포트

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_scholarship_info(request):
    print(f"DEBUG: [get_scholarship_info] 사용자 '{request.user.username}'의 장학 정보 조회 시도")
    try:
        # UserScholarship 객체를 가져옵니다. (없으면 DoesNotExist 예외 발생)
        scholarship_info = UserScholarship.objects.get(user=request.user)
        print(f"DEBUG: [get_scholarship_info] UserScholarship 객체 찾음: {scholarship_info.user.username}")
        
        # UserScholarship 모델의 to_dict() 메서드를 사용하여 데이터를 직렬화합니다.
        data = scholarship_info.to_dict()
        print(f"DEBUG: [get_scholarship_info] to_dict() 반환 데이터: {data}")
        return Response(data, status=status.HTTP_200_OK)
    except UserScholarship.DoesNotExist:
        # UserScholarship 객체가 없으면 빈 응답 반환 (프론트엔드에서 새로 입력하도록 유도)
        print(f"DEBUG: [get_scholarship_info] 사용자 '{request.user.username}'의 UserScholarship 객체가 없음.")
        return Response({}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"ERROR: [get_scholarship_info] 사용자 장학 정보 조회 중 오류 발생: {e}")
        import traceback
        traceback.print_exc() # 상세 트레이스백 출력
        return Response({"error": "사용자 장학 정보 조회 중 오류가 발생했습니다."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_scholarship_info(request):
    data = request.data
    user = request.user
    print(f"DEBUG: [save_scholarship_info] 사용자 '{request.user.username}'의 장학 정보 저장 시도. 받은 데이터: {data}")

    try:
        # UserScholarship 객체를 가져오거나 새로 생성합니다.
        scholarship_info, created = UserScholarship.objects.get_or_create(user=user)
        print(f"DEBUG: [save_scholarship_info] UserScholarship 객체 {'생성됨' if created else '가져옴'}: {scholarship_info.user.username}")

        # 모든 필드를 update_fields 딕셔너리로 관리하여 효율적으로 업데이트
        update_fields = {}

        # 텍스트 및 기본 필드
        # 프론트엔드에서 어떤 키를 보내든, 해당 키가 존재하면 업데이트
        if "name" in data: update_fields["name"] = data["name"]
        if "gender" in data: update_fields["gender"] = data["gender"]
        if "region" in data: update_fields["region"] = data["region"]
        if "district" in data: update_fields["district"] = data["district"]
        if "income_level" in data: update_fields["income_level"] = data["income_level"]
        if "academic_year_type" in data: update_fields["academic_year_type"] = data["academic_year_type"]
        if "semester" in data: update_fields["semester"] = data["semester"]
        if "additional_info" in data: update_fields["additional_info"] = data["additional_info"]
        
        # 날짜 필드: birth_date
        birth_date_str = data.get("birth_date")
        if birth_date_str is not None: # 프론트엔드에서 아예 안 보내거나, 빈 문자열 보낼 수 있음
            if birth_date_str.strip() == '':
                update_fields["birth_date"] = None # 빈 문자열이면 None으로 저장
            else:
                parsed_birth_date = parse_date(birth_date_str)
                if parsed_birth_date:
                    update_fields["birth_date"] = parsed_birth_date
                else:
                    print(f"WARNING: [save_scholarship_info] birth_date '{birth_date_str}' 파싱 실패. 해당 필드 업데이트 건너뜀.")
        
        # 학력 정보 (새로운 필드명에 맞추어 데이터 가져오기)
        # 프론트엔드에서 이전 키(university_category, university, department)로 데이터를 보내는 경우를 대비하여 매핑
        if "university_type" in data: update_fields["university_type"] = data["university_type"]
        elif "university_category" in data: update_fields["university_type"] = data["university_category"] # 하위 호환성

        if "university_name" in data: update_fields["university_name"] = data["university_name"]
        elif "university" in data: update_fields["university_name"] = data["university"] # 하위 호환성

        if "major_field" in data: update_fields["major_field"] = data["major_field"]
        elif "department" in data: update_fields["major_field"] = data["department"] # 하위 호환성
        
        # 성적 정보 (Float 필드): 숫자로 변환 시도, 실패 시 업데이트 건너뜀
        if "gpa_last_semester" in data: 
            try: update_fields["gpa_last_semester"] = float(data["gpa_last_semester"])
            except (ValueError, TypeError): pass
        elif "gpa_last" in data: # 하위 호환성
            try: update_fields["gpa_last_semester"] = float(data["gpa_last"])
            except (ValueError, TypeError): pass

        if "gpa_overall" in data:
            try: update_fields["gpa_overall"] = float(data["gpa_overall"])
            except (ValueError, TypeError): pass
        elif "gpa_total" in data: # 하위 호환성
            try: update_fields["gpa_overall"] = float(data["gpa_total"])
            except (ValueError, TypeError): pass
        
        # Boolean 필드: 프론트엔드에서 이전 키를 보낼 수 있으므로 매핑
        if "is_multi_cultural_family" in data: update_fields["is_multi_cultural_family"] = data["is_multi_cultural_family"]
        elif "multi_culture_family" in data: update_fields["is_multi_cultural_family"] = data["multi_culture_family"] # 하위 호환성

        if "is_single_parent_family" in data: update_fields["is_single_parent_family"] = data["is_single_parent_family"]
        elif "single_parent_family" in data: update_fields["is_single_parent_family"] = data["single_parent_family"] # 하위 호환성

        if "is_multiple_children_family" in data: update_fields["is_multiple_children_family"] = data["is_multiple_children_family"]
        elif "multiple_children_family" in data: update_fields["is_multiple_children_family"] = data["multiple_children_family"] # 하위 호환성

        if "is_national_merit" in data: update_fields["is_national_merit"] = data["is_national_merit"]
        elif "national_merit" in data: update_fields["is_national_merit"] = data["national_merit"] # 하위 호환성
        
        # UserScholarship 객체에 업데이트할 필드들을 적용
        for field, value in update_fields.items():
            setattr(scholarship_info, field, value)

        scholarship_info.save()
        print(f"DEBUG: [save_scholarship_info] UserScholarship 객체 저장 완료.")

        # 업데이트된 데이터를 to_dict()를 통해 반환
        return Response(scholarship_info.to_dict(), status=status.HTTP_200_OK)
    except Exception as e:
        print(f"ERROR: [save_scholarship_info] 사용자 정보 저장 중 오류가 발생했습니다: {e}")
        import traceback
        traceback.print_exc() # 상세 트레이스백 출력
        return Response({"error": f"사용자 정보 저장 중 오류가 발생했습니다: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

