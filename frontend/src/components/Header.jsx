import { Link } from "react-router-dom";
import logo from "../assets/img/로고.png";

export default function Header({ isLoggedIn, handleLogout }) {
  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-white border-b border-gray-200 shadow-sm z-50 flex items-center justify-between px-8">
      {/* 왼쪽 로고 */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="ScholarMate Logo" className="w-10 h-10" />
          <h1 className="text-xl font-bold text-[#2c3e50]">ScholarMate</h1>
        </Link>
      </div>

      {/* 가운데 네비게이션 */}
      <nav className="flex gap-6 text-sm text-[#2c3e50] font-medium">
        <Link to="/scholarships" className="hover:text-blue-600">전체 장학금</Link>
        <Link to="/recommendations" className="hover:text-blue-600">추천 장학금</Link>
        <Link to="/community" className="hover:text-blue-600">관심 장학금</Link>
        <Link to="/calendar" className="hover:text-blue-600">개인 장학 캘린더</Link>
        <Link to="/Userinfor" className="hover:text-blue-600">개인 장학 정보</Link>
      </nav>

      {/* 오른쪽 버튼 */}
      <div className="flex gap-2">
        {isLoggedIn ? (
          <>
            <button
              onClick={() => window.location.href = "/profile"}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              마이페이지
            </button>
            <button
              onClick={handleLogout}
              className="text-black px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white transition"
            >
              로그아웃
            </button>
          </>
        ) : (
          <button
            onClick={() => window.location.href = "/login"}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
}
