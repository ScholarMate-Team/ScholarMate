import { useEffect, useState } from "react";
import "../assets/css/scholarships.css";

// API 베이스 URL (.env 없으면 EC2 IP로 기본 연결)
const API_BASE = (
  import.meta.env.VITE_API_URL || "http://34.228.112.95"
).replace(/\/$/, "");

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        const token = localStorage.getItem("token");
        if (!token) throw new Error("로그인이 필요합니다.");

        const res = await fetch(`${API_BASE}/api/wishlist/`, {
          headers: {
            // SimpleJWT는 Bearer 권장
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) throw new Error("로그인이 필요합니다.");
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`요청 실패 (HTTP ${res.status}) ${text}`);
        }

        const data = await res.json();
        setWishlist(data);
      } catch (e) {
        // 네트워크/CORS 실패 시 fetch 자체가 실패하여 메시지가 애매할 수 있음
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
      const token = localStorage.getItem("token");
      if (!token) throw new Error("로그인이 필요합니다.");

      const res = await fetch(
        `${API_BASE}/api/wishlist/delete/${scholarshipId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error(`삭제 실패 (HTTP ${res.status})`);

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
        <div className="wishlist-table-container">
          <table className="wishlist-table">
            <thead>
              <tr>
                <th>장학 재단명</th>
                <th>장학 사업명</th>
                <th>모집 기간</th>
                <th>상세 정보</th>
              </tr>
            </thead>
            <tbody>
              {wishlist.map((item) => (
                <tr key={item.scholarship.id}>
                  <td>{item.scholarship.foundation_name}</td>
                  <td>{item.scholarship.name}</td>
                  <td>
                    {item.scholarship.recruitment_start} ~{" "}
                    {item.scholarship.recruitment_end}
                  </td>
                  <td>
                    <button
                      onClick={() => openModal(item.scholarship)}
                      className="details-btn"
                    >
                      상세보기
                    </button>
                    <button
                      onClick={() => handleDelete(item.scholarship.id)}
                      className="delete-btn"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && selectedScholarship && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{selectedScholarship.name} 상세 정보</h2>
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
             <button
              type="button"
              className="absolute right-4 top-3 text-xs font-bold rounded !bg-black !text-white px-2 py-1"
              onClick={closeModal}
              aria-label="닫기"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
