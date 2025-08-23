import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pagination, Input, Button } from "antd"; // ✅ Button 추가
import { NOTICE_POSTS } from "../mock/notices";

const { Search } = Input;

export default function NoticeList() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1) 검색 필터
  const filtered = useMemo(() => {
    if (!q.trim()) return NOTICE_POSTS;
    const key = q.toLowerCase();
    return NOTICE_POSTS.filter(
      (n) =>
        (n.title || "").toLowerCase().includes(key) ||
        (n.content || "").toLowerCase().includes(key)
    );
  }, [q]);

  // 2) 정렬: 고정 → 최신순
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [filtered]);

  // 3) 페이지네이션
  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);

  // ✅ 페이지 변경
  const onChangePage = (p, ps) => {
    setPage(p);
    if (ps !== pageSize) setPageSize(ps);
  };

  // ✅ 페이지 크기 변경
  const onShowSizeChange = (_, ps) => {
    setPageSize(ps);
    setPage(1);
  };

  // ✅ 검색 실행
  const onSearch = (value) => {
    setQ(value);
    setPage(1);
  };

  return (
    <main className="pt-28 pb-20 w-[min(92vw,1000px)] mx-auto">
      {/* 제목 중앙 */}
      <h1 className="text-3xl font-extrabold text-[#0B2D6B] mb-6 text-center">
        공지사항
      </h1>

      {/* ✅ antd Search + 검정 버튼 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <Search
            placeholder="제목/내용 검색…"
            allowClear
            size="large"
            onSearch={onSearch}
            style={{ width: "100%", backgroundColor: "#fff" }} // ✅ 흰 배경 + 전체폭
            enterButton={
              <Button
                type="primary"
                size="large"
                style={{ backgroundColor: "#000", borderColor: "#000" }} // ✅ 검정 버튼
              >
                검색
              </Button>
            }
          />
        </div>
        <span className="text-sm text-gray-500">{total}건</span>
      </div>

      {pageItems.length === 0 ? (
        <p className="text-gray-500">공지사항이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-gray-200 border rounded-lg bg-white">
          {pageItems.map((n) => (
            <li key={n.id} className="p-4 hover:bg-gray-50">
              <Link to={`/notice/${n.id}`} className="block">
                <div className="flex items-center gap-2">
                  {n.is_pinned && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      고정
                    </span>
                  )}
                  <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {n.title}
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* ✅ antd Pagination */}
      {total > 0 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={onChangePage}
            showSizeChanger
            onShowSizeChange={onShowSizeChange}
            pageSizeOptions={["10", "20", "50"]}
            showTotal={(t, range) => `${range[0]}-${range[1]} / 총 ${t}건`}
          />
        </div>
      )}
    </main>
  );
}
