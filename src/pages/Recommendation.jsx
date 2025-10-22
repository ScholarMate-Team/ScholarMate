import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";   // ✅ axios 인스턴스 사용

const DUMMY_RECOMMENDATIONS = [
  {
    id: 1,
    product_id: 1,
    name: "국가장학금 1유형",
    foundation_name: "한국장학재단",
    recruitment_start: "2025-06-01",
    recruitment_end: "2025-06-20",
    url: "https://www.kosaf.go.kr/",
  },
  {
    id: 2,
    product_id: 2,
    name: "미래드림 장학금",
    foundation_name: "미래재단",
    recruitment_start: "2025-07-01",
    recruitment_end: "2025-07-15",
    url: "https://example.org/",
  },
];

export default function Recommendation() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headerPad, setHeaderPad] = useState(96);

  const [favorites, setFavorites] = useState(new Set());

  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  // ===== URL 정규화 =====
  const resolveUrl = (u) => {
    if (!u) return null;
    const v = String(u).trim();
    const invalid = new Set(["", "#", "-", "null", "none", "n/a", "N/A", "해당없음", "없음", "미정", "준비중"]);
    if (invalid.has(v) || invalid.has(v.toLowerCase())) return null;
    const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, "")}`;
    try {
      const url = new URL(withScheme);
      if (!url.hostname || !url.hostname.includes(".")) return null;
      return url.toString();
    } catch {
      return null;
    }
  };
  const urlFor = (obj) => resolveUrl(obj?.url || obj?.homepage_url || obj?.link);

  // 헤더 높이 반영
  useLayoutEffect(() => {
    const updatePad = () => {
      const header =
        document.querySelector("header") ||
        document.querySelector("nav") ||
        document.querySelector(".site-header");
      const h = (header?.offsetHeight || 72) + 16;
      setHeaderPad(h);
    };
    updatePad();
    window.addEventListener("resize", updatePad);
    return () => window.removeEventListener("resize", updatePad);
  }, []);

  // ===== 토스트 =====
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const toastTimerRef = useRef(null);

  const showToast = (message, type = "success", duration = 2000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ open: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, open: false }));
      toastTimerRef.current = null;
    }, duration);
  };
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  // ===== 추천 로드 =====
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("로그인이 필요합니다. 다시 로그인해주세요.");
          setLoading(false);
          return;
        }

        const { data } = await api.get("/scholarships/recommendation/", {
          headers: { Authorization: `JWT ${token}` },
        });

        const recs = Array.isArray(data?.scholarships) ? data.scholarships : [];
        setRecommendations(recs.length ? recs : DUMMY_RECOMMENDATIONS);
      } catch (err) {
        let msg = "예상치 못한 오류가 발생했습니다.";
        if (String(err.message).includes("Network"))
          msg = "네트워크 오류: 서버에 연결할 수 없습니다.";
        else if (String(err.message).includes("401")) {
          msg = "로그인 세션이 만료되었습니다. 다시 로그인해주세요.";
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          navigate("/login");
        } else msg = `오류 발생: ${err.message}`;
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [navigate]);

  // ===== 찜 목록 로드 =====
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const { data } = await api.get("/scholarships/wishlist/", {
          headers: { Authorization: `JWT ${token}` },
        });
        const ids = (data || []).map((w) => w.scholarship.product_id);
        setFavorites(new Set(ids));
      } catch {}
    };
    loadFavorites();
  }, []);

  // 상세 모달
  const openModal = (item) => { setSelected(item); setIsModalOpen(true); };
  const closeModal = () => { setSelected(null); setIsModalOpen(false); };

  // ===== 찜 토글 =====
  const toggleFavorite = async (item) => {
    const id = item.product_id ?? item.id;
    const isFavorited = favorites.has(id);
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("로그인이 필요합니다.", "error");
      return;
    }

    const url = isFavorited
      ? "/scholarships/wishlist/toggle/"
      : "/scholarships/wishlist/add-from-api/";

    try {
      const { status } = await api.post(url,
        isFavorited ? { product_id: id, action: "remove" } : item,
        { headers: { Authorization: `JWT ${token}` } }
      );

      if (status !== 200 && status !== 201) throw new Error("서버 오류");

      setFavorites((prev) => {
        const updated = new Set(prev);
        if (isFavorited) {
          updated.delete(id);
          showToast("관심 장학금에서 삭제되었습니다.", "info");
        } else {
          updated.add(id);
          showToast("관심 장학금에 추가되었습니다.", "success");
        }
        return updated;
      });
    } catch (e) {
      showToast(e.message || "찜 처리 중 오류가 발생했습니다.", "error", 2500);
    }
  };

  // ✅ 레이아웃 래퍼
  const Wrapper = ({ children }) => (
    <main className="min-h-screen bg-gray-100" style={{ paddingTop: "20px" }}>
      <div className="w-screen max-w-full px-2 sm:px-4 flex justify-center">
        <section className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-4 sm:p-8">
          {children}
        </section>
      </div>

      {/* 토스트 */}
      <div aria-live="polite" aria-atomic="true" className="fixed bottom-6 right-6 z-[60]">
        {toast.open && (
          <div
            className={[
              "min-w-[220px] max-w-[340px] px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-lg border text-sm",
              "animate-[fadeIn_.15s_ease-out]",
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-sky-50 border-sky-200 text-sky-900",
            ].join(" ")}
            role="status"
          >
            {toast.message}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );

  if (loading) {
    return (
      <Wrapper>
        <div className="text-lg sm:text-xl font-semibold text-gray-700 text-center">
          추천 장학금을 로딩 중입니다...
        </div>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center">
          <div className="text-lg sm:text-xl font-semibold text-red-600 mb-4 text-center">
            {error}
          </div>
          {error.includes("로그인") && (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
            >
              로그인하기
            </button>
          )}
          {error.includes("나의 장학 정보") && (
            <button
              onClick={() => navigate("/userinfor")}
              className="mt-3 px-4 py-2 sm:px-6 sm:py-3 bg-gray-900 text-white rounded-md shadow hover:bg-blue-500 transition"
            >
              나의 장학 정보 입력하러 가기
            </button>
          )}
        </div>
      </Wrapper>
    );
  }

  if (!recommendations.length) {
    return (
      <Wrapper>
        <div className="text-lg sm:text-xl font-semibold text-yellow-700 text-center">
          현재 추천할 장학금이 없습니다.
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <h1 className="text-2xl sm:text-4xl font-extrabold mb-6 sm:mb-8 pb-3 sm:pb-4 border-b-4 border-blue-600 text-gray-900 text-center">
        추천 장학금
      </h1>

      <div className="space-y-4 sm:space-y-6">
        {recommendations.map((s) => {
          const id = s.product_id ?? s.id;
          const isFav = favorites.has(id);
          const homepage = urlFor(s);
          return (
            <article
              key={id}
              className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-blue-700 mb-1 sm:mb-2">
                    {s.name}
                  </h3>
                  <p className="text-gray-700 text-sm sm:text-base">
                    <span className="font-semibold">운영기관명:</span> {s.foundation_name}
                  </p>
                  <p className="text-gray-700 text-sm sm:text-base">
                    <span className="font-semibold">모집 기간:</span>{" "}
                    {s.recruitment_start} ~ {s.recruitment_end}
                  </p>
                </div>

                {/* 버튼 그룹 */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => openModal(s)}
                    className="w-full sm:w-auto px-3 py-2 text-sm bg-gray-100 rounded-md border hover:bg-gray-200 text-center"
                  >
                    상세보기
                  </button>

                  {homepage ? (
                    <a
                      href={homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-3 py-2 text-sm bg-sky-500 text-white rounded-md hover:bg-sky-600 text-center"
                    >
                      홈페이지
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full sm:w-auto px-3 py-2 text-sm bg-gray-300 text-white rounded-md cursor-not-allowed text-center"
                    >
                      홈페이지 없음
                    </button>
                  )}

                  <button
                    onClick={() => toggleFavorite(s)}
                    className={`w-full sm:w-auto px-3 py-2 text-lg rounded-md border ${
                      isFav ? "bg-pink-100" : "bg-white"
                    }`}
                    title={isFav ? "관심 해제" : "관심 등록"}
                  >
                    {isFav ? "❤️" : "🤍"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* 상세 모달 */}
      {isModalOpen && selected && (
        <div
          className="fixed inset-0 bg-black/40 z-50 overflow-y-auto"
          style={{ paddingTop: headerPad + 24, paddingBottom: 24 }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-4 top-3 text-xs text-white font-bold"
              onClick={closeModal}
              aria-label="닫기"
            >
              닫기
            </button>

            <h2 className="text-xl sm:text-2xl font-bold mb-4">{selected.name} 상세 정보</h2>

            <div className="space-y-2 text-gray-800 max-h-[calc(100vh-200px)] overflow-y-auto text-sm sm:text-base">
              <p><strong>운영기관명:</strong> {selected.foundation_name}</p>
              <p><strong>모집 기간:</strong> {selected.recruitment_start} ~ {selected.recruitment_end}</p>
              <p><strong>성적기준:</strong> {selected.grade_criteria_details || "-"}</p>
              <p><strong>소득기준:</strong> {selected.income_criteria_details || "-"}</p>
              <p><strong>지원내역:</strong> {selected.support_details || "-"}</p>
              <p><strong>특정자격:</strong> {selected.specific_qualification_details || "-"}</p>
              <p><strong>지역거주여부:</strong> {selected.residency_requirement_details || "-"}</p>
              <p><strong>선발방법:</strong> {selected.selection_method_details || "-"}</p>
              <p><strong>선발인원:</strong> {selected.number_of_recipients_details || "-"}</p>
              <p><strong>자격제한:</strong> {selected.eligibility_restrictions || "-"}</p>
              <p><strong>제출서류:</strong> {selected.required_documents_details || "-"}</p>
              <p>
                <strong>홈페이지:</strong>{" "}
                {urlFor(selected) ? (
                  <a
                    href={urlFor(selected)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-blue-600 underline"
                  >
                    이동하기
                  </a>
                ) : (
                  <span className="text-gray-500">주소 없음</span>
                )}
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
              {urlFor(selected) ? (
                <a
                  href={urlFor(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 text-center"
                >
                  홈페이지 보기
                </a>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 bg-gray-300 text-white rounded-md cursor-not-allowed"
                >
                  홈페이지 없음
                </button>
              )}

              <button
                onClick={() => toggleFavorite(selected)}
                className="px-4 py-2 bg-gray-100 rounded-md border hover:bg-gray-200 text-center"
              >
                {favorites.has(selected.product_id ?? selected.id) ? "관심 해제" : "관심 등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  );
}
