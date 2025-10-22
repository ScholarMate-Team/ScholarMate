// src/api/community.js
import axios from "./axios";

/** DRF pagination/배열 모두 대응 */
function asPage(data) {
  if (!data) return { items: [], total: 0 };
  if (Array.isArray(data)) return { items: data, total: data.length };
  return {
    items: data.results ?? [],
    total: data.count ?? (data.results?.length ?? 0),
  };
}

/* =========================
 * Posts
 * =======================*/
export async function listPosts({
  category = "story",
  q = "",
  page = 1,
  pageSize = 12,
  ordering = "-created_at",
} = {}) {
  const params = {
    category,
    search: q || undefined,
    page,
    page_size: pageSize,
    ordering,
  };
  const { data } = await axios.get("/community/posts/", { params });
  return asPage(data);
}

export async function listBookmarkedPosts({
  category = "",
  q = "",
  page = 1,
  pageSize = 12,
  ordering = "-created_at",
} = {}) {
  const params = {
    category: category || undefined,
    search: q || undefined,
    page,
    page_size: pageSize,
    ordering,
  };
  const { data } = await axios.get("/community/posts/my_bookmarks/", { params });
  return asPage(data);
}

export async function getPost(id) {
  const { data } = await axios.get(`/community/posts/${id}/`);
  return data;
}

export async function createPost(payload) {
  const { data } = await axios.post("/community/posts/", payload);
  return data;
}

export async function updatePost(id, payload) {
  const { data } = await axios.patch(`/community/posts/${id}/`, payload);
  return data;
}

export async function deletePost(id) {
  await axios.delete(`/community/posts/${id}/`);
}

export async function likePost(id) {
  await axios.post(`/community/posts/${id}/like/`);
}
export async function unlikePost(id) {
  await axios.post(`/community/posts/${id}/unlike/`);
}
export async function bookmarkPost(id) {
  await axios.post(`/community/posts/${id}/bookmark/`);
}
export async function unbookmarkPost(id) {
  await axios.post(`/community/posts/${id}/unbookmark/`);
}
export async function incView(id) {
  try {
    await axios.post(`/community/posts/${id}/increment_view/`);
  } catch (_) {}
}

/* =========================
 * Comments
 * =======================*/
export async function listComments({ postId, parent = null }) {
  const params = {
    post: postId,
    parent: parent ?? undefined,
    ordering: "created_at",
  };
  const { data } = await axios.get("/community/comments/", { params });
  return Array.isArray(data) ? data : data?.results ?? [];
}

export async function addComment({ postId, content, parent = null }) {
  const payload = { post: postId, content, parent };
  const { data } = await axios.post("/community/comments/", payload);
  return data;
}

export async function updateComment({ id, content }) {
  const { data } = await axios.patch(`/community/comments/${id}/`, { content });
  return data;
}

export async function deleteComment(id) {
  await axios.delete(`/community/comments/${id}/`);
}

export async function addReply({ postId, parentId, content }) {
  const { data } = await axios.post(`/community/comments/`, {
    post: postId,
    parent: parentId,
    content,
  });
  return data;
}

/* =========================
 * DM (1:1)
 * =======================*/
/** 백엔드 스펙: POST /api/community/conversations/
 *  recipient_id (number) 또는 recipient_username (string) 중 하나만 전송 */
export async function ensureConversation({ recipientId, recipientUsername }) {
  if (recipientId == null && !recipientUsername) {
    throw new Error("recipient 정보가 없습니다.");
  }
  const body =
    recipientId != null
      ? { recipient_id: Number(recipientId) }
      : { recipient_username: recipientUsername };

  const { data } = await axios.post("/community/conversations/", body);
  return data; // { id, participants, ... }
}

/** 메시지 목록: ?conversation=<id>&ordering=created_at */
export async function listMessages(
  conversationId,
  { page = 1, pageSize = 100 } = {}
) {
  const params = {
    conversation: conversationId,
    ordering: "created_at",
    page,
    page_size: pageSize,
  };
  const { data } = await axios.get("/community/messages/", { params });
  return Array.isArray(data) ? data : data?.results ?? [];
}

/** 메시지 전송 */
export async function sendMessage({ conversationId, content }) {
  const { data } = await axios.post("/community/messages/", {
    conversation: conversationId,
    content,
  });
  return data;
}
