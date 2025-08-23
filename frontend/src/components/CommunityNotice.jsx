import React from "react";
import { FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { COMMUNITY_POSTS } from "../mock/community";
import { NOTICE_POSTS } from "../mock/notices";

const CommunityNotice = () => {
  // 커뮤니티: 최신순 5개
  const communityPreview = [...COMMUNITY_POSTS]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  // 공지사항: 고정 → 최신순 → 상위 5개
  const noticePreview = [...NOTICE_POSTS]
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1; // 고정 먼저
      return new Date(b.created_at) - new Date(a.created_at);       // 최신순
    })
    .slice(0, 5);

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
        <ul className="list-none p-0">
          {noticePreview.map((n) => (
            <li
              key={n.id}
              className="text-[1.1rem] text-[#333] flex items-center py-[12px] border-b border-[#eee] hover:text-[#007bff] transition-colors last:border-b-0"
            >
              <FaChevronRight className="mr-[8px] text-[#111]" />
              <Link to={`/notice/${n.id}`} className="text-[#333] hover:underline">
                {n.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CommunityNotice;
