import { useState } from "react";
import api from "../api/axios";   // ✅ 공용 axios 인스턴스 사용

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [accordionOpen, setAccordionOpen] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ type: "error", msg: "모든 항목을 입력해주세요." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setStatus({ type: "error", msg: "이메일 형식을 확인해주세요." });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: "", msg: "" });

      // ✅ axios.js baseURL=/api → /api/contact/ 자동 처리
      await api.post("/contact/", form);

      setForm({ name: "", email: "", message: "" });
      setStatus({ type: "ok", msg: "문의가 접수되었습니다." });
    } catch (err) {
      console.error(
        "[Contact submit error]",
        err?.response?.status,
        err?.response?.data || err.message
      );
      setStatus({
        type: "error",
        msg: "전송에 실패했습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-20 bg-gray-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 문의하기 폼 */}
          <div className="px-2 sm:px-8 md:px-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-left">
              문의하기
            </h2>

            <form className="space-y-5 sm:space-y-6" onSubmit={onSubmit} noValidate>
              <div>
                <label
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 text-left"
                  htmlFor="contact-name"
                >
                  이름
                </label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md bg-white text-sm sm:text-base text-black focus:ring-custom focus:border-custom"
                  placeholder="이름을 입력하세요"
                  required
                  autoComplete="name"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 text-left"
                  htmlFor="contact-email"
                >
                  이메일
                </label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md bg-white text-sm sm:text-base text-black focus:ring-custom focus:border-custom"
                  placeholder="이메일을 입력하세요"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 text-left"
                  htmlFor="contact-message"
                >
                  문의 내용
                </label>
                <textarea
                  id="contact-message"
                  rows="4"
                  name="message"
                  value={form.message}
                  onChange={onChange}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md bg-white text-sm sm:text-base text-black focus:ring-custom focus:border-custom"
                  placeholder="문의 내용을 입력하세요"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-black px-5 sm:px-6 py-2.5 sm:py-3 text-white text-sm sm:text-base font-medium hover:bg-gray-800 disabled:opacity-60"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? "전송 중..." : "문의하기"}
              </button>

              {!!status.msg && (
                <p
                  className={`mt-2 text-xs sm:text-sm ${
                    status.type === "ok" ? "text-green-600" : "text-red-600"
                  }`}
                  role="status"
                >
                  {status.msg}
                </p>
              )}
            </form>
          </div>

          {/* 연락처 정보 */}
          <div className="px-2 sm:px-8 md:px-12">
            {/* 데스크탑 */}
            <div className="hidden md:block">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-left">
                연락처 정보
              </h2>
              <div className="space-y-5 sm:space-y-6">
                <div className="flex items-start">
                  <i className="fas fa-map-marker-alt text-custom text-base sm:text-xl mt-1"></i>
                  <div className="ml-3 sm:ml-4 text-left">
                    <h3 className="text-sm sm:text-lg font-medium text-gray-900">주소</h3>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-base text-gray-600">
                      경기도 안성시 한경국립대학교 3층 318호
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-phone text-custom text-base sm:text-xl mt-1"></i>
                  <div className="ml-3 sm:ml-4 text-left">
                    <h3 className="text-sm sm:text-lg font-medium text-gray-900">전화</h3>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-base text-gray-600">
                      031-1234-5678
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-envelope text-custom text-base sm:text-xl mt-1"></i>
                  <div className="ml-3 sm:ml-4 text-left">
                    <h3 className="text-sm sm:text-lg font-medium text-gray-900">이메일</h3>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-base text-gray-600">
                      contact@hknu.com
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 모바일: 아코디언 */}
            <div className="md:hidden">
              <button
                className="w-full flex justify-between items-center px-4 py-3 bg-white border border-gray-300 rounded-md text-left"
                onClick={() => setAccordionOpen(!accordionOpen)}
              >
                <span className="font-medium text-gray-900">연락처 정보</span>
                <span className="text-lg font-bold">{accordionOpen ? "-" : "+"}</span>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  accordionOpen ? "max-h-96 mt-4" : "max-h-0"
                }`}
              >
                <div className="space-y-4 px-4">
                  <div className="flex items-start">
                    <i className="fas fa-map-marker-alt text-custom text-base mt-1"></i>
                    <div className="ml-3 text-left">
                      <h3 className="text-sm font-medium text-gray-900">주소</h3>
                      <p className="mt-1 text-xs text-gray-600">
                        경기도 안성시 한경국립대학교 3층 318호
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="fas fa-phone text-custom text-base mt-1"></i>
                    <div className="ml-3 text-left">
                      <h3 className="text-sm font-medium text-gray-900">전화</h3>
                      <p className="mt-1 text-xs text-gray-600">031-1234-5678</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="fas fa-envelope text-custom text-base mt-1"></i>
                    <div className="ml-3 text-left">
                      <h3 className="text-sm font-medium text-gray-900">이메일</h3>
                      <p className="mt-1 text-xs text-gray-600">contact@hknu.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
