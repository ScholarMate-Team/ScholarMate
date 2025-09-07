import React, { useEffect, useState, useMemo } from "react";
import { FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { COMMUNITY_POSTS } from "../mock/community";
import axios from "../api/axios"; // baseURL: http://34.228.112.95

// 날짜 포맷 (YYYY.MM.DD)
const formatDate = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const CommunityNotice = () => {
  // 커뮤니티: 최신순 5개
  const communityPreview = useMemo(() => {
    return [...COMMUNITY_POSTS]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  }, []);

  // 공지: 고정 1개(별도 블록) + 최신 4개 (고정 없으면 최신 5개)
  const [pinnedItem, setPinnedItem] = useState(null);
  const [latestItems, setLatestItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/notices/", {
          params: { page_size: 20, ordering: "-is_pinned,-created_at" },
        });
        if (!alive) return;
        const items = data?.results ?? [];

        const pinnedList = items.filter((n) => n.is_pinned);
        const pinned = pinnedList.length > 0 ? pinnedList[0] : null;

        const othersSorted = items
          .filter((n) => !n.is_pinned)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (pinned) {
          setPinnedItem(pinned);
          setLatestItems(othersSorted.slice(0, 4));
        } else {
          setPinnedItem(null);
          setLatestItems(othersSorted.slice(0, 5));
        }
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setPinnedItem(null);
        setLatestItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mx-auto mt-[50px] mb-[80px] w-[80%] max-w-[1200px]">
      {/* 커뮤니티 섹션 */}
      <div className="bg-white p-[25px] rounded-[12px] border border-gray-300 shadow hover:-translate-y-1 transition-transform">
        <div className="flex justify-between items-center mb-[15px] pb-[10px] border-b-2 border-gray-300">
          <h3 className="text-[1.4rem] font-bold text-gray-900">커뮤니티</h3>
          <Link to="/community" className="text-[0.9rem] text-[#111] hover:underline">
            더보기 +
          </Link>
        </div>
        <ul className="list-none p-0">
          {communityPreview.map((post) => (
            <li
              key={post.id}
              className="text-[1.1rem] text-[#333] flex items-center py-[12px] border-b border-[#eee] hover:text-[#007bff] transition-colors last:border-b-0"
            >
              <FaChevronRight className="mr-[8px] text-[#111]" />
              <Link to={`/community/${post.id}`} className="text-[#333] hover:underline">
                {post.scholarshipName}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 공지사항 섹션 */}
      <div className="bg-white p-[25px] rounded-[12px] border border-gray-300 shadow hover:-translate-y-1 transition-transform">
        <div className="flex justify-between items-center mb-[15px] pb-[10px] border-b-2 border-gray-300">
          <h3 className="text-[1.4rem] font-bold text-gray-900">공지사항</h3>
          <Link to="/notice" className="text-[0.9rem] text-[#111] hover:underline">
            더보기 +
          </Link>
        </div>

        {loading ? (
          <ul className="list-none p-0">
            {[...Array(5)].map((_, i) => (
              <li key={i} className="py-[12px] border-b border-[#eee]">
                <div className="h-5 w-3/4 bg-gray-100 rounded animate-pulse" />
              </li>
            ))}
          </ul>
        ) : (
          <>
            {/* 고정 공지 블록 */}
            {pinnedItem && (
              <div className="mb-3 p-3 rounded-md bg-yellow-50 border border-yellow-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center min-w-0">
                    <FaChevronRight className="mr-[8px] text-[#111] shrink-0" />
                    <Link
                      to={`/notice/${pinnedItem.id}`}
                      className="text-[1.05rem] font-medium text-[#333] hover:underline truncate"
                      title={pinnedItem.title}
                    >
                      {pinnedItem.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500">{formatDate(pinnedItem.created_at)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                      고정
                    </span>
                  </div>
                </div>
              </div>
            )}

            {pinnedItem && <div className="border-t border-gray-200 my-2" />}

            {/* 최신 목록 */}
            <ul className="list-none p-0">
              {latestItems.map((n) => (
                <li
                  key={n.id}
                  className="text-[1.1rem] text-[#333] flex items-center justify-between py-[12px] border-b border-[#eee] hover:text-[#007bff] transition-colors last:border-b-0"
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
                  <span className="text-xs text-gray-500 ml-2 shrink-0">
                    {formatDate(n.created_at)}
                  </span>
                </li>
              ))}
              {!pinnedItem && latestItems.length === 0 && (
                <li className="text-sm text-gray-500 py-[12px]">공지사항이 없습니다.</li>
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default CommunityNotice;
