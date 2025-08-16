import React from "react";
import { FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";

const CommunityNotice = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mx-auto mt-[50px] mb-[80px] w-[80%] max-w-[1200px]">
      {/* 커뮤니티 섹션 */}
      <div className="bg-white p-[25px] rounded-[12px] border border-gray-300 shadow-[0_4px_10px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-transform">
        <div className="flex justify-between items-center mb-[15px] pb-[10px] border-b-2 border-gray-300">
          <h3 className="text-[1.4rem] font-bold text-gray-900">커뮤니티</h3>
          <Link to="/community" className="text-[0.9rem] text-[#111] hover:underline">
            더보기 +
          </Link>
        </div>
        <ul className="list-none p-0">
          {[1, 2, 3, 4, 5].map((id) => (
            <li
              key={id}
              className="text-[1.1rem] text-[#333] flex items-center py-[12px] border-b border-[#eee] hover:text-[#007bff] transition-colors last:border-b-0"
            >
              <FaChevronRight className="mr-[8px] text-[#111]" />
              <Link to="/community" className="text-[#333] hover:underline">
                ScholarMate 사용자 후기 모음
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 공지사항 섹션 */}
      <div className="bg-white p-[25px] rounded-[12px] border border-gray-300 shadow-[0_4px_10px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-transform">
        <div className="flex justify-between items-center mb-[15px] pb-[10px] border-b-2 border-gray-300">
          <h3 className="text-[1.4rem] font-bold text-gray-900">공지사항</h3>
          <Link to="/notice" className="text-[0.9rem] text-[#111] hover:underline">
            더보기 +
          </Link>
        </div>
        <ul className="list-none p-0">
          {[1, 2, 3, 4, 5].map((id) => (
            <li
              key={id}
              className="text-[1.1rem] text-[#333] flex items-center py-[12px] border-b border-[#eee] hover:text-[#007bff] transition-colors last:border-b-0"
            >
              <FaChevronRight className="mr-[8px] text-[#111]" />
              <Link to="/notice" className="text-[#333] hover:underline">
                ScholarMate 서비스 업데이트
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CommunityNotice;