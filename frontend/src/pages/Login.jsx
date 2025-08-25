import { useState, useEffect } from "react";
import axios from "../api/axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [autoLogin, setAutoLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  useEffect(() => {
    const saved = localStorage.getItem("autoLogin") === "true";
    setAutoLogin(saved);
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const { data } = await axios.post("/auth/jwt/create/", {
        username: form.username,
        password: form.password,
      });

      localStorage.setItem("token", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      localStorage.setItem("autoLogin", String(autoLogin));

      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col text-gray-900">
      {/* 중앙 카드 */}
      <div className="flex-1 flex items-center justify-center mt-20">
        <div className="w-[520px] max-w-[92vw] rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="px-10 pt-10 pb-8">
            {/* 로고 */}
            <div className="w-full flex flex-col items-center mb-8">
              <img
                src="src/assets/img/로고.png"
                alt="로고"
                className="h-40 object-contain"
              />
            </div>

            <h2 className="font-bold text-xl mb-4 text-center">
              로그인
            </h2>

            {location.state?.from && (
              <p className="text-sm text-rose-600 mb-2">로그인 후 이용 가능합니다.</p>
            )}
            {errorMessage && (
              <p className="text-sm text-rose-600 mb-2  text-center">{errorMessage}</p>
            )}

            {/* 로그인 폼 */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="username"
                placeholder="id"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
                className="w-full h-11 border border-gray-300 bg-white rounded-md
                           focus:border-black focus:ring-2 focus:ring-black/30 
                           px-4 text-sm placeholder-gray-400 outline-none"
              />
              <input
                type="password"
                name="password"
                placeholder="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full h-11 border border-gray-300 bg-white rounded-md
                           focus:border-black focus:ring-2 focus:ring-black/30 
                           px-4 text-sm placeholder-gray-400 outline-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-black hover:bg-gray-800 disabled:opacity-60
                           text-white text-sm font-semibold transition-colors rounded-md"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>

              {/* 하단 옵션 */}
              <div className="flex items-center justify-between text-xs pt-2">
                {/* 자동 로그인 (찐한 검정) */}
                <label
                  htmlFor="autoLogin"
                  className="inline-flex items-center gap-2 cursor-pointer select-none text-gray-900 font-bold"
                >
                  <input
                    id="autoLogin"
                    type="checkbox"
                    checked={autoLogin}
                    onChange={(e) => setAutoLogin(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    className="relative inline-block w-4 h-4 border border-gray-400 bg-white
                               peer-focus:ring-2 peer-focus:ring-black
                               peer-checked:border-black
                               after:content-[''] after:absolute after:w-[6px] after:h-[10px]
                               after:border-r-2 after:border-b-2 after:border-black
                               after:left-[5px] after:top-[1px] after:rotate-45
                               after:opacity-0 peer-checked:after:opacity-100"
                    aria-hidden="true"
                  />
                  자동 로그인
                </label>

                {/* 나머지 메뉴 (연한 회색) */}
                <div className="flex items-center gap-3 text-gray-400">
                  <button type="button" className="hover:text-gray-600">아이디 찾기</button>
                  <span>|</span>
                  <button type="button" className="hover:text-gray-600">비밀번호 찾기</button>
                  <span>|</span>
                  <button
                    type="button"
                    className="hover:text-gray-600"
                    onClick={() => navigate("/register")}
                  >
                    회원가입
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="py-6 text-[11px] text-gray-900">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <span>© 2025</span>
            <a className="text-gray-900 hover:text-black" href="#!">사용자약관</a>
            <a className="text-gray-900 hover:text-black" href="#!">개인정보 취급방침</a>
            <a className="text-gray-900 hover:text-black" href="#!">커뮤니티정책</a>
            <a className="text-gray-900 hover:text-black" href="#!">쿠키정책</a>
            <a className="text-gray-900 hover:text-black" href="#!">저작권침해</a>
            <a className="text-gray-900 hover:text-black" href="#!">피드백 보내기</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
