// src/api/axios.js
import axios from "axios";
import isTokenExpired from "./auth";

/**
 * Axios 공통 인스턴스 (JWT Bearer + 자동 리프레시)
 *
 * 운영(Vercel): '/api' → vercel.json의 rewrites가 백엔드로 프록시
 * 로컬(Vite): '/api' → vite.config.js proxy가 VITE_API_BASE_URL로 프록시
 */
const instance = axios.create({
  baseURL: "/api",
  timeout: 15000,
  withCredentials:
    String(import.meta.env.VITE_WITH_CREDENTIALS || "").toLowerCase() === "true",
  headers: { Accept: "application/json" },
});

const TOKEN_KEY = "token";
const REFRESH_KEY = "refreshToken";

// 동시 요청 시 리프레시 1회만 수행
let refreshPromise = null;

function getAccess() {
  return localStorage.getItem(TOKEN_KEY);
}
function getRefresh() {
  return localStorage.getItem(REFRESH_KEY);
}
function setAccess(newAccess) {
  if (newAccess) localStorage.setItem(TOKEN_KEY, newAccess);
}
function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
function logoutAndRedirect() {
  clearTokens();
  const next = encodeURIComponent(
    window.location.pathname + window.location.search
  );
  window.location.href = `/login?next=${next}`;
}

/**
 * NOTE:
 *  - 인터셉터 재귀를 피하려고 기본 axios 로 호출
 *  - '/api/auth/jwt/refresh/' 는 Bearer 불필요
 */
async function refreshAccessToken() {
  const refreshToken = getRefresh();
  if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");

  // baseURL '/api' 기준으로 절대 URL 구성
  const url = `${instance.defaults.baseURL}/auth/jwt/refresh/`;
  const { data } = await axios.post(
    url,
    { refresh: refreshToken },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: instance.defaults.withCredentials,
    }
  );

  const newAccess = data?.access;
  if (!newAccess) throw new Error("REFRESH_NO_ACCESS");
  setAccess(newAccess);
  return newAccess;
}

/* ========== 요청 인터셉터 ========== */
instance.interceptors.request.use(
  async (config) => {
    // 기본 Content-Type 지정 (이미 설정돼 있으면 유지)
    if (
      !config.headers ||
      (config.method &&
        ["post", "put", "patch"].includes(config.method.toLowerCase()))
    ) {
      config.headers = {
        "Content-Type": "application/json",
        ...(config.headers || {}),
      };
    } else {
      config.headers = { ...(config.headers || {}) };
    }

    const accessToken = getAccess();
    const refreshToken = getRefresh();

    // refresh 엔드포인트엔 Authorization 달지 않음
    const isRefreshCall =
      (config.url || "").includes("/auth/jwt/refresh/") ||
      (config.baseURL && (config.baseURL + config.url).includes("/auth/jwt/refresh/"));

    if (accessToken && !isRefreshCall) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // 만료된 access가 있으면 미리 리프레시 후 Authorization 교체
    if (accessToken && isTokenExpired(accessToken) && !isRefreshCall) {
      if (!refreshToken) {
        logoutAndRedirect();
        return Promise.reject(
          new Error("Access token expired and no refresh token")
        );
      }
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken()
          .catch((err) => {
            logoutAndRedirect();
            throw err;
          })
          .finally(() => (refreshPromise = null));
      }
      const newAccess = await refreshPromise;
      config.headers.Authorization = `Bearer ${newAccess}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ========== 응답 인터셉터 ========== */
instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    // 네트워크/CORS(preflight 차단 등) -> 그대로 전달
    if (!original || !status) return Promise.reject(error);

    // refresh 호출 자체가 실패한 401이면 바로 로그아웃
    if (original?.url?.includes("/auth/jwt/refresh/") && status === 401) {
      logoutAndRedirect();
      return Promise.reject(error);
    }

    // 한 번만 재시도
    if (status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = getRefresh();
      if (!refreshToken) {
        logoutAndRedirect();
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken()
            .catch((err) => {
              logoutAndRedirect();
              throw err;
            })
            .finally(() => (refreshPromise = null));
        }
        const newAccess = await refreshPromise;

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return instance(original); // baseURL '/api' 유지
      } catch (e) {
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;

// (선택) 외부에서 토큰 제어가 필요할 때 사용할 유틸
export const tokenUtils = {
  getAccess,
  getRefresh,
  setAccess,
  clearTokens,
};
