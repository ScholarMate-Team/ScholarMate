import { useEffect, useState } from "react";
import api from "../api/axios";  // ✅ 공용 axios 인스턴스
import "../assets/css/scholarships.css";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ------- URL 정규화/가드 -------
  const normalizeUrl = (u) => {
    if (!u || typeof u !== "string") return null;
    const v = u.trim();
    const invalid = new Set([
      "", "#", "-", "null", "none", "n/a", "N/A",
      "해당없음", "없음", "미정", "준비중",
    ]);
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
  const urlFor = (s) => normalizeUrl(s?.url || s?.homepage_url || s?.link);
  // --------------------------------

  // body 중앙정렬 클래스
  useEffect(() => {
    document.body.classList.add("wishlist-page");
    return () => {
      document.body.classList.remove("wishlist-page");
    };
  }, []);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const { data } = await api.get("/scholarships/wishlist/");
        setWishlist(data);
      } catch (e) {
        setError(e?.message || "요청 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleDelete = async (scholarshipId) => {
    if (!window.confirm("정말로 관심 장학금에서 삭제하시겠습니까?")) return;

    try {
      await api.delete(`/scholarships/wishlist/delete/${scholarshipId}/`);
      setWishlist((prev) =>
        prev.filter((item) => item.scholarship.id !== scholarshipId)
      );
    } catch (e) {
      alert(e?.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  const openModal = (scholarship) => {
    setSelectedScholarship(scholarship);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedScholarship(null);
    setIsModalOpen(false);
  };

  return (
    <div className="wishlist-wrapper">
      <h1 className="text-3xl font-bold mb-8 pb-4 border-b border-gray-300 text-gray-900">
        관심 장학금 목록
      </h1>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : wishlist.length === 0 ? (
        <div className="no-results">관심 장학금이 없습니다.</div>
      ) : (
        <>
          {/* ✅ 데스크탑/태블릿: 테이블 */}
          <div className="hidden md:block wishlist-table-container">
            <table className="wishlist-table">
              <thead>
                <tr>
                  <th>장학 재단명</th>
                  <th>장학 사업명</th>
                  <th>모집 기간</th>
                  <th>홈페이지</th>
                  <th>상세/삭제</th>
                </tr>
              </thead>
              <tbody>
                {wishlist.map((item) => {
                  const s = item.scholarship;
                  const href = urlFor(s);
                  return (
                    <tr key={s.id}>
                      <td>{s.foundation_name}</td>
                      <td>{s.name}</td>
                      <td>
                        {s.recruitment_start} ~ {s.recruitment_end}
                      </td>
                      <td>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="details-btn inline-flex items-center justify-center"
                            title="홈페이지 열기"
                          >
                            홈페이지 보기
                          </a>
                        ) : (
                          <span className="text-gray-400">홈페이지 없음</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => openModal(s)}
                          className="details-btn"
                        >
                          상세보기
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="delete-btn"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ✅ 모바일: 카드형 */}
          <div className="md:hidden space-y-4">
            {wishlist.map((item) => {
              const s = item.scholarship;
              const href = urlFor(s);
              return (
                <div
                  key={s.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {s.foundation_name}
                  </div>
                  <div className="text-sm font-semibold text-blue-700 mb-1">
                    {s.name}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {s.recruitment_start} ~ {s.recruitment_end}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        홈페이지
                      </a>
                    ) : (
                      <span className="text-gray-400">없음</span>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(s)}
                        className="px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-xs"
                      >
                        상세
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 상세 모달 */}
      {isModalOpen && selectedScholarship && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="absolute right-4 top-3 text-xs font-bold rounded !bg-black !text-white px-2 py-1"
              onClick={closeModal}
              aria-label="닫기"
            >
              닫기
            </button>

            <h2>{selectedScholarship.name} 상세 정보</h2>
            <div className="modal-body">
              <p>
                <strong>성적 기준:</strong>{" "}
                {selectedScholarship.grade_criteria_details}
              </p>
              <p>
                <strong>소득 기준:</strong>{" "}
                {selectedScholarship.income_criteria_details}
              </p>
              <p>
                <strong>지원 내용:</strong>{" "}
                {selectedScholarship.support_details}
              </p>
              <p>
                <strong>특정 자격:</strong>{" "}
                {selectedScholarship.specific_qualification_details}
              </p>
              <p>
                <strong>지역 조건:</strong>{" "}
                {selectedScholarship.residency_requirement_details}
              </p>
              <p>
                <strong>선발 방법:</strong>{" "}
                {selectedScholarship.selection_method_details}
              </p>
              <p>
                <strong>선발 인원:</strong>{" "}
                {selectedScholarship.number_of_recipients_details}
              </p>
              <p>
                <strong>자격 제한:</strong>{" "}
                {selectedScholarship.eligibility_restrictions}
              </p>
              <p>
                <strong>추천 필요 여부:</strong>{" "}
                {selectedScholarship.recommendation_required ? "필요" : "불필요"}
              </p>
              <p>
                <strong>제출 서류:</strong>{" "}
                {selectedScholarship.required_documents_details}
              </p>
              <p>
                <strong>홈페이지:</strong>{" "}
                {urlFor(selectedScholarship) ? (
                  <a
                    href={urlFor(selectedScholarship)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    이동하기
                  </a>
                ) : (
                  <span className="text-gray-500">주소 없음</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
