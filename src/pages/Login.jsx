// src/pages/Login.jsx
import { useState, useEffect, useRef } from "react";
import axios from "../api/axios";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/img/로고.png";

/* ------------------------------
   공용 모달 셸
-------------------------------- */
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full flex justify-center items-start pt-20 sm:pt-24 p-3 sm:p-4">
        <div
          className="relative w-full max-w-[520px] bg-white rounded-xl shadow-lg border border-gray-200 p-5 sm:p-6 max-h-[85vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-900">{title}</h3>
          {children}
          <div className="mt-5 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-9 sm:h-10 px-3 sm:px-4 rounded-md border border-gray-300 text-xs sm:text-sm hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------
   아이디 찾기 모달
-------------------------------- */
function FindIdModal({
  onClose,
  idEmail, setIdEmail,
  idCode, setIdCode,
  idSubmitting,
  idInfo, idErr,
  idCodeSent, idVerified,
  sendIdCode, verifyIdCode, revealUsernames,
  revealedUsernames,
  inputCls
}) {
  const codeInputRef = useRef(null);
  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);

  return (
    <ModalShell title="아이디 찾기" onClose={onClose}>
      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
        가입하신 이메일로 본인 인증 후 아이디를 확인할 수 있어요.
      </p>

      <label className="block text-xs text-gray-600 mb-1">이메일</label>
      <input
        type="email"
        placeholder="example@email.com"
        value={idEmail}
        onChange={(e) => setIdEmail(e.target.value)}
        className={inputCls}
      />

      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <button
          type="button"
          onClick={sendIdCode}
          disabled={idSubmitting}
          className="h-9 sm:h-10 px-3 sm:px-4 rounded-md bg-black text-white text-xs sm:text-sm hover:bg-gray-800 disabled:opacity-60"
        >
          {idSubmitting ? "전송 중..." : "인증코드 보내기"}
        </button>
        {idCodeSent && <span className="text-xs text-emerald-600">전송됨</span>}
      </div>

      <div className="mt-4">
        <label className="block text-xs text-gray-600 mb-1">인증코드</label>
        <input
          ref={codeInputRef}
          type="text"
          placeholder="6자리 코드"
          value={idCode}
          onChange={(e) => setIdCode(e.target.value)}
          className={inputCls}
        />
        <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <button
            type="button"
            onClick={verifyIdCode}
            disabled={idSubmitting}
            className="h-9 sm:h-10 px-3 sm:px-4 rounded-md border border-gray-300 text-xs sm:text-sm hover:bg-gray-50"
          >
            {idSubmitting ? "확인 중..." : "코드 확인"}
          </button>
          {idVerified && <span className="ml-2 text-xs text-emerald-600">인증 완료</span>}
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={revealUsernames}
          disabled={idSubmitting || !idVerified}
          className="h-9 sm:h-10 px-3 sm:px-4 rounded-md bg-gray-900 text-white text-xs sm:text-sm hover:bg-gray-800 disabled:opacity-60"
        >
          {idSubmitting ? "조회 중..." : "아이디 보기"}
        </button>
      </div>

      {idInfo && <p className="text-xs text-emerald-600 mt-2">{idInfo}</p>}
      {idErr && <p className="text-xs text-rose-600 mt-2">{idErr}</p>}

      {revealedUsernames.length > 0 && (
        <div className="mt-4 border border-gray-200 rounded-md p-3 bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">해당 이메일로 가입된 아이디:</p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-900 space-y-1 max-h-40 sm:max-h-56 overflow-auto pr-1">
            {revealedUsernames.map((u, i) => (
              <li key={`${u}-${i}`} className="flex items-center justify-between">
                <span className="truncate">{u}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText?.(u)}
                  className="text-xs underline text-gray-500 hover:text-gray-700 shrink-0"
                >
                  복사
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ModalShell>
  );
}

/* ------------------------------
   비밀번호 재설정 모달
-------------------------------- */
function ResetPwByCodeModal({ onClose, inputCls }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendCode = async () => {
    setErr(""); setInfo("");
    if (!username) return setErr("아이디를 입력해 주세요.");
    if (!email) return setErr("이메일을 입력해 주세요.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("올바른 이메일 형식이 아닙니다.");
    if (cooldown) return;

    setSubmitting(true);
    try {
      await axios.post("/auth/password/send-code/", { username, email });
      setCodeSent(true);
      setInfo("인증 코드를 전송했습니다. 메일함(스팸함 포함)을 확인해 주세요.");
      setCooldown(60);
    } catch (e) {
      const msg = e?.response?.data?.detail || "코드 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      setErr(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async () => {
    setErr(""); setInfo("");
    if (!username || !email || !code) return setErr("아이디, 이메일, 인증코드를 모두 입력해 주세요.");
    setSubmitting(true);
    try {
      const { data } = await axios.post("/auth/password/verify-code/", { username, email, code });
      setResetToken(data.reset_token);
      setVerified(true);
      setInfo("인증이 완료되었습니다. 새 비밀번호를 설정해 주세요.");
    } catch (e) {
      const msg = e?.response?.data?.detail || "인증에 실패했습니다. 코드를 확인해 주세요.";
      setErr(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async () => {
    setErr(""); setInfo("");
    if (!verified || !resetToken) return setErr("인증이 필요합니다.");
    if (!pw1 || !pw2) return setErr("새 비밀번호를 입력해 주세요.");
    if (pw1.length < 8) return setErr("비밀번호는 8자 이상이어야 합니다.");
    if (pw1 !== pw2) return setErr("비밀번호가 일치하지 않습니다.");

    setSubmitting(true);
    try {
      await axios.post("/auth/password/reset-with-code/", {
        username, email, reset_token: resetToken, new_password: pw1, re_new_password: pw2,
      });
      setInfo("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.");
      setTimeout(() => onClose(), 1000);
    } catch (e) {
      const msg =
        e?.response?.data?.new_password?.[0] ||
        e?.response?.data?.detail ||
        "비밀번호 변경에 실패했습니다. 다시 시도해 주세요.";
      setErr(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="비밀번호 재설정 (코드 인증)" onClose={onClose}>
      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
        아이디와 이메일로 인증 후, 바로 새 비밀번호를 설정해요.
      </p>
      <label className="block text-xs text-gray-600 mb-1">아이디</label>
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} />
      <div className="mt-3">
        <label className="block text-xs text-gray-600 mb-1">이메일</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
      </div>
      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <button type="button" onClick={sendCode} disabled={submitting || cooldown > 0}
          className="h-9 sm:h-10 px-3 sm:px-4 rounded-md bg-black text-white text-xs sm:text-sm hover:bg-gray-800 disabled:opacity-60">
          {submitting ? "전송 중..." : cooldown ? `재전송 ${cooldown}s` : "인증코드 보내기"}
        </button>
        {codeSent && <span className="text-xs text-emerald-600">전송됨</span>}
      </div>
      <div className="mt-4">
        <label className="block text-xs text-gray-600 mb-1">인증코드</label>
        <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} />
        <button type="button" onClick={verifyCode} disabled={submitting}
          className="mt-2 h-9 sm:h-10 px-3 sm:px-4 rounded-md border border-gray-300 text-xs sm:text-sm hover:bg-gray-50">
          {submitting ? "확인 중..." : "코드 확인"}
        </button>
        {verified && <span className="ml-2 text-xs text-emerald-600">인증 완료</span>}
      </div>
      <div className="mt-4">
        <label className="block text-xs text-gray-600 mb-1">새 비밀번호</label>
        <input type={showPw ? "text" : "password"} value={pw1} onChange={(e) => setPw1(e.target.value)}
          className={inputCls} disabled={!verified} />
      </div>
      <div className="mt-3">
        <label className="block text-xs text-gray-600 mb-1">새 비밀번호 확인</label>
        <input type={showPw ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)}
          className={inputCls} disabled={!verified} />
      </div>
      {info && <p className="text-xs text-emerald-600 mt-2">{info}</p>}
      {err && <p className="text-xs text-rose-600 mt-2">{err}</p>}
      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={resetPassword} disabled={submitting || !verified}
          className="h-9 sm:h-10 px-3 sm:px-4 rounded-md bg-gray-900 text-white text-xs sm:text-sm hover:bg-gray-800 disabled:opacity-60">
          {submitting ? "변경 중..." : "비밀번호 변경"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ------------------------------
   로그인 페이지
-------------------------------- */
export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [autoLogin, setAutoLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showFindId, setShowFindId] = useState(false);
  const [showFindPw, setShowFindPw] = useState(false);

  const [idEmail, setIdEmail] = useState("");
  const [idCode, setIdCode] = useState("");
  const [idSubmitting, setIdSubmitting] = useState(false);
  const [idInfo, setIdInfo] = useState("");
  const [idErr, setIdErr] = useState("");
  const [idCodeSent, setIdCodeSent] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [revealedUsernames, setRevealedUsernames] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const inputCls =
    "w-full h-10 sm:h-11 border border-gray-300 rounded-md px-3 sm:px-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/30 bg-white placeholder-gray-400";

  useEffect(() => {
    const saved = localStorage.getItem("autoLogin") === "true";
    setAutoLogin(saved);

    const token = localStorage.getItem("token");
    if (saved && token) {
      axios
        .post("/auth/jwt/verify/", { token })
        .then(() => {
          axios.defaults.headers.common.Authorization = `Bearer ${token}`;
          navigate(from, { replace: true });
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
        });
    }
  }, [navigate, from]);

  useEffect(() => {
    const onBeforeUnload = () => {
      const saved = localStorage.getItem("autoLogin") === "true";
      if (!saved) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
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
      axios.defaults.headers.common.Authorization = `Bearer ${data.access}`;
      navigate(from, { replace: true });
    } catch {
      setErrorMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  const sendIdCode = async () => {
    setIdErr("");
    setIdInfo("");
    setRevealedUsernames([]);
    if (!idEmail) {
      setIdErr("이메일을 입력해 주세요.");
      return;
    }
    setIdSubmitting(true);
    try {
      await axios.post("/auth/email/send-code/", { email: idEmail });
      setIdCodeSent(true);
      setIdInfo("인증번호를 전송했습니다. 메일함(스팸함 포함)을 확인해 주세요.");
    } catch {
      setIdErr("인증번호 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIdSubmitting(false);
    }
  };

  const verifyIdCode = async () => {
    setIdErr("");
    setIdInfo("");
    if (!idEmail || !idCode) {
      setIdErr("이메일과 인증번호를 입력해 주세요.");
      return;
    }
    setIdSubmitting(true);
    try {
      await axios.post("/auth/email/verify-code/", { email: idEmail, code: idCode });
      setIdVerified(true);
      setIdInfo("이메일 인증이 완료되었습니다. 아이디 보기를 눌러 주세요.");
    } catch {
      setIdErr("인증번호가 올바르지 않거나 만료되었습니다.");
    } finally {
      setIdSubmitting(false);
    }
  };

  const revealUsernames = async () => {
    setIdErr("");
    setIdInfo("");
    setRevealedUsernames([]);
    if (!idVerified) {
      setIdErr("이메일 인증이 필요합니다.");
      return;
    }
    setIdSubmitting(true);
    try {
      const { data } = await axios.post("/auth/account/reveal-username/", { email: idEmail });
      setRevealedUsernames(Array.isArray(data.usernames) ? data.usernames : []);
      if (!data.usernames || data.usernames.length === 0) {
        setIdInfo("해당 이메일로 가입된 아이디가 없습니다.");
      }
    } catch {
      setIdErr("아이디 조회 중 오류가 발생했습니다.");
    } finally {
      setIdSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white flex flex-col text-gray-900">
      <div className="flex items-start justify-center pt-[calc(var(--header-offset,64px)+4px)] pb-4 -mt-10 sm:-mt-12">
        <div className="w-[520px] max-w-[95%] sm:max-w-[92vw] rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="px-6 sm:px-10 pt-8 sm:pt-10 pb-6 sm:pb-8">
            <div className="w-full flex flex-col items-center mb-6 sm:mb-8">
              <img src={logo} alt="로고" className="h-24 sm:h-40 object-contain" />
            </div>

            <h2 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 text-center">로그인</h2>

            {location.state?.from && (
              <p className="text-xs sm:text-sm text-rose-600 mb-2">로그인 후 이용 가능합니다.</p>
            )}
            {errorMessage && (
              <p className="text-xs sm:text-sm text-rose-600 mb-2 text-center">{errorMessage}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="username"
                placeholder="id"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
                className={inputCls}
              />
              <input
                type="password"
                name="password"
                placeholder="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className={inputCls}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 sm:h-11 bg-black hover:bg-gray-800 disabled:opacity-60 text-white text-sm sm:text-base font-semibold transition-colors rounded-md"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>

              <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm pt-2 gap-2 sm:gap-0">
                <label
                  htmlFor="autoLogin"
                  className="inline-flex items-center gap-2 cursor-pointer select-none text-gray-900 font-bold"
                >
                  <input
                    id="autoLogin"
                    type="checkbox"
                    checked={autoLogin}
                    onChange={(e) => {
                      setAutoLogin(e.target.checked);
                      localStorage.setItem("autoLogin", String(e.target.checked));
                    }}
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

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-400 justify-center">
                  <button
                    type="button"
                    className="hover:text-gray-600"
                    onClick={() => {
                      setIdEmail("");
                      setIdCode("");
                      setIdSubmitting(false);
                      setIdInfo("");
                      setIdErr("");
                      setIdCodeSent(false);
                      setIdVerified(false);
                      setRevealedUsernames([]);
                      setShowFindId(true);
                    }}
                  >
                    아이디 찾기
                  </button>
                  <span>|</span>
                  <button
                    type="button"
                    className="hover:text-gray-600"
                    onClick={() => {
                      setShowFindPw(true);
                    }}
                  >
                    비밀번호 찾기
                  </button>
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

      <footer className="py-6 text-[10px] sm:text-[11px] text-gray-900">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-row flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center">
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
      
      {showFindId && (
        <FindIdModal
          onClose={() => setShowFindId(false)}
          idEmail={idEmail} setIdEmail={setIdEmail}
          idCode={idCode} setIdCode={setIdCode}
          idSubmitting={idSubmitting}
          idInfo={idInfo} idErr={idErr}
          idCodeSent={idCodeSent} idVerified={idVerified}
          sendIdCode={sendIdCode} verifyIdCode={verifyIdCode} revealUsernames={revealUsernames}
          revealedUsernames={revealedUsernames}
          inputCls={inputCls}
        />
      )}
      {showFindPw && <ResetPwByCodeModal onClose={() => setShowFindPw(false)} inputCls={inputCls} />}
    </div>
  );
}
