import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios"; // axios 인스턴스 임포트
import "../assets/css/profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [scholarshipData, setScholarshipData] = useState(null);
  const [error, setError] = useState("");

  // 리프레시 토큰을 사용하여 새로운 액세스 토큰을 가져오는 함수
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("리프레시 토큰이 없습니다.");
      }

      // 하드코딩된 URL을 상대 경로로 변경
      const response = await axios.post("/auth/jwt/refresh/", {
        refresh: refreshToken,
      });

      const newAccessToken = response.data.access;
      localStorage.setItem("token", newAccessToken);
      console.log("🔄 액세스 토큰 갱신 성공");
      return newAccessToken;
    } catch (err) {
      console.error("🚨 액세스 토큰 갱신 실패:", err);
      setError("세션이 만료되었습니다. 다시 로그인해주세요.");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      navigate("/login"); // 로그인 페이지로 이동
      return null;
    }
  };

  // 회원 기본 정보 가져오기
  const fetchUserData = async () => {
    try {
      // api 인스턴스 대신 import 한 axios 사용
      const response = await axios.get("/auth/users/me/");
      setUserData(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        console.log("🔄 액세스 토큰 만료됨, 새로 갱신 시도...");
        const newToken = await refreshAccessToken();
        if (newToken) {
          fetchUserData(); // 갱신 후 다시 데이터 요청
        }
      } else {
        console.error("🚨 사용자 정보를 불러오지 못했습니다:", err);
        setError("사용자 정보를 불러오지 못했습니다.");
      }
    }
  };

  // 사용자 장학 정보 가져오기
  const fetchScholarshipData = async () => {
    try {
      // api 인스턴스 대신 import 한 axios 사용
      const response = await axios.get("/userinfor/scholarship/get/");
      setScholarshipData(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        console.log("🔄 장학 정보 불러오기 실패, 토큰 갱신 시도...");
        const newToken = await refreshAccessToken();
        if (newToken) {
          fetchScholarshipData(); // 갱신 후 다시 데이터 요청
        }
      } else if (err.response?.status === 404) {
        setScholarshipData({});
      } else {
        console.error("🚨 장학 정보를 불러오지 못했습니다:", err);
        setError("장학 정보를 불러오지 못했습니다.");
      }
    }
  };

  useEffect(() => {
    document.body.classList.add("profile-page");
    return () => {
      document.body.classList.remove("profile-page");
    };
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchScholarshipData();
  }, []);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!userData) {
    return <p>사용자 정보를 불러오는 중...</p>;
  }

  if (scholarshipData === null) {
    return <p>장학 정보를 불러오는 중...</p>;
  }

  return (
    // ... (UI 부분은 동일)
    <div className="page-wrapper">
     <div className="profile-container">
       <div className="profile-header">
         <h2 className="text-center text-2xl font-bold">
           {userData.username}님의 마이페이지
         </h2>
       </div>
       <div className="profile-card">
         <h3 className="text-left text-xl font-semibold mb-4">회원 정보</h3>
         <p><strong>아이디:</strong> {userData.username}</p>
         <p><strong>이메일:</strong> {userData.email}</p>
       </div>
       <div className="profile-card scholarship-box">
         <div className="card-header">
           <h3 className="text-center text-xl font-semibold mb-4">장학 정보</h3>
           <button
             className="edit-btn"
             onClick={() => navigate("/userinfor", { state: { scholarshipData } })}
           >
             장학 정보 수정
           </button>
         </div>
         {Object.keys(scholarshipData).length > 0 ? (
           <>
             <p><strong>이름:</strong> {scholarshipData.name || "없음"}</p>
             <p><strong>성별:</strong> {scholarshipData.gender || "없음"}</p>
             <p><strong>출생일:</strong> {scholarshipData.birth_date || "없음"}</p>
             <p><strong>거주 지역:</strong> {scholarshipData.region || "없음"}, {scholarshipData.district || "없음"}</p>
             <p><strong>소득 분위:</strong> {scholarshipData.income_level || "없음"}</p>
             <p><strong>대학 유형:</strong> {scholarshipData.university_type || "없음"}</p>
             <p><strong>대학:</strong> {scholarshipData.university_name || "없음"}</p>
             <p><strong>학과:</strong> {scholarshipData.major_field || "없음"}</p>
             <p><strong>학년:</strong> {scholarshipData.academic_year_type || "없음"}</p>
             <p><strong>수료 학기:</strong> {scholarshipData.semester || "없음"}</p>
             <p><strong>최근 학기 성적:</strong> {scholarshipData.gpa_last_semester !== undefined && scholarshipData.gpa_last_semester !== null ? scholarshipData.gpa_last_semester : "없음"}</p>
             <p><strong>전체 성적:</strong> {scholarshipData.gpa_overall !== undefined && scholarshipData.gpa_overall !== null ? scholarshipData.gpa_overall : "없음"}</p>
             <p><strong>다문화 가정:</strong> {scholarshipData.is_multi_cultural_family ? "예" : "아니오"}</p>
             <p><strong>한부모 가정:</strong> {scholarshipData.is_single_parent_family ? "예" : "아니오"}</p>
             <p><strong>다자녀 가정:</strong> {scholarshipData.is_multiple_children_family ? "예" : "아니오"}</p>
             <p><strong>국가유공자:</strong> {scholarshipData.is_national_merit ? "예" : "아니오"}</p>
             <p><strong>추가 정보:</strong> {scholarshipData.additional_info || "없음"}</p>
           </>
         ) : (
           <p className="error">장학 정보가 없습니다.</p>
         )}
       </div>
     </div>
    </div>
  );
}