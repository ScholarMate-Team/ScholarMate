// src/pages/CommunityPage.jsx
import React, { useEffect, useState } from "react";
import {
  Input, Card, Avatar, Tag, Skeleton, Pagination, Button,
  message, Segmented, Tooltip,
} from "antd";
import {
  HeartOutlined, HeartFilled, ShareAltOutlined,
  BookOutlined, BookFilled, LoadingOutlined,
} from "@ant-design/icons";
import { Link, useSearchParams } from "react-router-dom";
import "../assets/css/community.css";
import {
  listPosts,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  listBookmarkedPosts,
} from "../api/community";
import { fetchMe } from "../api/user";
import PostComposeModal from "../components/PostComposeModal";

export default function CommunityPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // 보기 모드
  const [viewMode, setViewMode] = useState(
    searchParams.get("view") === "bookmarks" ? "bookmarks" : "all"
  );

  // 탭/검색/페이지
  const [category, setCategory] = useState(searchParams.get("category") || "story");
  const [order, setOrder] = useState(searchParams.get("order") || "latest");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [pageSize, setPageSize] = useState(Number(searchParams.get("page_size") || 12));

  const ordering = order === "popular" ? "-view_count" : "-created_at";

  // 로그인 유저
  const [me, setMe] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);

  // 진행중 액션
  const [pendingLike, setPendingLike] = useState(() => new Set());
  const [pendingBookmark, setPendingBookmark] = useState(() => new Set());

  const syncQuery = (next = {}) => {
    const params = new URLSearchParams({
      view: next.viewMode ?? viewMode,
      category: next.category ?? category,
      order: next.order ?? order,
      q: next.q ?? q,
      page: String(next.page ?? page),
      page_size: String(next.pageSize ?? pageSize),
    });
    setSearchParams(params);
  };

  // 목록 불러오기
  const load = async () => {
    setLoading(true);
    try {
      const fetcher = viewMode === "bookmarks" ? listBookmarkedPosts : listPosts;
      const { items, total } = await fetcher({ category, q, page, pageSize, ordering });
      const mapped = (items || []).map((p) => ({
        ...p,
        _liked: !!p.is_liked,
        _bookmarked: !!p.is_bookmarked,
      }));
      setItems(mapped);
      setTotal(total);
    } catch (e) {
      console.error(e);
      message.error("목록을 불러오지 못했습니다.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await fetchMe();
        setMe(u);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [viewMode, category, q, page, pageSize, order]);

  const doSearch = () => {
    const val = searchInput.trim();
    setQ(val);
    setPage(1);
    syncQuery({ q: val, page: 1 });
  };

  const clearSearch = () => {
    setSearchInput("");
    setQ("");
    setPage(1);
    syncQuery({ q: "", page: 1 });
  };

  const onChangePage = (p, ps) => {
    setPage(p);
    if (ps !== pageSize) setPageSize(ps);
    syncQuery({ page: p, pageSize: ps });
  };

  const onShowSizeChange = (_, ps) => {
    setPageSize(ps);
    setPage(1);
    syncQuery({ page: 1, pageSize: ps });
  };

  // 공통 로그인 보호
  const requireAuth = (actionName = "이 기능") => {
    if (!me) {
      message.warning(`${actionName}은(는) 로그인 후 이용 가능합니다.`);
      return false;
    }
    return true;
  };

  // 아이템 업데이트
  const updateItem = (id, updater) => {
    setItems((prev) => prev.map((x) => (x.id === id ? updater(x) : x)));
  };

  // 좋아요
  const handleLike = async (post, e) => {
    e?.preventDefault();
    if (!requireAuth("좋아요")) return;
    if (pendingLike.has(post.id)) return;

    const nextLiked = !post._liked;
    updateItem(post.id, (x) => ({
      ...x,
      _liked: nextLiked,
      likes_count: Math.max(0, (x.likes_count || 0) + (nextLiked ? 1 : -1)),
    }));

    setPendingLike((s) => new Set(s).add(post.id));
    try {
      if (nextLiked) await likePost(post.id);
      else await unlikePost(post.id);
    } catch {
      updateItem(post.id, (x) => ({
        ...x,
        _liked: !nextLiked,
        likes_count: Math.max(0, (x.likes_count || 0) + (nextLiked ? -1 : 1)),
      }));
      message.error("좋아요 처리 실패");
    } finally {
      setPendingLike((s) => {
        const ns = new Set(s);
        ns.delete(post.id);
        return ns;
      });
    }
  };

  // 북마크
  const handleBookmark = async (post, e) => {
    e?.preventDefault();
    if (!requireAuth("북마크")) return;
    if (pendingBookmark.has(post.id)) return;

    const nextBookmarked = !post._bookmarked;
    updateItem(post.id, (x) => ({ ...x, _bookmarked: nextBookmarked }));

    setPendingBookmark((s) => new Set(s).add(post.id));
    try {
      if (nextBookmarked) await bookmarkPost(post.id);
      else await unbookmarkPost(post.id);
    } catch {
      updateItem(post.id, (x) => ({ ...x, _bookmarked: !nextBookmarked }));
      message.error("북마크 처리 실패");
    } finally {
      setPendingBookmark((s) => {
        const ns = new Set(s);
        ns.delete(post.id);
        return ns;
      });
      if (viewMode === "bookmarks" && !nextBookmarked) {
        setItems((prev) => prev.filter((x) => x.id !== post.id));
        setTotal((t) => Math.max(0, t - 1));
      }
    }
  };

  // 공유
  const handleShare = async (post, e) => {
    e?.preventDefault();
    const shareUrl = `${window.location.origin}/community/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        message.success("링크 복사 완료");
      }
    } catch {
      message.error("공유 실패");
    }
  };

  const isLiking = (id) => pendingLike.has(id);
  const isBookmarking = (id) => pendingBookmark.has(id);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* ===== 상단 헤더 ===== */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 sm:px-6 py-6 shadow">
        <div className="w-full flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">ScholarMate 커뮤니티</h1>

            <div className="flex gap-2 flex-wrap">
              <Segmented
                value={order}
                onChange={(v) => { setOrder(v); setPage(1); syncQuery({ order: v, page: 1 }); }}
                options={[{ label: "최신", value: "latest" }, { label: "인기", value: "popular" }]}
              />
              <Segmented
                value={viewMode}
                onChange={(v) => { setViewMode(v); setPage(1); syncQuery({ viewMode: v, page: 1 }); }}
                options={[{ label: "전체", value: "all" }, { label: "내 북마크", value: "bookmarks" }]}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Segmented
              value={category}
              onChange={(v) => { setCategory(v); setPage(1); syncQuery({ category: v, page: 1 }); }}
              options={[{ label: "스토리", value: "story" }, { label: "피드", value: "feed" }]}
            />

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="flex w-full sm:w-[24rem]">
                <Input
                  size="large"
                  placeholder="검색..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onPressEnter={doSearch}
                  allowClear
                  onClear={clearSearch}
                  className="!h-11 !rounded-l-full !rounded-r-none bg-white border border-gray-300"
                />
                <Button
                  type="primary"
                  size="large"
                  onClick={doSearch}
                  className="!h-11 !rounded-l-none !rounded-r-full bg-black border-black hover:!bg-neutral-800"
                >
                  검색
                </Button>
              </div>

              {me && (
                <Button
                  type="primary"
                  onClick={() => setComposeOpen(true)}
                  className="bg-black border-black hover:!bg-neutral-800"
                >
                  글쓰기
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== 본문 ===== */}
      <main className="w-full px-4 sm:px-6 py-6 flex-1">
        <h2 className="text-lg sm:text-2xl font-bold mb-4">
          게시글 <span className="text-gray-500 text-sm sm:text-base">({total}건)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {loading ? (
            Array(6).fill(null).map((_, i) => (
              <Card key={i} className="shadow-md h-full">
                <Skeleton avatar active paragraph={{ rows: 3 }} />
              </Card>
            ))
          ) : items.length > 0 ? (
            items.map((post) => {
              const liking = isLiking(post.id);
              const bookmarking = isBookmarking(post.id);
              return (
                <Link to={`/community/${post.id}`} key={post.id}>
                  <Card
                    hoverable
                    className="shadow-sm hover:shadow-lg transition h-full rounded-lg"
                    actions={[
                      <div key="like" onClick={(e) => handleLike(post, e)}>
                        {liking ? <LoadingOutlined /> : post._liked ? <HeartFilled className="text-red-500" /> : <HeartOutlined />}
                        <span className="ml-1 text-xs sm:text-sm">{post.likes_count ?? 0}</span>
                      </div>,
                      <div key="bookmark" onClick={(e) => handleBookmark(post, e)}>
                        {bookmarking ? <LoadingOutlined /> : post._bookmarked ? <BookFilled className="text-blue-500" /> : <BookOutlined />}
                      </div>,
                      <Tooltip key="share" title="공유">
                        <ShareAltOutlined onClick={(e) => handleShare(post, e)} />
                      </Tooltip>,
                    ]}
                  >
                    <div className="flex flex-col h-full">
                      <div className="mb-2 text-base sm:text-lg font-bold">{post.scholarship_name || "장학금"}</div>
                      <div className="flex items-center mb-3">
                        <Avatar size={32}>{post.author?.username?.[0]?.toUpperCase() || "U"}</Avatar>
                        <div className="ml-2">
                          <div className="font-semibold text-sm sm:text-base">{post.author?.username || "사용자"}</div>
                          <div className="text-xs sm:text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm sm:text-base mb-2 line-clamp-2">{post.title || "제목 없음"}</h3>
                      <p className="text-gray-700 text-sm sm:text-base mb-3 line-clamp-3 flex-1">{post.content}</p>
                      <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {(post.tags || []).map((tag, idx) => (
                          <Tag key={idx} color="blue" className="text-xs sm:text-sm whitespace-nowrap">#{tag}</Tag>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full text-center text-gray-500 py-10">
              {viewMode === "bookmarks" ? "북마크한 게시글이 없습니다." : "표시할 게시글이 없습니다."}
            </div>
          )}
        </div>
      </main>

      {/* 페이지네이션 */}
      {!loading && total > 0 && (
        <div className="sticky bottom-0 z-30 bg-gray-50 border-t py-3">
          <div className="flex justify-center">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={onChangePage}
              showSizeChanger
              onShowSizeChange={onShowSizeChange}
              pageSizeOptions={["12", "24", "48"]}
              showTotal={(t, range) => `${range[0]}-${range[1]} / 총 ${t}건`}
            />
          </div>
        </div>
      )}

      {/* 글쓰기 모달 */}
      <PostComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onCreated={() => { setComposeOpen(false); setPage(1); load(); }}
        defaultCategory={category}
      />
    </div>
  );
}
