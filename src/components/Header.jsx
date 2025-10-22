// src/components/Header.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/img/로고.png";
import HeaderMessagesIcon from "./HeaderMessagesIcon";

export default function Header({ isLoggedIn, setIsLoggedIn, goToSection }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const itemCls =
    "block w-full text-left px-3 py-2 rounded-lg text-gray-800 hover:bg-gray-100 active:bg-gray-200 transition";

  const DrawerItem = ({ to, onClick, children }) =>
    to ? (
      <Link to={to} onClick={onClick} className={itemCls}>
        {children}
      </Link>
    ) : (
      <button type="button" onClick={onClick} className={itemCls}>
        {children}
      </button>
    );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setIsLoggedIn(false);
    navigate("/");
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate("/");
  };

  return (
    <>
      {/* ===== Header ===== */}
      <header className="header flex flex-wrap justify-between items-center px-4 py-3 bg-white shadow-md sticky top-0 z-50">
        {/* Left */}
        <div className="flex items-center mb-2 md:mb-0">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Logo" className="logo h-10 w-auto" />
            <h1 className="text-xl md:text-2xl font-bold ml-2">ScholarMate</h1>
          </Link>
        </div>

        {/* Center Nav */}
        <nav className="nav flex gap-3 overflow-x-auto scrollbar-hide whitespace-nowrap text-xs sm:text-sm md:text-base mb-2 md:mb-0 w-full md:w-auto justify-center">
          <Link to="/scholarships" className="nav-btn">전체 장학금</Link>
          <Link to="/recommendation" className="nav-btn">추천 장학금</Link>
          <Link to="/interest" className="nav-btn">관심 장학금</Link>
          <Link to="/calendar" className="nav-btn">나의 장학 캘린더</Link>
          <Link to="/Userinfor" className="nav-btn">나의 장학 정보</Link>
        </nav>

        {/* Right */}
        <div className="header-right flex flex-row gap-2 items-center whitespace-nowrap">
          <Link to="/messages" className="nav-btn text-xs sm:text-sm md:text-base">쪽지함</Link>
          <HeaderMessagesIcon />

          {isLoggedIn ? (
            <>
              <button className="px-3 py-1 bg-black text-white rounded text-xs sm:text-sm md:text-base hover:bg-gray-800 transition" onClick={() => navigate("/profile")}>
                마이페이지
              </button>
              <button className="px-3 py-1 bg-white border border-gray-400 rounded text-xs sm:text-sm md:text-base hover:bg-gray-100 transition" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <button className="px-3 py-1 bg-black text-white rounded text-xs sm:text-sm md:text-base hover:bg-gray-800 transition" onClick={() => navigate("/login")}>
              로그인
            </button>
          )}

          {/* 햄버거 버튼 */}
          <button type="button" className="sidebar-toggle-btn text-xl sm:text-2xl" onClick={() => setSidebarOpen((v) => !v)}>
            ☰
          </button>
        </div>
      </header>

      {/* ===== Drawer ===== */}
      <div id="left-drawer" className={`drawer ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)}>
        <nav className="drawer-panel" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-head flex justify-between items-center p-4 border-b">
            <strong>메뉴</strong>
            <button className="drawer-close text-2xl" onClick={() => setSidebarOpen(false)}>×</button>
          </div>

          <div className="drawer-links p-2">
            <DrawerItem to="/community" onClick={() => setSidebarOpen(false)}>커뮤니티</DrawerItem>
            <DrawerItem to="/notice" onClick={() => setSidebarOpen(false)}>공지사항</DrawerItem>
            <DrawerItem to="/introduction" onClick={() => setSidebarOpen(false)}>서비스 소개</DrawerItem>
            <hr className="drawer-sep my-2" />
            <DrawerItem onClick={() => goToSection("features")}>시스템 특징</DrawerItem>
            <DrawerItem onClick={() => goToSection("functions")}>주요 기능</DrawerItem>
            <DrawerItem onClick={() => goToSection("how-to")}>이용 방법</DrawerItem>
            <DrawerItem onClick={() => goToSection("contact")}>문의하기</DrawerItem>
          </div>

          <div className="drawer-actions p-4 border-t">
            {isLoggedIn ? (
              <>
                <button className="drawer-btn primary w-full mb-2" onClick={() => { setSidebarOpen(false); navigate("/profile"); }}>
                  마이페이지
                </button>
                <button className="drawer-btn w-full" onClick={() => { setSidebarOpen(false); handleLogout(); }}>
                  로그아웃
                </button>
              </>
            ) : (
              <button className="drawer-btn primary w-full" onClick={() => { setSidebarOpen(false); handleLogin(); }}>
                로그인
              </button>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
