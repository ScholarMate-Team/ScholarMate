// src/components/CommunityNotice.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "../api/axios";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/swiper-bundle.css";

// YYYY.MM.DD
const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

// 응답 정규화
const normalizeList = (raw) => {
  const list = Array.isArray(raw) ? raw : raw?.results ?? [];
  return list.map((it) => ({
    id: it.id ?? it.pk ?? it.post_id,
    title: it.title ?? it.scholarshipName ?? it.name ?? "제목 없음",
    scholarship_name: it.scholarship_name ?? it.scholarshipName ?? it.scholarship ?? "",
    created_at:
      it.created_at ?? it.createdAt ?? it.created ?? it.updated_at ?? new Date().toISOString(),
    like_count: it.like_count ?? it.likes_count ?? it.likes ?? it.likeCount ?? 0,
    comment_count: it.comment_count ?? it.comments_count ?? it.comments ?? it.commentCount ?? 0,
    view_count: it.view_count ?? it.views ?? it.viewCount ?? 0,
  }));
};

const Stat = ({ icon, value, title }) => (
  <span className="text-[11px] text-gray-500 flex items-center gap-1" title={title}>
    <span aria-hidden>{icon}</span>
    {value}
  </span>
);

const CommunityNotice = () => {
  const [communityItems, setCommunityItems] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState(null);

  const [popularItem, setPopularItem] = useState(null);
  const [popularLoading, setPopularLoading] = useState(true);

  const [pinnedItem, setPinnedItem] = useState(null);
  const [latestItems, setLatestItems] = useState([]);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [noticeError, setNoticeError] = useState(null);

  // 최신 글
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setCommunityLoading(true);
        setCommunityError(null);
        let res = await axios.get("/community/posts/", {
          params: { page_size: 10, ordering: "-created_at" },
        });
        let items = normalizeList(res.data);
        if (items.length === 0) {
          try {
            res = await axios.get("/community/", {
              params: { page_size: 10, ordering: "-created_at" },
            });
            items = normalizeList(res.data);
          } catch (e2) {
            if (alive) setCommunityError(e2?.response?.status || "FETCH_ERROR");
          }
        }
        if (!alive) return;
        setCommunityItems(items);
      } catch (e) {
        if (!alive) return;
        setCommunityError(e?.response?.status || "FETCH_ERROR");
        setCommunityItems([]);
      } finally {
        if (alive) setCommunityLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 인기글
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setPopularLoading(true);
        const res = await axios.get("/community/posts/", { params: { page_size: 20 } });
        const list = normalizeList(res.data);
        const best = list
          .map((p) => ({
            ...p,
            score: (p.view_count || 0) * 1 + (p.like_count || 0) * 2,
          }))
          .sort((a, b) => b.score - a.score)[0];
        if (alive) setPopularItem(best || null);
      } catch (e) {
        if (alive) setPopularItem(null);
      } finally {
        if (alive) setPopularLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 공지사항
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setNoticeLoading(true);
        setNoticeError(null);
        const { data } = await axios.get("/notices/", {
          params: { page_size: 20, ordering: "-is_pinned,-created_at" },
        });
        if (!alive) return;
        const items = data?.results ?? [];
        const pinned = items.find((n) => n.is_pinned) ?? null;
        const others = items
          .filter((n) => !n.is_pinned)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setPinnedItem(pinned);
        setLatestItems(others);
      } catch (e) {
        if (!alive) return;
        setPinnedItem(null);
        setLatestItems([]);
        setNoticeError(e?.response?.status || "FETCH_ERROR");
      } finally {
        if (alive) setNoticeLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ✅ 모바일 / 데스크탑 글 개수 제한
  const communityLatestForRender = useMemo(() => {
    const base = [...communityItems];
    const filtered = popularItem ? base.filter((p) => p.id !== popularItem.id) : base;
    const isMobile = window.innerWidth < 640;
    return popularItem
      ? filtered.slice(0, isMobile ? 2 : 4)
      : filtered.slice(0, isMobile ? 3 : 5);
  }, [communityItems, popularItem]);

  const latestForNotice = useMemo(() => {
    const isMobile = window.innerWidth < 640;
    return pinnedItem
      ? latestItems.slice(0, isMobile ? 2 : 4)
      : latestItems.slice(0, isMobile ? 3 : 5);
  }, [latestItems, pinnedItem]);

  return (
    <div className="mx-auto mt-[40px] mb-[60px] w-full px-4 sm:px-6 lg:w-[80%] lg:max-w-[1200px]">
      <Swiper
        spaceBetween={16}
        slidesPerView={1}
        pagination={{ clickable: true }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        modules={[Pagination, Autoplay]}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 20 },
        }}
        className="community-swiper"
      >
        {/* 커뮤니티 */}
        <SwiperSlide>
          <div className="bg-white p-3 sm:p-6 rounded-[12px] border border-gray-300 shadow hover:-translate-y-1 transition-transform max-w-[90%] sm:max-w-full mx-auto">
            <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-gray-300">
              <h3 className="text-base sm:text-lg md:text-[1.2rem] font-bold text-gray-900">
                커뮤니티
              </h3>
              <Link to="/community" className="text-xs sm:text-sm text-[#111] hover:underline">
                더보기 +
              </Link>
            </div>

            {/* ✅ 인기글 강조 */}
            {!popularLoading && popularItem && (
              <>
                <div className="mb-3 p-3 rounded-md bg-yellow-50 border border-yellow-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center min-w-0">
                      <FaChevronRight className="mr-[8px] text-[#111] shrink-0" />
                      <Link
                        to={`/community/${popularItem.id}`}
                        className="text-sm font-medium text-[#333] hover:underline truncate"
                        title={`${popularItem.scholarship_name ? `[${popularItem.scholarship_name}] ` : ""}${popularItem.title}`}
                      >
                        {popularItem.scholarship_name && (
                          <span className="text-[#666] mr-2">[{popularItem.scholarship_name}]</span>
                        )}
                        <span className="truncate">{popularItem.title}</span>
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-[11px]">
                      <Stat icon="❤️" value={popularItem.like_count} title="좋아요" />
                      <Stat icon="💬" value={popularItem.comment_count} title="댓글" />
                      <Stat icon="👁" value={popularItem.view_count} title="조회수" />
                      <span className="text-[11px] text-gray-500">{formatDate(popularItem.created_at)}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                        인기
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 my-2" />
              </>
            )}

            {/* 최신글 */}
            {communityLoading ? (
              <ul className="list-none p-0">
                {[...Array(5)].map((_, i) => (
                  <li key={i} className="py-3 border-b border-[#eee]">
                    <div className="h-5 w-3/4 bg-gray-100 rounded animate-pulse" />
                  </li>
                ))}
              </ul>
            ) : communityError ? (
              <div className="text-sm text-red-600 py-3">
                프리뷰를 불러오지 못했어요. (에러: {String(communityError)})
              </div>
            ) : communityLatestForRender.length === 0 ? (
              <div className="text-sm text-gray-500 py-3">게시글이 없습니다.</div>
            ) : (
              <ul className="list-none p-0">
                {communityLatestForRender.map((post) => (
                  <li
                    key={post.id}
                    className="text-sm text-[#333] flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-[#eee] hover:text-[#007bff] transition-colors last:border-b-0"
                  >
                    <div className="flex items-center min-w-0">
                      <FaChevronRight className="mr-[8px] text-[#111]" />
                      <Link
                        to={`/community/${post.id}`}
                        className="text-[#333] hover:underline truncate"
                        title={`${post.scholarship_name ? `[${post.scholarship_name}] ` : ""}${post.title}`}
                      >
                        {post.scholarship_name && (
                          <span className="text-[#666] mr-2">[{post.scholarship_name}]</span>
                        )}
                        <span className="truncate">{post.title}</span>
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 mt-2 sm:mt-0 text-[11px]">
                      <Stat icon="❤️" value={post.like_count} title="좋아요" />
                      <Stat icon="💬" value={post.comment_count} title="댓글" />
                      <Stat icon="👁" value={post.view_count} title="조회수" />
                      <span className="text-[11px] text-gray-500">{formatDate(post.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SwiperSlide>

        {/* 공지사항 */}
        <SwiperSlide>
          <div className="bg-white p-3 sm:p-6 rounded-[12px] border border-gray-300 shadow hover:-translate-y-1 transition-transform max-w-[90%] sm:max-w-full mx-auto">
            <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-gray-300">
              <h3 className="text-base sm:text-lg md:text-[1.2rem] font-bold text-gray-900">
                공지사항
              </h3>
              <Link to="/notice" className="text-xs sm:text-sm text-[#111] hover:underline">
                더보기 +
              </Link>
            </div>
            {noticeLoading ? (
              <ul className="list-none p-0">
                {[...Array(5)].map((_, i) => (
                  <li key={i} className="py-3 border-b border-[#eee]">
                    <div className="h-5 w-3/4 bg-gray-100 rounded animate-pulse" />
                  </li>
                ))}
              </ul>
            ) : noticeError ? (
              <div className="text-sm text-red-600 py-3">
                공지사항을 불러오지 못했어요. (에러: {String(noticeError)})
              </div>
            ) : (
              <>
                {pinnedItem && (
                  <div className="mb-3 p-3 rounded-md bg-yellow-50 border border-yellow-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center min-w-0">
                        <FaChevronRight className="mr-[8px] text-[#111] shrink-0" />
                        <Link
                          to={`/notice/${pinnedItem.id}`}
                          className="text-sm font-medium text-[#333] hover:underline truncate"
                          title={pinnedItem.title}
                        >
                          {pinnedItem.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[11px]">
                        <span className="text-[11px] text-gray-500">{formatDate(pinnedItem.created_at)}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                          고정
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {pinnedItem && <div className="border-t border-gray-200 my-2" />}
                <ul className="list-none p-0">
                  {latestForNotice.map((n) => (
                    <li
                      key={n.id}
                      className="text-sm text-[#333] flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-[#eee] hover:text-[#007bff] transition-colors last:border-b-0"
                    >
                      <div className="flex items-center min-w-0">
                        <FaChevronRight className="mr-[8px] text-[#111]" />
                        <Link
                          to={`/notice/${n.id}`}
                          className="text-[#333] hover:underline truncate"
                          title={n.title}
                        >
                          {n.title}
                        </Link>
                      </div>
                      <span className="text-[11px] text-gray-500 mt-1 sm:mt-0 ml-0 sm:ml-2 shrink-0">
                        {formatDate(n.created_at)}
                      </span>
                    </li>
                  ))}
                  {!pinnedItem && latestForNotice.length === 0 && (
                    <li className="text-sm text-gray-500 py-3">공지사항이 없습니다.</li>
                  )}
                </ul>
              </>
            )}
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
};

export default CommunityNotice;
