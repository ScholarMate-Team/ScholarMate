import React, { useEffect, useMemo, useState } from "react";
import { Input, Card, Avatar, Tag, Skeleton, Pagination, Button } from "antd";
import {
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  BookOutlined,
  BookFilled,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import "../assets/css/community.css";
import { COMMUNITY_POSTS } from "../mock/community";

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 실제 검색에 사용하는 값
  const [q, setQ] = useState("");
  // 입력 중인 텍스트 (엔터/버튼 때만 q로 반영)
  const [searchInput, setSearchInput] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setPosts([...COMMUNITY_POSTS]);
      setLoading(false);
    }, 300);
  }, []);

  const handleLike = (id) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const handleBookmark = (id) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isBookmarked: !p.isBookmarked } : p))
    );
  };

  // 검색 실행 (엔터/버튼에서만 호출)
  const doSearch = () => {
    setQ(searchInput.trim());
    setPage(1);
  };

  // 검색 초기화
  const clearSearch = () => {
    setSearchInput("");
    setQ("");       // 실제 검색어도 초기화
    setPage(1);
  };

  // 검색 필터
  const filtered = useMemo(() => {
    if (!q) return posts;
    const key = q.toLowerCase();
    return posts.filter(
      (post) =>
        post.scholarshipName.toLowerCase().includes(key) ||
        post.content.toLowerCase().includes(key) ||
        post.author.name.toLowerCase().includes(key) ||
        post.tags.some((tag) => tag.toLowerCase().includes(key))
    );
  }, [posts, q]);

  // 최신순 정렬
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ad = a.created_at ? new Date(a.created_at).getTime() : a.id;
      const bd = b.created_at ? new Date(b.created_at).getTime() : b.id;
      return bd - ad;
    });
  }, [filtered]);

  // 페이지네이션
  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);

  const onChangePage = (p, ps) => {
    setPage(p);
    if (ps !== pageSize) setPageSize(ps);
  };
  const onShowSizeChange = (_, ps) => {
    setPageSize(ps);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-6 rounded-b-2xl shadow mt-[80px]">
        <div className="w-full px-6 md:px-10 flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            ScholarMate <span className="font-normal">커뮤니티</span>
          </h1>

          {/* 🔎 검색: Input + Button(검정), 엔터/버튼으로만 검색 */}
          <div className="w-full md:w-1/3 mt-4 md:mt-0">
            <div className="flex">
              <Input
                size="large"
                placeholder="장학금, 작성자, 내용 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onPressEnter={doSearch}
                allowClear
                onClear={clearSearch}   // X 버튼 눌렀을 때 초기화
                className="!h-11 !rounded-l-full !rounded-r-none !bg-white 
                           !border !border-gray-300 focus:!border-[#0B2D6B]"
              />
              <Button
                type="primary"
                size="large"
                onClick={doSearch}
                className="!h-11 !rounded-l-none !rounded-r-full 
                           !bg-black !border-black hover:!bg-neutral-800"
              >
                검색
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <main className="w-full px-6 md:px-10 py-8">
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            게시글 목록 <span className="text-gray-500 text-base">({total}건)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {loading
              ? Array(6)
                  .fill(null)
                  .map((_, i) => (
                    <div key={i} className="h-full">
                      <Card className="card-full shadow-md h-full">
                        <Skeleton avatar active paragraph={{ rows: 3 }} />
                      </Card>
                    </div>
                  ))
              : pageItems.length > 0
              ? pageItems.map((post) => (
                  <div key={post.id} className="h-full">
                    <Card
                      title={
                        <Link
                          to={`/community/${post.id}`}
                          className="card-title-clamp hover:underline"
                        >
                          {post.scholarshipName}
                        </Link>
                      }
                      className="card-full shadow-md hover:shadow-lg transition-shadow h-full"
                      actions={[
                        <div onClick={() => handleLike(post.id)} className="cursor-pointer" key="like">
                          {post.isLiked ? <HeartFilled className="text-red-500" /> : <HeartOutlined />}
                          <span className="ml-1">{post.likes}</span>
                        </div>,
                        <div onClick={() => handleBookmark(post.id)} className="cursor-pointer" key="bookmark">
                          {post.isBookmarked ? <BookFilled className="text-blue-500" /> : <BookOutlined />}
                        </div>,
                        <ShareAltOutlined key="share" />,
                      ]}
                    >
                      <div className="post-body">
                        <div className="flex items-center mb-3">
                          <Avatar src={post.author.avatar} />
                          <div className="ml-3">
                            <div className="font-semibold">{post.author.name}</div>
                            <div className="text-sm text-gray-500">
                              {post.author.major} | {post.author.year}
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-3 post-content">{post.content}</p>

                        <div className="flex flex-wrap gap-1 mt-auto">
                          {post.tags.map((tag, idx) => (
                            <Tag key={idx} color="blue">
                              #{tag}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))
              : (
                <div className="col-span-full text-center text-gray-500">
                  표시할 게시글이 없습니다.
                </div>
              )}
          </div>

          {/* Pagination */}
          {!loading && total > 0 && (
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
        </section>
      </main>
    </div>
  );
}
