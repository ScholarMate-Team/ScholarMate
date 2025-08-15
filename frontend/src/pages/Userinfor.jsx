import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axios"; // axios 인스턴스 임포트
import "../assets/css/userinfor.css"; // CSS 파일 임포트 유지

// 데이터 소스 임포트 (기존 경로 유지)
import regions from "../data/regions";
import majorFields from "../data/majorFields";
import universities from "../data/universities";
import universitiesWithDepartments from "../data/universities_with_departments";

// 상수 정의 (기존과 동일)
const incomeLevels = Array.from({ length: 10 }, (_, i) => `${i + 1}분위`);
const academicYears = ["대학신입생", "대학1학기", "대학2학기", "대학3학기", "대학4학기", "대학5학기", "대학6학기", "대학7학기", "대학8학기이상" ];
const semesters = ["신입생", "1학기", "2학기", "3학기", "4학기", "5학기", "6학기", "7학기", "8학기 이상"];
const genders = ["남성", "여성", "선택안함"];
const univCategories = ["4년제(5~6년제포함)", "전문대(2~3년제)", "해외대학"]; // 백엔드 university_type과 매핑

const Userinfor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // existingData를 사용할 때, 백엔드에서 받은 새로운 필드명에 맞춰 접근해야 합니다.
  // 예를 들어, 기존 scholarshipData.university_category는 이제 scholarshipData.university_type
  const existingData = location.state?.scholarshipData || {};

  // 기존 데이터를 유지하며 기본값 설정 (변경된 필드명에 맞춰 초기화)
  const [name, setName] = useState(existingData.name || "");
  const [selectedGender, setSelectedGender] = useState(existingData.gender || "");
  const [birthDate, setBirthDate] = useState(existingData.birth_date || ""); // YYYY-MM-DD 형식 문자열
  
  const [selectedRegion, setSelectedRegion] = useState(existingData.region || "");
  const [selectedDistrict, setSelectedDistrict] = useState(existingData.district || "");
  const [selectedIncomeLevel, setSelectedIncomeLevel] = useState(existingData.income_level || "");
  
  // 백엔드 변경된 필드명에 맞춰 초기화
  const [selectedUnivType, setSelectedUnivType] = useState(existingData.university_type || ""); // university_category -> university_type
  const [selectedUniversityName, setSelectedUniversityName] = useState(existingData.university_name || ""); // university -> university_name
  const [selectedMajorField, setSelectedMajorField] = useState(existingData.major_field || ""); // department -> major_field
  
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(existingData.academic_year_type || "");
  const [selectedSemester, setSelectedSemester] = useState(existingData.semester || "");
  
  // 백엔드 변경된 필드명에 맞춰 초기화. 숫자 필드는 0.0을 처리할 수 있어야 함
  const [gpaLastSemester, setGpaLastSemester] = useState(existingData.gpa_last_semester !== undefined && existingData.gpa_last_semester !== null ? existingData.gpa_last_semester : ""); // gpa_last -> gpa_last_semester
  const [gpaOverall, setGpaOverall] = useState(existingData.gpa_overall !== undefined && existingData.gpa_overall !== null ? existingData.gpa_overall : ""); // gpa_total -> gpa_overall
  
  const [additionalInfo, setAdditionalInfo] = useState(existingData.additional_info || "");
  
  // 백엔드 변경된 필드명에 맞춰 초기화
  const [isMultiCulturalFamily, setIsMultiCulturalFamily] = useState(existingData.is_multi_cultural_family || false); // multi_culture_family -> is_multi_cultural_family
  const [isSingleParentFamily, setIsSingleParentFamily] = useState(existingData.is_single_parent_family || false); // single_parent_family -> is_single_parent_family
  const [isMultipleChildrenFamily, setIsMultipleChildrenFamily] = useState(existingData.is_multiple_children_family || false); // multiple_children_family -> is_multiple_children_family
  const [isNationalMerit, setIsNationalMerit] = useState(existingData.is_national_merit || false); // national_merit -> is_national_merit


  // 기존 로직 유지
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUniversities, setFilteredUniversities] = useState(universities);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    document.body.classList.add("userinfor-page");
    return () => {
      document.body.classList.remove("userinfor-page");
    };
  }, []);

  // 대학 선택 시 학과 목록 업데이트 (selectedUniversityName 사용)
  useEffect(() => {
    if (selectedUniversityName && universitiesWithDepartments[selectedUniversityName]) {
      setDepartments(universitiesWithDepartments[selectedUniversityName]);
    } else {
      setDepartments([]);
    }
  }, [selectedUniversityName]); // 의존성 변경

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFilteredUniversities(
      query.length > 0
        ? universities.filter((uni) =>
            uni.toLowerCase().includes(query.toLowerCase())
          )
        : universities
    );
  };

  const handleSelectUniversity = (university) => {
    setSelectedUniversityName(university); // 변경된 state 업데이트 함수 사용
    setIsModalOpen(false);
    setSearchQuery("");
  };

  // Django 백엔드로 데이터 저장 요청
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    // 백엔드 UserScholarship 모델의 최신 필드명에 맞춰 데이터 구성
    const userInfo = {
      name,
      gender: selectedGender || null,
      birth_date: birthDate || null, // YYYY-MM-DD 형식 문자열
      region: selectedRegion || null,
      district: selectedDistrict || null,
      income_level: selectedIncomeLevel || null,
      university_type: selectedUnivType || null,       // 변경된 필드명
      university_name: selectedUniversityName || null, // 변경된 필드명
      major_field: selectedMajorField || null,         // 변경된 필드명
      academic_year_type: selectedAcademicYear || null,
      semester: selectedSemester || null,
      gpa_last_semester: gpaLastSemester ? parseFloat(gpaLastSemester) : null, // 변경된 필드명
      gpa_overall: gpaOverall ? parseFloat(gpaOverall) : null, // 변경된 필드명
      is_multi_cultural_family: !!isMultiCulturalFamily, // 변경된 필드명
      is_single_parent_family: !!isSingleParentFamily,   // 변경된 필드명
      is_multiple_children_family: !!isMultipleChildrenFamily, // 변경된 필드명
      is_national_merit: !!isNationalMerit,             // 변경된 필드명
      additional_info: additionalInfo || null,
    };

    try {
      // Axios 인스턴스 사용
      const response = await axios.post("/userinfor/scholarship/save/", userInfo, {
        headers: {
          "Authorization": `JWT ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) { // Axios는 response.ok 대신 response.status로 성공 여부 판단
        alert("장학 정보가 성공적으로 저장되었습니다.");
        navigate("/profile"); // 저장 후 프로필 페이지로 이동하여 변경된 정보 확인
      } else {
        alert(`저장 실패: ${response.data?.error || '알 수 없는 오류'}`);
        console.error("저장 실패 응답:", response.data);
      }
    } catch (error) {
      console.error("서버 오류 발생:", error);
      alert(`서버 오류 발생: ${error.response?.data?.error || error.message || '알 수 없는 오류'}`);
    }
  };

  return (
    <div className="container">
      <div className="profile-box">
        <h2 className="title">장학 정보 입력</h2>

        <div className="form-row">
          <label className="form-label">이름</label>
          <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 입력" />
        </div>

        <div className="form-row">
          <label className="form-label">성별</label>
          <select
            className="form-select"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
          >
            <option value="">성별 선택</option>
            {genders.map((gender, index) => (
              <option key={index} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label className="form-label">생년월일</label>
          <input type="date" className="form-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} min="1900-01-01" max="2100-12-31" />
        </div>

        <div className="form-row">
          <label className="form-label">거주 지역</label>
          <div className="form-group">
            <select className="form-select" value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setSelectedDistrict(""); }}>
              <option value="">지역 선택</option>
              {Object.keys(regions).map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <select className="form-select" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedRegion}>
              <option value="">군/구 선택</option>
              {selectedRegion && regions[selectedRegion].map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">소득 분위</label>
          <select 
            className="form-select"
            value={selectedIncomeLevel}
            onChange={(e) => setSelectedIncomeLevel(e.target.value)}
          >
            <option value="">분위 선택</option>
            {incomeLevels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* 변경된 필드명에 맞춰 input/select 바인딩 및 state 업데이트 */}
        <div className="form-row">
          <label className="form-label">대학 유형</label>
          <select
            className="form-select"
            value={selectedUnivType} /* 변경된 state 사용 */
            onChange={(e) => setSelectedUnivType(e.target.value)} /* 변경된 state 업데이트 함수 사용 */
          >
            <option value="">대학 유형 선택</option>
            {univCategories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label className="form-label">지원 계열</label>
          <select 
            className="form-select"
            value={selectedMajorField} /* 변경된 state 사용 */
            onChange={(e) => setSelectedMajorField(e.target.value)} /* 변경된 state 업데이트 함수 사용 */
          >
            <option value="">계열 선택</option>
            {majorFields.map((field) => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label className="form-label">학교</label>
          <div className="form-group">
            <input 
              type="text" 
              className="form-input"
              placeholder="대학교 선택" 
              value={selectedUniversityName} /* 변경된 state 사용 */
              readOnly
            />
            <button className="form-button" onClick={() => setIsModalOpen(true)}>
              검색
            </button>
          </div>
        </div>

        {/* 대학교 검색 모달 창 */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>대학교 검색</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                닫기
              </button>

              <input
                type="text"
                className="search-input"
                placeholder="대학교 검색"
                value={searchQuery}
                onChange={handleSearch}
              />
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                닫기
              </button>
              <ul className="dropdown-list">
                {filteredUniversities.length > 0 ? (
                  filteredUniversities.map((uni) => (
                    <li key={uni} onClick={() => handleSelectUniversity(uni)}>
                      {uni}
                    </li>
                  ))
                ) : (
                  <li>검색 결과 없음</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="form-row">
          <label className="form-label">학과/학년</label>
          <div className="form-group">
            <select 
              className="form-select"
              value={selectedMajorField} /* 이 부분은 다시 확인 필요: 학과 선택은 selectedDepartment로 해야 함 */
              onChange={(e) => setSelectedMajorField(e.target.value)} /* 이 부분은 다시 확인 필요: 학과 선택은 setSelectedDepartment로 해야 함 */
              disabled={!departments.length}
            >
              <option value="">학과 선택</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>

            <select className="form-select"
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            >
              <option value="">학년 선택</option>
              {academicYears.map((year, index) => (
                <option key={index} value={year}>{year}</option>
              ))}
              </select>
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">수료 학기</label>
          <select 
            className="form-select"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option>학기 선택</option>
            {semesters.map((semester, index) => (
              <option key={index} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label className="form-label">성적</label>
          <div className="form-group">
            <input type="number" className="form-input" step="0.01" placeholder="직전 학기 성적" value={gpaLastSemester} onChange={(e) => setGpaLastSemester(e.target.value)}/> {/* 변경된 state 사용 */}
            <input type="number" className="form-input" step="0.01" placeholder="전체 성적" value={gpaOverall} onChange={(e) => setGpaOverall(e.target.value)} /> {/* 변경된 state 사용 */}
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">기타</label>
          <div className="checkbox-group">
            <label><input type="checkbox" checked={isMultiCulturalFamily} onChange={() => setIsMultiCulturalFamily(!isMultiCulturalFamily)} /> 다문화 가정</label> {/* 변경된 state 사용 */}
            <label><input type="checkbox" checked={isSingleParentFamily} onChange={() => setIsSingleParentFamily(!isSingleParentFamily)} /> 한부모 가정</label> {/* 변경된 state 사용 */}
            <label><input type="checkbox" checked={isMultipleChildrenFamily} onChange={() => setIsMultipleChildrenFamily(!isMultipleChildrenFamily)} /> 다자녀 가정</label> {/* 변경된 state 사용 */}
            <label><input type="checkbox" checked={isNationalMerit} onChange={() => setIsNationalMerit(!isNationalMerit)} /> 국가유공자</label> {/* 변경된 state 사용 */}
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">추가 정보</label>
          <textarea className="form-textarea" value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder="예시) 프랜차이즈 카페에서 주 7시간 근무 중. 소득 분위 관련 장학금을 찾고 있음." />
        </div>

        <div className="form-row">
          <button className="save-btn" onClick={handleSave}>저장하기</button>
        </div>
      </div>
    </div>
  );
};

export default Userinfor;
