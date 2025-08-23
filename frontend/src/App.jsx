import { useState, useEffect } from "react";
import { Route, Routes, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Scholarships from "./pages/Scholarships";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Useinfor from "./pages/Userinfor";
import PrivateRoute from "./components/PrivateRoute";
import logo from "./assets/img/로고.png";
import Wishlist from "./components/Wishlist";
import CalendarPage from "./pages/Calendar";
import isTokenExpired from "./api/auth"; 
import Recommendation from "./pages/Recommendation";
import CommunityPage from "./pages/CommunityPage";
import Introduction from "./pages/Introduction";  
import NoticeList from "./pages/NoticeList";
import NoticeDetail from "./pages/NoticeDetail";
import CommunityDetail from "./pages/CommunityDetail";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token && isTokenExpired(token)) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(!!token);
    }
  }, [location.pathname]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate("/", { replace: true }); // ✅ navigate로 일관성 유지
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken"); // ✅ refreshToken도 삭제
    setIsLoggedIn(false);
    navigate("/", { replace: true }); // ✅ 새로고침 대신 부드러운 라우팅
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <Link to="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}>
            <img src={logo} alt="Logo" className="logo" />
             <h1 className="text-center text-2xl font-bold">
              ScholarMate
             </h1>
          </Link>
        </div>
        <nav className="nav">
          <Link to="/scholarships" className="nav-btn">전체 장학금</Link>
          <Link to="/recommendation" className="nav-btn">추천 장학금</Link>
          <Link to="/interest" className="nav-btn">관심 장학금</Link>
          <Link to="/calendar" className="nav-btn">나의 장학 캘린더</Link>
          <Link to="/Userinfor" className="nav-btn">나의 장학 정보</Link>
        </nav>
        <div className="header-right" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {isLoggedIn ? (
            <button className="login-btn" onClick={() => navigate("/profile")}>마이페이지</button>
          ) : (
            <button className="login-btn" style={{ visibility: "hidden" }}>마이페이지</button>
          )}
          {isLoggedIn ? (
            <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
          ) : (
            <button className="login-btn" onClick={() => navigate("/login")}>로그인</button>
          )}
        </div>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/scholarships"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn}>
                <Scholarships />
              </PrivateRoute>
            }
          />
          <Route
            path="/recommendation"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn}>
                <Recommendation />
              </PrivateRoute>
            }
          />
          <Route
            path="/interest"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn}>
                <Wishlist />
              </PrivateRoute>
            }
          />
            
          <Route
            path="/calendar"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn}>
                <CalendarPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/Userinfor"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn}>
                <Useinfor />
              </PrivateRoute>
            }
          />
          <Route
            path="/community"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn}>
                <CommunityPage />
              </PrivateRoute>
            }
          />
          <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
          <Route path="/register" element={isLoggedIn ? <Navigate to="/" /> : <Register />} />
          <Route path="/introduction" element={<Introduction />} />
          <Route path="/notice" element={<NoticeList />} />
          <Route path="/notice/:id" element={<NoticeDetail />} />
          <Route path="/community/:id" element={<CommunityDetail />} />
        </Routes>
      </main>
    </>
  );
}
