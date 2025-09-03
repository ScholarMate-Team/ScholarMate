import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    code: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  // 타이머
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const mmss = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // 인증번호 전송
  const handleSendCode = async () => {
    const email = form.email.trim();
    if (!email) {
      setErrorMessage("이메일을 입력해 주세요.");
      return;
    }
    setSending(true);
    setErrorMessage("");
    setInfoMessage("");
    try {
      const res = await axios.post("/auth/email/send-code/", { email });
      const ttl = res?.data?.ttl ?? 120;
      setSecondsLeft(ttl);
      setInfoMessage("인증번호를 전송했어요. 제한시간 안에 입력해 주세요.");
    } catch (e) {
      const msg = e?.response?.data?.detail || "인증번호 전송 실패. 다시 시도해 주세요.";
      setErrorMessage(msg);
    } finally {
      setSending(false);
    }
  };

  // 회원가입: 이메일 코드 검증 → 가입
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const username = form.username.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;
    const email = form.email.trim();
    const code = form.code.trim();

    setErrorMessage("");
    setInfoMessage("");

    if (!username || !email || !password || !confirmPassword || !code) {
      setErrorMessage("모든 항목을 입력해 주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setSubmitting(true);
    try {
      // 1) 이메일 인증번호 검증 (엔드포인트 교정!)
      await axios.post("/auth/email/verify-code/", { email, code });

      // 2) 검증 성공 시 회원가입
      await axios.post("/auth/users/", {
        username,
        password,
        email,
      });

      alert("회원가입 성공! 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (error) {
      // verify 단계 에러 우선
      const detail = error?.response?.data?.detail;
      if (detail) {
        setErrorMessage(detail);
      } else if (error?.response?.data?.username) {
        setErrorMessage("이미 가입된 아이디입니다.");
      } else if (error?.response?.data?.password) {
        const msg =
          Array.isArray(error.response.data.password)
            ? error.response.data.password[0]
            : "비밀번호 정책을 확인해 주세요.";
        setErrorMessage(msg);
      } else if (error?.response?.data?.email) {
        const msg =
          typeof error.response.data.email === "string"
            ? error.response.data.email
            : "유효하지 않은 이메일 형식이거나 인증이 필요합니다.";
        setErrorMessage(msg);
      } else {
        setErrorMessage(
          "회원가입 실패: " +
            (error?.response?.status
              ? `${error.response.status} ${JSON.stringify(error.response.data)}`
              : "네트워크 오류")
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSend = !sending && secondsLeft === 0 && !!form.email.trim();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 text-center border-b pb-4">
          회원가입
        </h1>

        {errorMessage && (
          <p className="text-red-500 text-center mb-4 whitespace-pre-wrap">{errorMessage}</p>
        )}
        {infoMessage && (
          <p className="text-teal-600 text-center mb-4">{infoMessage}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 아이디 */}
          <input
            type="text"
            name="username"
            placeholder="아이디"
            onChange={handleChange}
            required
            className="w-full bg-white border border-gray-300 rounded px-3 py-2 
                       text-gray-900 placeholder-gray-400 
                       focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          {/* 비밀번호 */}
          <input
            type="password"
            name="password"
            placeholder="비밀번호 (8자 이상)"
            onChange={handleChange}
            required
            className="w-full bg-white border border-gray-300 rounded px-3 py-2 
                       text-gray-900 placeholder-gray-400 
                       focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          {/* 비밀번호 확인 */}
          <input
            type="password"
            name="confirmPassword"
            placeholder="비밀번호 확인"
            onChange={handleChange}
            required
            className="w-full bg-white border border-gray-300 rounded px-3 py-2 
                       text-gray-900 placeholder-gray-400 
                       focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          {/* 이메일 + 인증번호 버튼 */}
          <div className="flex gap-2">
            <input
              type="email"
              name="email"
              placeholder="이메일 주소"
              onChange={handleChange}
              required
              className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 
                         text-gray-900 placeholder-gray-400 
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={!canSend}
              className={`px-3 py-2 rounded text-white transition ${
                canSend ? "bg-gray-900 hover:bg-blue-500" : "bg-gray-900/60 cursor-not-allowed"
              }`}
            >
              {secondsLeft > 0 ? mmss(secondsLeft) : sending ? "전송 중..." : "인증번호 받기"}
            </button>
          </div>
          {/* 인증번호 입력 */}
          <input
            type="text"
            name="code"
            placeholder="인증번호 입력"
            onChange={handleChange}
            required
            className="w-full bg-white border border-gray-300 rounded px-3 py-2 
                       text-gray-900 placeholder-gray-400 
                       focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          {/* 회원가입 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-900 text-white py-2 rounded font-semibold hover:bg-blue-500 transition disabled:opacity-60"
          >
            {submitting ? "처리 중..." : "회원가입"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          이미 계정이 있으신가요?{" "}
          <button
            onClick={() => navigate("/login")}
            className="bg-transparent p-0 m-0 text-gray-900 font-semibold hover:text-blue-400 hover:underline cursor-pointer"
          >
            로그인
          </button>
        </p>
      </div>
    </div>
  );
}
