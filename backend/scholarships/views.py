# scholarships/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
import openai
from rest_framework.permissions import AllowAny, IsAuthenticated
from datetime import datetime, date
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from rest_framework.decorators import api_view, permission_classes
from .models import Scholarship, Wishlist
from .serializers import CalendarScholarshipSerializer, WishlistSerializer, ScholarshipSerializer
from userinfor.models import UserScholarship
from django.conf import settings
from .recommendation import recommend
import urllib.parse

# (기존의 API_URL 및 SERVICE_KEY는 그대로 유지)
API_URL = "https://api.odcloud.kr/api/15028252/v1/uddi:ccd5ddd5-754a-4eb8-90f0-cb9bce54870b"
SERVICE_KEY = settings.SERVICE_KEY
openai.api_key = settings.OPENAI_API_KEY

def get_processed_region_from_text(text: str) -> str:
    """주어진 텍스트를 GPT로 분석하여 정형화된 지역명을 반환합니다."""
    if not text or text.strip().lower() in ["", "해당없음"]:
        return "전국"
    
    if not openai.api_key:
        print("경고: OpenAI API 키가 설정되지 않아 지역 처리를 건너뜁니다.")
        return ""

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
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.0,
            timeout=15
        )
        result = response.choices[0].message['content'].strip()
        return result.split('\n')[0]
    except Exception as e:
        print(f"오류: GPT 지역 처리 중 오류 발생 - {e}")
        return ""

class ScholarshipListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # 로컬 페이지네이션에만 사용
        try:
            page = int(request.query_params.get("page", 1))
            per_page = int(request.query_params.get("perPage", 10))
        except (ValueError, TypeError):
            page, per_page = 1, 10

        search_query  = (request.query_params.get("search", "") or "").strip().lower()
        selected_type = (request.query_params.get("type", "")   or "").strip()
        sort_order    = (request.query_params.get("sort", "")   or "").strip()

        # 서비스 키 디코딩 (이중 인코딩 방지)
        try:
            decoded_service_key = urllib.parse.unquote(SERVICE_KEY)
        except Exception:
            decoded_service_key = SERVICE_KEY

        # ---------- 전체 수집 ----------
        FETCH_PER_PAGE = 1000   # ODcloud 최대 가까운 값
        MAX_ROUNDS     = 50     # 안전장치 (최대 5만건)
        all_rows = []

        # 1페이지: totalCount 파악용
        params = {
            "serviceKey": decoded_service_key,
            "page": 1,                   # ← 외부 호출에는 내부 페이징만 사용
            "perPage": FETCH_PER_PAGE,   #   크게 가져와서 우리가 자름
            "returnType": "JSON",
        }
        try:
            first = requests.get(API_URL, params=params, timeout=30)
            first.raise_for_status()
            first_json = first.json()
        except Exception as e:
            print(f"[ScholarshipListView] 1차 호출 실패: {e}")
            return Response({"error": "외부 API 호출 실패"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        total_count = int(first_json.get("totalCount", 0) or 0)
        all_rows.extend(first_json.get("data", []) or [])

        import math
        total_pages = max(1, math.ceil(total_count / FETCH_PER_PAGE))
        cur, rounds = 2, 1
        while cur <= total_pages and rounds < MAX_ROUNDS:
            try:
                p = {
                    "serviceKey": decoded_service_key,
                    "page": cur,
                    "perPage": FETCH_PER_PAGE,
                    "returnType": "JSON",
                }
                r = requests.get(API_URL, params=p, timeout=30)
                r.raise_for_status()
                js = r.json()
                all_rows.extend(js.get("data", []) or [])
            except Exception as e:
                print(f"[ScholarshipListView] 페이지 {cur} 수집 실패: {e}")
                break
            cur += 1
            rounds += 1

        # ---------- 전체 기준 필터/검색/정렬 ----------
        filtered = all_rows

        # 검색(상품명 포함)
        if search_query:
            filtered = [row for row in filtered
                        if search_query in (row.get("상품명") or "").lower()]

        # 유형(외부 응답의 '학자금유형구분' 과 일치하는 값만)
        if selected_type:
            filtered = [row for row in filtered
                        if (row.get("학자금유형구분") or "") == selected_type]

        # 정렬
        if sort_order == "end_date":
            def parse_end(d):
                try:
                    return datetime.strptime(d, "%Y-%m-%d")
                except Exception:
                    return datetime.max  # 없는 건 뒤로
            filtered.sort(key=lambda x: parse_end(x.get("모집종료일") or ""))

        # ---------- 로컬 페이지네이션 ----------
        total_after = len(filtered)
        start = max(0, (page - 1) * per_page)
        end   = start + per_page
        page_rows = filtered[start:end]

        return Response(
            {
                "data": page_rows,       # 현재 페이지 데이터
                "total": total_after,    # 필터/검색/정렬 적용 후 전체 개수
            },
            status=status.HTTP_200_OK,
        )

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
        wishlist_items = Wishlist.objects.filter(user=request.user).order_by('-added_at')
        serializer = WishlistSerializer(wishlist_items, many=True)
        return Response(serializer.data)


class AddToWishlistFromAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        
        # ✅ 'product_id'를 직접 받거나, 'name'과 'foundation_name'으로 생성
        product_id = data.get("product_id") or f'{data.get("name", "")}_{data.get("foundation_name", "")}'

        if not product_id:
            return Response({"error": "product_id 또는 장학금 정보(name, foundation_name)는 필수입니다."}, status=status.HTTP_400_BAD_REQUEST)

        scholarship, created = Scholarship.objects.get_or_create(product_id=product_id)

        if created:
            residency_text = data.get("residency_requirement_details", "")
            processed_region = get_processed_region_from_text(residency_text)

            def parse_date_safely(date_str):
                if date_str and isinstance(date_str, str):
                    try:
                        return parse_date(date_str.split('~')[0].strip())
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
            scholarship.selection_method_details = data.get("selection_method_details", "")
            scholarship.number_of_recipients_details = data.get("number_of_recipients_details", "")
            scholarship.eligibility_restrictions = data.get("eligibility_restrictions", "")
            scholarship.required_documents_details = data.get("required_documents_details", "")
            scholarship.recommendation_required = data.get("recommendation_required", False) 
            scholarship.major_field = data.get("major_field", "")
            scholarship.academic_year_type = data.get("academic_year_type", "")
            scholarship.managing_organization_type = data.get("managing_organization_type", "")
            
            scholarship.region = processed_region
            scholarship.is_region_processed = True
            
            scholarship.save()
            print(f"DEBUG: 새로운 장학금 '{data.get('name')}' 생성 및 지역 처리 완료. 지역: '{processed_region}'")

        wishlist, wishlist_created = Wishlist.objects.get_or_create(user=request.user, scholarship=scholarship)
        
        return Response({"status": "added" if wishlist_created else "exists"}, status=status.HTTP_200_OK)
    
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommended_scholarships_api(request):
    print(f"DEBUG: [get_recommended_scholarships_api] 호출됨. 사용자: {request.user.username}, ID: {request.user.id}")

    try:
        recommended_scholarships_queryset = recommend(request.user.id)
        
        # ✅ recommendation.py의 recommend 함수가 False를 반환할 때 처리
        if recommended_scholarships_queryset is False:
            print("경고: [get_recommended_scholarships_api] 사용자 프로필이 불완전하여 추천을 중단합니다.")
            return Response(
                {'error': '나의 장학 정보를 모두 작성해주세요.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 기존 로직: 정상적인 경우에만 추천 데이터 생성 및 반환
        recommended_scholarships_data = [
            scholarship.to_dict() for scholarship in recommended_scholarships_queryset
        ]
        print(f"DEBUG: [get_recommended_scholarships_api] 추천 장학금 데이터 생성 완료. 개수: {len(recommended_scholarships_data)}")

        return Response({'scholarships': recommended_scholarships_data}, status=status.HTTP_200_OK)

    except UserScholarship.DoesNotExist:
        print(f"오류: [get_recommended_scholarships_api] 사용자 ID {request.user.id}에 해당하는 UserScholarship 프로필이 없습니다.")
        return Response(
            {'error': '사용자 프로필을 찾을 수 없습니다. 장학금 추천을 위해 프로필을 먼저 작성해주세요.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"오류: [get_recommended_scholarships_api] 장학금 추천 API 실행 중 최종 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'장학금 추천 중 오류가 발생했습니다. 다시 시도해 주세요. ({e})'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )