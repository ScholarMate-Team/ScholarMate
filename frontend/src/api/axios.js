import axios from "axios";
import isTokenExpired from "./auth";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

instance.interceptors.request.use(async (config) => {
  const accessToken = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  if (accessToken && isTokenExpired(accessToken)) {
    try {
      const response = await axios.post(`${instance.defaults.baseURL}/auth/jwt/refresh/`, {
        refresh: refreshToken,
      });

      const newAccess = response.data.access;
      localStorage.setItem("token", newAccess);
      config.headers.Authorization = `Bearer ${newAccess}`;
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      return Promise.reject("토큰 만료로 로그아웃");
    }
  } else if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export default instance;
