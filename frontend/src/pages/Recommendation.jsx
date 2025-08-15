import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const DUMMY_RECOMMENDATIONS = [
  { id: 1, name: "국가장학금 1유형", foundation_name: "한국장학재단", recruitment_start: "2025-06-01", recruitment_end: "2025-06-20" },
  { id: 2, name: "미래드림 장학금", foundation_name: "미래재단", recruitment_start: "2025-07-01", recruitment_end: "2025-07-15" },
];

export default function Recommendation() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headerPad, setHeaderPad] = useState(96);
  const navigate = useNavigate();

  // 헤더 높이만큼 패딩
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
        const base =
          import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
          "http://34.228.112.95";

        const res = await fetch(`${base}/api/recommendation/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401)
            throw new Error("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
          throw new Error(data.detail || `API 응답 오류: ${res.status}`);
        }

        const recs = Array.isArray(data?.scholarships) ? data.scholarships : [];
        setRecommendations(recs.length ? recs : DUMMY_RECOMMENDATIONS);
      } catch (err) {
        let msg = "예상치 못한 오류가 발생했습니다.";
        if (String(err.message).includes("Failed to fetch"))
          msg = "네트워크 오류: 서버에 연결할 수 없습니다.";
        else if (String(err.message).includes("로그인 세션이 만료")) {
          msg = err.message;
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

  // ✅ 강제 중앙 정렬 래퍼
  const Wrapper = ({ children }) => (
    <main
      className="min-h-screen bg-gray-100"
      style={{ paddingTop: headerPad }}
    >
      {/* 화면 전체 폭 확보 후, 가로 중앙 정렬 */}
      <div className="w-screen max-w-full px-4 flex justify-center">
        {/* 실제 카드 컨테이너 */}
        <section className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-8"
                 style={{ marginLeft: "auto", marginRight: "auto" }}>
          {children}
        </section>
      </div>
    </main>
  );

  if (loading) {
    return (
      <Wrapper>
        <div className="text-xl font-semibold text-gray-700 text-center">
          추천 장학금을 로딩 중입니다...
        </div>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center">
          <div className="text-xl font-semibold text-red-600 mb-4 text-center">{error}</div>
          {error.includes("로그인") && (
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
            >
              로그인하기
            </button>
          )}
        </div>
      </Wrapper>
    );
  }

  if (!recommendations.length) {
    return (
      <Wrapper>
        <div className="text-xl font-semibold text-yellow-700 text-center">
          현재 추천할 장학금이 없습니다.
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <h1 className="text-4xl font-extrabold mb-8 pb-4 border-b-4 border-blue-600 text-gray-900 text-center">
        추천 장학금
      </h1>

      <div className="space-y-6">
        {recommendations.map((s) => (
          <article
            key={s.product_id}
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition"
          >
            <h3 className="text-2xl font-bold text-blue-700 mb-2">{s.name}</h3>
            <p className="text-gray-700 mb-1">
              <span className="font-semibold">운영기관명:</span> {s.foundation_name}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">모집 기간:</span> {s.recruitment_start} ~ {s.recruitment_end}
            </p>
          </article>
        ))}
      </div>
    </Wrapper>
  );
}
