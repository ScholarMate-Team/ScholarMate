import openai
import time
import json
import re
import requests
import urllib3
from datetime import datetime
from django.db.models import QuerySet, Q, Case, When, Value
from django.conf import settings
from scholarships.models import Scholarship
from userinfor.models import UserScholarship
from django.db import models
from typing import List, Dict # 타입 힌트 추가

# --- API 키 설정 ---
openai.api_key = settings.OPENAI_API_KEY

# (GPT 상호작용 헬퍼 함수들은 변경 없음)
def call_gpt(prompt: str, max_retries: int = 3, delay: int = 2) -> str:
    """OpenAI GPT 모델을 호출하고 응답 텍스트를 반환하며, 네트워크 오류 시 자동 재시도합니다."""

    for attempt in range(1, max_retries + 1):

        try:
            response = openai.ChatCompletion.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "당신은 장학금 추천 사유를 작성하는 AI 전문가입니다. "
                            "항상 구체적이고 문단형으로, 최소 2문장 이상으로 작성하세요."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.4,
                request_timeout=120,   # 네트워크 안정성을 위해 60초 유지
            )

            gpt_response_content = response["choices"][0]["message"]["content"]

            print("DEBUG: [GPT 응답 원본]")
            print(gpt_response_content)

            return gpt_response_content

        # ---- OpenAI API 오류 (서버 오류, 레이트 리밋 등)
        except openai.error.OpenAIError as e:
            print(f"[GPT ERROR] OpenAI API 오류 발생 (시도 {attempt}/{max_retries}): {e}")

        # ---- 네트워크 계층 오류 (너 로그에서 발견된 SSL/TLS 오류 포함)
        except (requests.exceptions.RequestException,
                urllib3.exceptions.ProtocolError,
                urllib3.exceptions.ReadTimeoutError,
                urllib3.exceptions.NewConnectionError,
                urllib3.exceptions.MaxRetryError) as e:
            print(f"[NETWORK ERROR] 네트워크 오류 발생 (시도 {attempt}/{max_retries}): {e}")

        # ---- 그 외 모든 예외 (일반적인 런타임 오류)
        except Exception as e:
            print(f"[UNKNOWN ERROR] 알 수 없는 오류 발생 (시도 {attempt}/{max_retries}): {e}")

        # 재시도 필요
        if attempt < max_retries:
            print(f"[RETRY] {delay}초 후 재시도합니다…")
            time.sleep(delay)

    # 모든 재시도 실패 → 500 방지 위해 빈 문자열 반환
    print("[FAIL] GPT 호출 실패: 모든 재시도 실패, 빈 문자열 반환")
    return ""

def extract_json_from_gpt_response(gpt_response_content: str) -> str:
    """GPT 응답 텍스트에서 JSON 배열 또는 객체를 찾습니다."""
    match = re.search(r"\[.*\]|{.*}", gpt_response_content, re.DOTALL)
    return match.group(0) if match else "[]"

def safe_parse_json(response_text: str):
    """GPT 응답 텍스트에서 JSON을 안전하게 파싱합니다."""
    try:
        json_str = extract_json_from_gpt_response(response_text)
        return json.loads(json_str) if json_str.strip() else []
    except (json.JSONDecodeError, Exception) as e:
        print(f"오류: JSON 파싱 실패: {e} - 응답 내용: '{response_text[:200]}...'")
        return []

# (데이터 준비 헬퍼 함수는 변경 없음)
def _scholarship_to_simplified_dict(scholarship_obj):
    """GPT가 상세 비교를 할 수 있도록, 원본 상세 텍스트를 전달합니다."""     
    return {
        "product_id": scholarship_obj.product_id,
        "name": scholarship_obj.name, 
        "product_type": scholarship_obj.product_type,
        "university_type": scholarship_obj.university_type,
        "academic_year_type": scholarship_obj.academic_year_type,
        "major_field": scholarship_obj.major_field, 
        "region": scholarship_obj.region,
        "grade_criteria_details": scholarship_obj.grade_criteria_details,
        "income_criteria_details": scholarship_obj.income_criteria_details,
        "specific_qualification_details": scholarship_obj.specific_qualification_details,
    }

# (DB 사전 필터링 함수들은 변경 없음)
def filter_scholarships_by_date(scholarships_queryset: QuerySet) -> QuerySet:
    # ... (기존 코드 유지)
    current_date = datetime.now().date()
    filtered_qs = scholarships_queryset.filter(
            recruitment_start__lte=current_date,
            recruitment_end__gte=current_date
        )
    print(f"DEBUG: [0. 날짜 필터링] 필터링 후 장학금 수: {filtered_qs.count()}")
    return filtered_qs

def filter_basic(scholarships_queryset: QuerySet, user_profile: UserScholarship) -> QuerySet:
    # ... (기존 코드 유지)
    print(f"DEBUG: [1. 기본 필터링] 사용자 프로필: 대학='{user_profile.university_type}', 학년='{user_profile.academic_year_type}', 전공='{user_profile.major_field}'")
    current_filtered_qs = scholarships_queryset
    
    # 대학 유형 필터링
    if user_profile.university_type and user_profile.university_type.strip():
        all_university_types = current_filtered_qs.values_list('university_type', flat=True).distinct()
        user_univ_type_normalized = user_profile.university_type.strip().replace('-', '~')
        matching_types = [db_type for db_type in all_university_types if user_univ_type_normalized in db_type.replace('-', '~')]
        if matching_types:
            current_filtered_qs = current_filtered_qs.filter(university_type__in=matching_types)
    
    # 학년 유형 필터링
    if user_profile.academic_year_type and user_profile.academic_year_type.strip():
        all_academic_years_in_db = current_filtered_qs.values_list('academic_year_type', flat=True).distinct()
        user_academic_year_normalized = user_profile.academic_year_type.strip().replace(' ', '')
        matching_academic_years = [db_year for db_year in all_academic_years_in_db if user_academic_year_normalized in db_year.replace(' ', '')]
        if matching_academic_years:
            current_filtered_qs = current_filtered_qs.filter(academic_year_type__in=matching_academic_years)
            
    # 학과(전공) 필터링
    user_major_field = getattr(user_profile, 'major_field', None)
    if user_major_field and user_major_field.strip():
        all_majors_in_db = current_filtered_qs.values_list('major_field', flat=True).distinct()
        user_major_normalized = user_major_field.strip()
        all_major_keywords = ["해당없음", "제한없음", "전공무관", "특정학과"] 
        q_objects = Q(major_field__icontains=user_major_normalized) | Q(major_field__in=all_major_keywords)
        current_filtered_qs = current_filtered_qs.filter(q_objects)

    print(f"DEBUG: [1. 기본 필터링] 최종 기본 필터링 적용 후 장학금 수: {current_filtered_qs.count()}")
    return current_filtered_qs

def filter_by_region_preprocessed(scholarships_queryset: QuerySet, user_profile: UserScholarship) -> QuerySet:
    user_region_do = getattr(user_profile, 'region', '') or ""
    user_district = getattr(user_profile, 'district', '') or ""
    
    user_region_parts = list(filter(None, [user_region_do.strip(), user_district.strip()]))
    full_user_region = ' '.join(user_region_parts)
    print(f"DEBUG: [2. 지역 필터링] 조합된 사용자 지역: '{full_user_region}'")

    if not full_user_region:
        return scholarships_queryset.filter(region__icontains="전국")

    exact_match_conditions = [full_user_region] + user_region_parts
    q_objects = Q(region__in=exact_match_conditions) | Q(region__icontains="전국")
    
    filtered_qs = scholarships_queryset.filter(q_objects).distinct()
    print(f"DEBUG: [2. 지역 필터링] 필터링 후 장학금 수: {filtered_qs.count()}")
    return filtered_qs


# --- 2단계: GPT 최종 랭킹 함수 --- 

# 🚨 함수 반환 타입을 List[Dict]로 명확히 변경합니다.
def recommend_final_scholarships_by_gpt(filtered_scholarships_queryset: QuerySet, user_profile: UserScholarship) -> List[Dict]:
    """
    GPT에게 최종 추천 이유까지 작성하도록 위임하고, 결과를 Scholarship 객체와 Reason을 포함한
    딕셔너리 리스트로 반환하여 후속 처리가 용이하도록 합니다.
    """
    print(f"DEBUG: [3. GPT 최종 추천] GPT 호출 전 후보군 수: {filtered_scholarships_queryset.count()}")
    if filtered_scholarships_queryset.count() == 0:
        return []

    # --- 1. 점수제 샘플링 ---
    user_region_do = getattr(user_profile, 'region', '') or ""
    user_district = getattr(user_profile, 'district', '') or ""
    full_user_region = ' '.join(filter(None, [user_region_do.strip(), user_district.strip()]))
    user_major = getattr(user_profile, 'major_field', '') or ""

    score_annotation = Case(
        When(region=full_user_region, then=Value(10)),
        When(region=user_region_do, then=Value(7)),
        When(major_field__icontains=user_major, then=Value(5)),
        When(region__icontains="전국", then=Value(1)),
        default=Value(0),
        output_field=models.IntegerField()
    )
    
    scored_queryset = filtered_scholarships_queryset.annotate(
        relevance_score=score_annotation
    ).order_by('-relevance_score')

    sample_size = 15
    actual_sample_size = min(scored_queryset.count(), sample_size)
    sampled_queryset_for_gpt = scored_queryset[:actual_sample_size]
    
    print(f"DEBUG: [3. GPT 최종 추천] 점수제 샘플링 후 GPT 분석 대상 수: {len(sampled_queryset_for_gpt)}")
    sampled_scholarships_for_gpt = [_scholarship_to_simplified_dict(s) for s in sampled_queryset_for_gpt]
    
    # --- 2. 새로운 프롬프트 준비 (프롬프트는 수정 없음) ---
    user_info_dict = user_profile.to_dict()
    user_info_dict['region'] = full_user_region
    user_info_dict.pop('district', None)
    
    prompt = f"""
    당신은 사용자의 프로필과 장학금 자격 조건을 비교하여, 개인화된 추천 메시지를 작성하는 AI 카피라이터입니다.
    
    [사용자 프로필]
    {json.dumps(user_info_dict, ensure_ascii=False, indent=2)}

    [분석 대상 장학금 목록]
    {json.dumps(sampled_scholarships_for_gpt, ensure_ascii=False, indent=2)}
    
    [업무 지시]

    사용자 프로필과 장학금 목록을 분석하여, 목록 내에 있는 **총 {actual_sample_size}개의 장학금**을 적합도 순으로 정렬하여 JSON 배열로 반환하세요.

    **[매우 중요한 규칙]**

    1.  **사실 기반 작성:** reason'을 작성할 때는 아래 규칙을 반드시 따르고, **규칙에 해당하는 내용만을 근거로** 사실에 기반하여 작성하세요. 절대 추측하거나 없는 내용을 지어내지 마세요.
        규칙1.  **지역 조건:** 사용자의 지역('{user_info_dict.get("region")}')과 장학금의 'region'이 구체적으로 일치할수록 높은 점수를 주세요. '전국'은 그 다음입니다.
        규칙2.  **성적 조건:** 사용자의 성적(gpa_last_semester, gpa_overall)과 장학금의 'grade_criteria_details'를 비교하여, 기준을 충족하면 점수를 부여하세요.
        규칙3.  **소득 조건:** 사용자의 소득분위('income_level')와 장학금의 'income_criteria_details'를 비교하여, 기준에 부합하면 점수를 부여하세요.
        규칙4.  **특정 자격 조건 (가산점 항목):**
            - 만약 사용자의 'is_multi_cultural_family'가 True이고, 장학금 설명(주로 'specific_qualification_details')에 '다문화'라는 텍스트가 있으면 높은 가산점을 주세요.
            - 만약 사용자의 'is_single_parent_family'가 True이고, 장학금의 'income_criteria_details'에 '한부모', '가정형편', '경제사정'라는 텍스트가 있으면 높은 가산점을 주세요.
            - 만약 사용자의 'is_multiple_children_family'가 True이고, 장학금의'income_criteria_details'에 '다자녀'라는 텍스트가 있으면 높은 가산점을 주세요.
            - 만약 사용자의 'is_national_merit'가 True이고, 장학금의'income_criteria_details'에 '국가유공자' 또는 '보훈'이라는 텍스트가 있으면 높은 가산점을 주세요.
        규칙5.  **기타 조건:** 위 조건 외에도 사용자의 전공, 학년 등이 장학금의 조건과 일치하는지 종합적으로 고려하세요.

    2. **추천 여부 기준:** 장학금의 모든 필수 조건(지역, 성적, 소득, 전공, 학년 등)을 사용자가 충족하는 경우에만 추천할 수 있습니다. 하나라도 명확히 충족하지 않다면 추천 장학금으로 선정하지 마세요. 

    3.  **구체적인 이유 제시:** 'reason'에는 왜 이 장학금이 사용자에게 적합한지, 어떤 조건(지역, 성적, 소득, 전공, 학년, 특정 자격 등)이 어떻게 부합하는지를 **2문장 이상 자연스러운 문단 형태로** 작성하세요.
    + 예를 들어, “{user_info_dict.get("name")}는 경기 지역의 4학년생으로, 해당 장학금의 지역 요건과 학년 조건을 모두 충족합니다. 또한 성적 기준(3.5 이상)을 만족하며, 전국 단위로 지원 가능해 접근성이 높습니다.” 와 같은 형태로 작성하세요.
    
    **[출력 형식]**
    - 각 항목은 'product_id'와 'reason' 두 개의 키를 가진 JSON 객체여야 합니다.
    - 'reason'은 사용자에게 보여줄 최종 추천 사유(한국어 문자열)입니다. 만약 규칙4로 인해 가산점을 얻은 경우, 'reason'에 그와 관련된 내용을 반드시 서술하세요.
    - 'product_id'는 절대 변경하지 마세요.

    """

   # --- 3. GPT 호출 및 결과 처리 ---
    gpt_response_content = call_gpt(prompt)
    parsed_response = safe_parse_json(gpt_response_content)

    if not isinstance(parsed_response, list) or not parsed_response:
        # 폴백 시에는 점수 높은 순으로 반환 (Scholarship 객체 리스트 반환)
        # 🚨 폴백 시에도 뷰에서 처리할 수 있도록 딕셔너리 리스트로 변경
        fallback_qs = scored_queryset[:min(scored_queryset.count(), 15)]
        return [
            {"product_id": s.product_id, "reason": "GPT 분석 실패로 인한 기본 추천", "scholarship": s}
            for s in fallback_qs
        ]


    # GPT가 반환한 ID가 유효한지(샘플링 후보군에 있는지) 최소한의 검증만 수행
    valid_recommendations = []
    sampled_ids_map = {s.product_id: s for s in sampled_queryset_for_gpt}
    
    print("\n" + "="*25 + " GPT 응답 최소 검증 시작 " + "="*25)
    for item in parsed_response:
        product_id = item.get('product_id')
        if isinstance(item, dict) and product_id and product_id in sampled_ids_map:
            # 🚨 유효한 항목에 Scholarship 객체를 추가하여 저장
            item['scholarship'] = sampled_ids_map[product_id]
            valid_recommendations.append(item)
            print(f"  - ✅ 검증 성공 (ID 유효): {product_id}, 이유: {item.get('reason')}")
        else:
            print(f"  - ❌ 검증 실패 (ID 오류 또는 환각): {product_id}")
    print("="*25 + " GPT 응답 최소 검증 완료 " + "="*25 + "\n")

    if not valid_recommendations:
        print("경고: 검증을 통과한 추천 항목이 없습니다. 점수 기반 폴백 로직을 실행합니다.")
        # 폴백 로직에서도 딕셔너리 리스트 반환
        fallback_qs = scored_queryset[:min(scored_queryset.count(), 15)]
        return [
            {"product_id": s.product_id, "reason": "GPT 분석 실패로 인한 기본 추천", "scholarship": s}
            for s in fallback_qs
        ]

    # --- 4. 최종 결과 생성 ---
    # valid_recommendations는 이미 GPT의 순서대로 정렬되어 있으므로, 그대로 반환합니다.
    final_results = valid_recommendations[:15] # 상위 15개 (혹은 실제 검증된 개수)

    # 🚨 필요하다면 여기에서 최종 쿼리셋을 필터링하는 대신,
    # valid_recommendations에서 필요한 정보(ID, reason)와 Scholarship 객체를 추출하여 반환
    # (이미 valid_recommendations에 객체가 담겨 있으므로 추가 DB 쿼리 불필요)
    
    print(f"DEBUG: [4. GPT 최종 추천] 최종 반환될 장학금 수: {len(final_results)}")
    # 🚨 딕셔너리 리스트 반환: [{'product_id': '...', 'reason': '...', 'scholarship': <obj>}, ...]
    return final_results


# --- 총괄 지휘 함수 ---
# 🚨 함수 반환 타입을 List[Dict]로 변경합니다.
def recommend(user_id: int) -> List[Dict]:
    """주어진 사용자 ID에 대해 장학금을 추천하는 전체 프로세스를 실행합니다."""
    print(f"DEBUG: [전체 프로세스 시작] 사용자 ID: {user_id}")
    try:
        user_profile = UserScholarship.objects.get(user_id=user_id)
    except UserScholarship.DoesNotExist:
        print(f"오류: 사용자 ID {user_id}에 해당하는 프로필을 찾을 수 없습니다.")
        return []

    scholarships = Scholarship.objects.all()
    scholarships = filter_scholarships_by_date(scholarships) # 1. 날짜 필터링 (필요시 활성화)
    scholarships = filter_basic(scholarships, user_profile) # 2. 기본 자격 필터링
    scholarships = filter_by_region_preprocessed(scholarships, user_profile) # 3. 지역 자격 필터링
    
    # 🚨 recommend_final_scholarships_by_gpt는 이제 딕셔너리 리스트를 반환합니다.
    final_recommendations = recommend_final_scholarships_by_gpt(scholarships, user_profile) # 4. 최종 랭킹
    
    print(f"DEBUG: [전체 프로세스 완료] 최종 추천 장학금 수: {len(final_recommendations)}")
    
    # 🚨 반환 구조 수정: 'r'이 딕셔너리이므로 딕셔너리 키로 접근합니다.
    # 뷰에서 필요한 최소한의 정보(product_id, reason)만 반환합니다.
    return [
        {
            "product_id": r['product_id'],  # 딕셔너리 키로 접근
            "reason": r['reason'],          # 딕셔너리 키로 접근
        }
        for r in final_recommendations
    ]