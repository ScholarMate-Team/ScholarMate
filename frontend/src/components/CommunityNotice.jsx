import React from "react";
import "../assets/css/CommunityNotice.css";
import { FaChevronRight } from "react-icons/fa";

const CommunityNotice = () => {
    return (
      <div className="info-section">
        {/* 커뮤니티 섹션 */}
        <div className="info-card">
          <div className="info-header">
            <h3>커뮤니티</h3>
            <a href="#">더보기 +</a>
          </div>
          <ul>
            <li><FaChevronRight className="icon" /> ScholarMate 사용자 후기 모음</li>
            <li><FaChevronRight className="icon" /> ScholarMate 사용자 후기 모음</li>
            <li><FaChevronRight className="icon" /> ScholarMate 사용자 후기 모음</li>
            <li><FaChevronRight className="icon" /> ScholarMate 사용자 후기 모음</li>
            <li><FaChevronRight className="icon" /> ScholarMate 사용자 후기 모음</li>
          </ul>
        </div>
  
        {/* 공지사항 섹션 */}
        <div className="info-card">
          <div className="info-header">
            <h3>공지사항</h3>
            <a href="#">더보기 +</a>
          </div>
          <ul>
            <li><FaChevronRight className="icon" /> ScholarMate 서비스 업데이트</li>
            <li><FaChevronRight className="icon" /> ScholarMate 서비스 업데이트</li>
            <li><FaChevronRight className="icon" /> ScholarMate 서비스 업데이트</li>
            <li><FaChevronRight className="icon" /> ScholarMate 서비스 업데이트</li>
            <li><FaChevronRight className="icon" /> ScholarMate 서비스 업데이트</li>
          </ul>
        </div>
      </div>
    );
  };
  
  export default CommunityNotice;
