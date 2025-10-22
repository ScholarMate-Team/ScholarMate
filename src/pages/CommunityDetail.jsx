// src/pages/CommunityDetail.jsx
import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Card,
  Avatar,
  Tag,
  Button,
  Input,
  message,
  Spin,
  Empty,
  Popconfirm,
  Modal,
} from "antd";
import {
  getPost,
  incView,
  listComments,
  addComment,
  ensureConversation,
  updateComment,
  deleteComment,
  addReply,
  updatePost,
  deletePost,
} from "../api/community";
import { fetchMe } from "../api/user";

/* -------------------------------------------
 * ReplyEditor: 독립 컴포넌트 (IME 안전)
 * ------------------------------------------*/
const ReplyEditor = memo(function ReplyEditor({ onSubmit, onCancel, autoFocus = true }) {
  const [value, setValue] = useState("");
  const composingRef = useRef(false);
  const ref = useRef(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus?.();
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    if (composingRef.current) return; // 한글 조합 중 Enter 무시
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (value.trim()) onSubmit(value.trim(), () => setValue(""));
    }
  };

  return (
    <div className="pl-12 pb-3">
      <Input.TextArea
        ref={ref}
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="답글을 입력하세요 (Ctrl/⌘+Enter 전송)"
        onCompositionStart={() => (composingRef.current = true)}
        onCompositionEnd={() => (composingRef.current = false)}
        onKeyDown={handleKeyDown}
      />
      <div className="mt-2 flex gap-2">
        <Button
          className="!bg-black !border-black !text-white hover:!bg-gray-800"
          onClick={() => value.trim() && onSubmit(value.trim(), () => setValue(""))}
        >
          등록
        </Button>
        <Button onClick={onCancel}>취소</Button>
      </div>
    </div>
  );
});

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const [replyOpen, setReplyOpen] = useState({}); // { [commentId]: true }

  const [postEditOpen, setPostEditOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");

  const viewedOnceRef = useRef(false);

  const load = async () => {
    setLoading(true);
    try {
      try {
        const u = await fetchMe();
        setMe(u);
      } catch {
        setMe(null);
      }

      const p = await getPost(id);
      setPost(p);

      if (!viewedOnceRef.current) {
        viewedOnceRef.current = true;
        incView(id).catch(() => {});
      }

      const cs = await listComments({ postId: id });
      setComments(cs);
    } catch (e) {
      console.error(e);
      message.error("글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    viewedOnceRef.current = false;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ---------- 최상위 댓글 등록 ---------- */
  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    setSending(true);
    try {
      const optimistic = {
        id: `tmp-${Date.now()}`,
        content: value,
        created_at: new Date().toISOString(),
        author: me ? { id: me.id, username: me.username } : { username: "나" },
        parent: null,
      };
      setComments((prev) => [optimistic, ...prev]);
      setText("");

      await addComment({ postId: Number(id), content: value });
      const cs = await listComments({ postId: id });
      setComments(cs);
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.status === 401 ? "로그인이 필요합니다." : "댓글 등록 실패"
      );
      setComments((prev) => prev.filter((c) => !String(c.id).startsWith("tmp-")));
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  };

  /* ---------- 글(포스트) 정보 ---------- */
  const authorId =
    post?.author?.id ?? post?.author_id ?? post?.authorId ?? null;
  const authorUsername =
    post?.author?.username ?? post?.author_username ?? post?.username ?? null;

  const canEditPost =
    !!me &&
    ((authorId != null && Number(authorId) === Number(me.id)) ||
      (authorUsername && authorUsername === me.username));

  /* ---------- DM ---------- */
  const startDM = async () => {
    if (!authorId && !authorUsername) {
      message.warning("작성자 정보를 찾을 수 없습니다.");
      return;
    }
    if (me && authorId && Number(authorId) === Number(me.id)) {
      return; // ✅ 자기 자신이면 아예 실행도 안 함
    }

    try {
      const conv = await ensureConversation({
        recipientId: authorId ?? null,
        recipientUsername: authorUsername ?? null,
      });
      if (!conv?.id) {
        message.error("쪽지 대화 생성에 실패했습니다.");
        return;
      }
      navigate(`/messages/${conv.id}`);
    } catch (e) {
      console.error(e);
      const detail =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "";
      if (e?.response?.status === 401) {
        message.error("로그인이 필요합니다.");
      } else if (e?.response?.status === 400) {
        message.error(`요청 형식 오류: ${String(detail) || "잘못된 수신자"}`);
      } else {
        message.error("쪽지 시작 실패");
      }
    }
  };

  /* ---------- 댓글/답글 수정/삭제 ---------- */
  const beginEdit = (c) => {
    setEditingId(c.id);
    setEditingText(c.content);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };
  const submitEdit = async () => {
    const value = editingText.trim();
    if (!value) return;
    try {
      await updateComment({ id: editingId, content: value });
      message.success("수정되었습니다.");
      setEditingId(null);
      setEditingText("");
      const cs = await listComments({ postId: id });
      setComments(cs);
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.status === 403 ? "수정 권한이 없습니다." : "수정 실패"
      );
    }
  };

  const removeComment = async (c) => {
    try {
      await deleteComment(c.id);
      message.success("삭제되었습니다.");
      setComments((prev) => prev.filter((x) => x.id !== c.id && x.parent !== c.id));
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.status === 403 ? "삭제 권한이 없습니다." : "삭제 실패"
      );
    }
  };

  /* ---------- 답글(대댓글) ---------- */
  const submitReply = useCallback(
    async (parent, value, resetInput) => {
      try {
        await addReply({ postId: Number(id), parentId: parent.id, content: value });
        message.success("답글이 등록되었습니다.");
        resetInput?.();
        setReplyOpen((prev) => {
          const next = { ...prev };
          delete next[String(parent.id)];
          return next;
        });
        const cs = await listComments({ postId: id });
        setComments(cs);
      } catch (e) {
        console.error(e);
        message.error(
          e?.response?.status === 401 ? "로그인이 필요합니다." : "답글 등록 실패"
        );
      }
    },
    [id]
  );

  /* ---------- 포스트 수정/삭제 ---------- */
  const openPostEdit = () => {
    setPostTitle(post?.title || post?.scholarship_name || "");
    setPostContent(post?.content || "");
    setPostEditOpen(true);
  };

  const handleSavePost = async () => {
    const payload = { title: postTitle.trim(), content: postContent.trim() };
    if (!payload.title || !payload.content) {
      message.warning("제목과 내용을 모두 입력하세요.");
      return;
    }
    try {
      await updatePost(post.id, payload);
      message.success("글이 수정되었습니다.");
      setPostEditOpen(false);
      await load();
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.status === 403 ? "수정 권한이 없습니다." : "글 수정 실패"
      );
    }
  };

  const handleDeletePost = async () => {
    try {
      await deletePost(post.id);
      message.success("글이 삭제되었습니다.");
      navigate("/community");
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.status === 403 ? "삭제 권한이 없습니다." : "글 삭제 실패"
      );
    }
  };

  /* ---------- 트리 구성 ---------- */
  const roots = useMemo(() => comments.filter((c) => !c.parent), [comments]);
  const childrenMap = useMemo(() => {
    const acc = {};
    for (const c of comments) {
      if (!c.parent) continue;
      const key = String(c.parent);
      (acc[key] ||= []).push(c);
    }
    return acc;
  }, [comments]);

  /* ====== 댓글 아이템 ====== */
  const CommentItem = ({ c, depth = 0 }) => {
    const cAuthorId = c.author?.id ?? c.author_id ?? c.user?.id ?? null;
    const cAuthorUsername =
      c.author?.username ?? c.author_username ?? c.username ?? c.user?.username ?? null;

    const isMine =
      !!me &&
      ((cAuthorId != null && Number(cAuthorId) === Number(me.id)) ||
        (cAuthorUsername && cAuthorUsername === me.username));

    const k = String(c.id);
    const isReplyOpen = !!replyOpen[k];

    return (
      <div className={`w-full ${depth ? "pl-6 border-l border-gray-200" : ""}`}>
        <div className="flex">
          <Avatar>{cAuthorUsername?.[0]?.toUpperCase() || "U"}</Avatar>
          <div className="ml-3 flex-1">
            <div className="font-semibold">{cAuthorUsername ?? "익명"}</div>
            {editingId === c.id ? (
              <div className="mt-2 space-y-2">
                <Input.TextArea
                  rows={2}
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    className="!bg-black !border-black !text-white hover:!bg-gray-800"
                    onClick={submitEdit}
                  >
                    저장
                  </Button>
                  <Button onClick={cancelEdit}>취소</Button>
                </div>
              </div>
            ) : (
              <div className="mt-1 whitespace-pre-wrap">{c.content}</div>
            )}
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="text-xs text-gray-400">
                {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
              </span>
              <Button
                size="small"
                type="link"
                className="!p-0 !h-auto"
                onClick={() => setReplyOpen((prev) => ({ ...prev, [k]: !prev[k] }))}
              >
                {isReplyOpen ? "답글 취소" : "답글"}
              </Button>
              {isMine && (
                <>
                  <Button
                    size="small"
                    type="link"
                    className="!p-0 !h-auto !text-black"
                    onClick={() => beginEdit(c)}
                  >
                    수정
                  </Button>
                  <Popconfirm
                    title="삭제하시겠어요?"
                    okText="삭제"
                    cancelText="취소"
                    okButtonProps={{
                      className: "!bg-black !border-black !text-white hover:!bg-gray-800",
                    }}
                    cancelButtonProps={{
                      className: "!border-gray-400 hover:!border-gray-600",
                    }}
                    onConfirm={() => removeComment(c)}
                  >
                    <Button size="small" type="link" danger className="!p-0 !h-auto">
                      삭제
                    </Button>
                  </Popconfirm>
                </>
              )}
            </div>
            {isReplyOpen && (
              <ReplyEditor
                onSubmit={(val, reset) => submitReply(c, val, reset)}
                onCancel={() =>
                  setReplyOpen((prev) => {
                    const next = { ...prev };
                    delete next[k];
                    return next;
                  })
                }
              />
            )}
          </div>
        </div>
        {(childrenMap[String(c.id)] || []).map((cc) => (
          <CommentItem key={cc.id} c={cc} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <main className="pt-6 pb-6 w-[min(92vw,900px)] mx-auto">
      <Link className="text-[#0B2D6B] underline" to="/community">
        ← 목록으로
      </Link>

      {loading ? (
        <div className="mt-6 flex justify-center py-16">
          <Spin />
        </div>
      ) : !post ? (
        <div className="mt-6">
          <Empty description="글을 찾을 수 없습니다." />
        </div>
      ) : (
        <>
          <Card className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-bold">
                {post.title || post.scholarship_name}
              </h1>
              <div className="flex flex-wrap gap-2">
                {me && Number(authorId) !== Number(me.id) && (
                  <Button
                    className="!bg-black !border-black !text-white hover:!bg-gray-800"
                    onClick={startDM}
                  >
                    작성자에게 쪽지
                  </Button>
                )}
                {canEditPost && (
                  <>
                    <Button
                      className="!bg-black !border-black !text-white hover:!bg-gray-800"
                      onClick={openPostEdit}
                    >
                      수정
                    </Button>
                    <Popconfirm
                      title="글을 삭제하시겠어요?"
                      okText="삭제"
                      cancelText="취소"
                      okButtonProps={{
                        className: "!bg-black !border-black !text-white hover:!bg-gray-800",
                      }}
                      cancelButtonProps={{
                        className: "!border-gray-400 hover:!border-gray-600",
                      }}
                      onConfirm={handleDeletePost}
                    >
                      <Button danger>삭제</Button>
                    </Popconfirm>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center mt-3">
              <Avatar>{(authorUsername || "U")[0].toUpperCase()}</Avatar>
              <div className="ml-3">
                <div className="font-semibold">{authorUsername}</div>
                <div className="text-sm text-gray-500">
                  {post.created_at ? new Date(post.created_at).toLocaleString() : ""}
                </div>
              </div>
            </div>
            <div className="mt-5 whitespace-pre-wrap leading-7">{post.content}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(post.tags || []).map((t, i) => (
                <Tag key={`${t}-${i}`} color="blue">
                  #{t}
                </Tag>
              ))}
            </div>
          </Card>
          <Card title={`댓글 ${comments.length}개`} className="mt-6">
            {comments.length === 0 ? (
              <Empty description="아직 댓글이 없습니다." />
            ) : (
              <div className="space-y-3">
                {roots.map((c) => (
                  <CommentItem key={c.id} c={c} />
                ))}
              </div>
            )}
            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              <Input.TextArea
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="댓글을 입력하세요 (Ctrl/⌘+Enter 전송)"
              />
              <Button
                onClick={submit}
                loading={sending}
                className="self-end sm:self-auto !bg-black !border-black !text-white hover:!bg-gray-800"
              >
                등록
              </Button>
            </div>
          </Card>
          <Modal
            title="글 수정"
            open={postEditOpen}
            onCancel={() => setPostEditOpen(false)}
            onOk={handleSavePost}
            okText="저장"
            cancelText="취소"
            okButtonProps={{
              className: "!bg-black !border-black !text-white hover:!bg-gray-800",
            }}
            cancelButtonProps={{
              className: "!border-gray-400 hover:!border-gray-600",
            }}
          >
            <div className="space-y-3">
              <Input
                placeholder="제목"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
              <Input.TextArea
                rows={8}
                placeholder="내용"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
            </div>
          </Modal>
        </>
      )}
    </main>
  );
}
