import { useState } from "react";
import axios from "axios";

export default function ContactSection() {
  const API = import.meta.env.VITE_API_BASE_URL; // 예: https://<서버>/api
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // URL 조인(이중 슬래시 방지)
  const join = (b, p) =>
    `${String(b || "").replace(/\/+$/, "")}/${String(p || "").replace(/^\/+/, "")}`;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    try {
      setLoading(true); 
      setStatus("");

      // ✅ /api/contact/ 붙여주기
      const url = join(API, "/api/contact/");
      console.log("[submit] POST", url);

      await axios.post(url, form, { headers: { "Content-Type": "application/json" } });
      setForm({ name: "", email: "", message: "" });
      setStatus("문의가 접수되었습니다.");
    } catch (err) {
      setStatus("전송에 실패했습니다. 콘솔을 확인하세요.");
      console.error("[submit] error =", err?.response?.status, err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gray-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 문의하기 폼 */}
          <div className="px-4 md:px-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-left">문의하기</h2>

            <form className="space-y-6" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">이름</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:ring-custom focus:border-custom"
                  placeholder="이름을 입력하세요"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">이메일</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:ring-custom focus:border-custom"
                  placeholder="이메일을 입력하세요"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">문의 내용</label>
                <textarea
                  rows="4"
                  name="message"
                  value={form.message}
                  onChange={onChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:ring-custom focus:border-custom"
                  placeholder="문의 내용을 입력하세요"
                  required
                  disabled={loading}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-black px-6 py-3 text-white font-medium hover:bg-gray-800"
                disabled={loading}
              >
                문의하기
              </button>

              {status && (
                <p className="mt-3 text-sm text-gray-600" role="status">
                  {status}
                </p>
              )}
            </form>
          </div>

          {/* 연락처 정보 */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-left">연락처 정보</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <i className="fas fa-map-marker-alt text-custom text-xl mt-1"></i>
                <div className="ml-4 text-left">
                  <h3 className="text-lg font-medium text-gray-900">주소</h3>
                  <p className="mt-2 text-gray-600">경기도 안성시 한경국립대학교 3층 318호</p>
                </div>
              </div>
              <div className="flex items-start">
                <i className="fas fa-phone text-custom text-xl mt-1"></i>
                <div className="ml-4 text-left">
                  <h3 className="text-lg font-medium text-gray-900">전화</h3>
                  <p className="mt-2 text-gray-600">031-1234-5678</p>
                </div>
              </div>
              <div className="flex items-start">
                <i className="fas fa-envelope text-custom text-xl mt-1"></i>
                <div className="ml-4 text-left">
                  <h3 className="text-lg font-medium text-gray-900">이메일</h3>
                  <p className="mt-2 text-gray-600">contact@hknu.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
