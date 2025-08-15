import axios from "axios";

// 환경 변수에서 백엔드 API URL 가져오기
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getScholarships = async (page = 1, perPage = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/scholarships/api/scholarships`, {
      params: {
        page,     // 현재 페이지 번호
        perPage,  // 한 페이지당 표시할 데이터 개수
      },
    });
    return response.data; // 데이터 반환
  } catch (error) {
    console.error("Failed to fetch scholarships:", error);
    throw error;
  }
};

// 추천 장학금 불러오기
export const getRecommendedScholarships = async (userId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/scholarships/api/scholarships/recommend/`,
      { user_id: userId }
    );
    return response.data;
  } catch (error) {
    console.error("추천 장학금 가져오기 실패:", error);
    throw error;
  }
};