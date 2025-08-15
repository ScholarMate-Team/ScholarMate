// src/api/user.js
import axios from "./axios";

export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");

  // 절대 경로 대신 상대 경로 사용
  const response = await axios.get("/auth/users/me/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};