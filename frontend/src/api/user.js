// src/api/user.js
import axios from "./axios";

/**
 * 현재 로그인한 사용자 정보 가져오기
 * (Djoser 기준: GET /auth/users/me/)
 *
 * @returns {Object|null} 사용자 정보 (id, username, email, is_staff 등) 또는 null
 */
export async function fetchMe() {
  try {
    const { data } = await axios.get("/auth/users/me/");
    return data;
  } catch (err) {
    // 로그인 안 했거나 토큰 만료 시
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      return null;
    }
    throw err;
  }
}
