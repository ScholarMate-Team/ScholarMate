// src/api/notices.js
import axios from "./axios";

/**
 * 공지 목록 (공개글만)
 * @param {Object} opts
 * @param {string} opts.q - 검색어 (title/content)
 * @param {number} opts.page - 페이지 번호(1-base)
 * @param {number} opts.pageSize - 페이지 크기
 * @param {string} opts.ordering - 정렬 (예: "-is_pinned,-created_at")
 */
export async function fetchNotices({
  q = "",
  page = 1,
  pageSize = 10,
  ordering = "-is_pinned,-created_at",
} = {}) {
  const params = {
    search: q || undefined,
    page,
    page_size: pageSize,
    ordering,
  };
  const { data } = await axios.get("/notices/", { params });
  return { total: data.count, items: data.results };
}

/**
 * 공지 상세 (공개글은 조회 시 view_count +1)
 * @param {number|string} id
 */
export async function fetchNotice(id) {
  const { data } = await axios.get(`/notices/${id}/`);
  return data;
}

/**
 * (관리자) 새 공지 생성
 * @param {{title:string, content:string, is_pinned?:boolean, is_published?:boolean}} payload
 */
export async function createNotice(payload) {
  const { data } = await axios.post("/notices/", payload);
  return data;
}

/**
 * (관리자) 공지 수정 (부분 수정)
 * @param {number|string} id
 * @param {{title?:string, content?:string, is_pinned?:boolean, is_published?:boolean}} payload
 */
export async function updateNotice(id, payload) {
  const { data } = await axios.patch(`/notices/${id}/`, payload);
  return data;
}

/**
 * (관리자) 공지 삭제
 * @param {number|string} id
 */
export async function deleteNotice(id) {
  await axios.delete(`/notices/${id}/`);
}
