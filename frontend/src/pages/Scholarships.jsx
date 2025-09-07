import { useEffect, useRef, useState } from "react";
import "../assets/css/scholarships.css";

export default function Scholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10); // ✅ 선택 가능
  const [totalCount, setTotalCount] = useState(0);

  // 실제 검색에 사용하는 값
  const [searchQuery, setSearchQuery] = useState("");
  // 입력 중인 값 (엔터/버튼 때만 searchQuery로 반영)
  const [searchInput, setSearchInput] = useState("");

  const [selectedType, setSelectedType] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [favorites, setFavorites] = useState(new Set());

  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ====== Toast ======
  const [toast, setToast] = useState({ open: false, message: "", type: "success" }); // 'success' | 'error' | 'info'
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

  const scholarshipTypeMapping = {
    regional: "지역연고",
    academic: "성적우수",
    income_based: "소득구분",
    special_talent: "특기자",
    other: "기타",
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ------- URL 정규화/가드 -------
  const normalizeUrl = (u) => {
    if (!u || typeof u !== "string") return null;
    const v = u.trim();
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

  const buildApiUrl = () => {
    const typeParam = scholarshipTypeMapping[selectedType] || "";
    return `${API_BASE_URL}/api/scholarships/?page=${page}&perPage=${perPage}&search=${encodeURIComponent(
      searchQuery
    )}&type=${encodeURIComponent(typeParam)}&sort=${encodeURIComponent(sortOrder)}`;
  };

  const fetchScholarships = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl());
      const result = await response.json();
      if (result) {
        const dataWithIds = (result.data || []).map((item) => ({
          ...item,
          id: item.product_id, // 고유키
        }));
        setScholarships(dataWithIds);
        setTotalCount(result.total || 0);
      } else {
        setScholarships([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError("데이터를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/wishlist/`, {
        headers: { Authorization: `JWT ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const ids = (data || []).map((item) => item.scholarship.product_id);
        setFavorites(new Set(ids));
      }
    } catch {
      // 조용히 무시
    }
  };

  useEffect(() => {
    document.body.classList.add("scholarships-page");
    return () => document.body.classList.remove("scholarships-page");
  }, []);

  // 🔎 실제 검색/필터/정렬/페이지 크기 변경에만 API 호출
  useEffect(() => {
    fetchScholarships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, selectedType, sortOrder, searchQuery]);

  useEffect(() => {
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = (scholarship) => {
    setSelectedScholarship(scholarship);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setSelectedScholarship(null);
    setIsModalOpen(false);
  };

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
    setPage(1);
  };
  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
    setPage(1);
  };

  // ✅ 엔터/버튼으로만 검색 실행
  const doSearch = () => {
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  // 검색 초기화
  const clearSearch = () => {
  setSearchInput("");
  setSearchQuery(""); 
  setPage(1);
};

  const handleFavoriteToggle = async (item) => {
    const id = item.product_id;
    const isFavorited = favorites.has(id);
    const token = localStorage.getItem("token");

    if (!token) {
      showToast("로그인이 필요합니다.", "error", 2200);
      return;
    }

    const url = isFavorited
      ? `${API_BASE_URL}/api/wishlist/toggle/`
      : `${API_BASE_URL}/api/wishlist/add-from-api/`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(isFavorited ? { product_id: id, action: "remove" } : item),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "서버 오류");

      setFavorites((prev) => {
        const updated = new Set(prev);
        if (isFavorited) {
          updated.delete(id);
          showToast("관심 장학금에서 해제되었습니다.", "info");
        } else {
          updated.add(id);
          showToast("관심 장학금에 추가되었습니다.", "success");
        }
        return updated;
      });
    } catch (err) {
      showToast(err.message || "찜 처리 중 오류 발생", "error", 2500);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  // ✅ 페이지 번호 생성 (ellipsis 포함)
  const getPageList = (cur, total) => {
    const maxLen = 7;
    if (total <= maxLen) return Array.from({ length: total }, (_, i) => i + 1);

    const show = new Set([1, 2, total - 1, total, cur, cur - 1, cur + 1]);
    const list = [];
    let prev = 0;
    for (let i = 1; i <= total; i++) {
      if (show.has(i) || (i >= cur - 2 && i <= cur + 2)) {
        if (prev && i - prev > 1) list.push("...");
        list.push(i);
        prev = i;
      }
    }
    return list;
  };

  const startIdx = totalCount === 0 ? 0 : (page - 1) * perPage + 1;
  const endIdx = Math.min(page * perPage, totalCount);

  return (
    <div className="scholarships-container">
      <div className="scholarships-wrapper">
        <h1 className="text-3xl font-bold mb-8 pb-4 border-b border-gray-300 text-gray-900">
          장학금 목록
        </h1>

        <div className="search-and-filter">
          {/* 검색 입력 */}
          <input
            type="text"
            placeholder="장학 사업명 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
            className="search-input"
          />

          {/* 검색/검색어 삭제 버튼 */}
          <button onClick={doSearch} className="search-btn text-white">검색</button>
          <button onClick={clearSearch} className="search-clear-btn bg-white text-black border border-gray-300 rounded px-3" title="검색어만 지우기">
            검색어 지우기
          </button>

          <select value={selectedType} onChange={handleTypeChange} className="filter-dropdown">
            <option value="">모든 유형</option>
            <option value="regional">지역 연고</option>
            <option value="academic">성적 우수</option>
            <option value="income_based">소득 구분</option>
            <option value="special_talent">특기자</option>
            <option value="other">기타</option>
          </select>

          <select value={sortOrder} onChange={handleSortChange} className="sort-dropdown">
            <option value="">정렬 없음</option>
            <option value="end_date">모집 종료일 순</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : scholarships.length === 0 ? (
          <div className="no-results">검색 결과가 없습니다.</div>
        ) : (
          <>
            <table className="scholarships-table">
              <thead>
                <tr>
                  <th>장학 재단명</th>
                  <th>장학 사업명</th>
                  <th>기간</th>
                  <th>상세정보</th>
                  <th>홈페이지</th>
                  <th>찜</th>
                </tr>
              </thead>
              <tbody>
                {scholarships.map((item) => {
                  const href = normalizeUrl(item.url);
                  return (
                    <tr key={item.product_id}>
                      <td>{item.foundation_name}</td>
                      <td>{item.name}</td>
                      <td>{item.recruitment_start} ~ {item.recruitment_end}</td>
                      <td>
                        <button onClick={() => openModal(item)} className="details-btn">
                          상세정보 보기
                        </button>
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
                          onClick={() => handleFavoriteToggle(item)}
                          className={`favorite-btn ${favorites.has(item.product_id) ? "favorited" : ""}`}
                          title={favorites.has(item.product_id) ? "관심 장학금에서 제거" : "관심 장학금에 추가"}
                        >
                          {favorites.has(item.product_id) ? "❤️" : "🤍"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ✅ 새 페이지네이션 */}
            <div className="pagination flex items-center justify-center gap-2 mt-4">
              <span className="range-text">
                {startIdx}-{endIdx} / 총 {totalCount}건
              </span>

              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="icon-btn"
                aria-label="첫 페이지"
              >
                ⏮
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="icon-btn"
                aria-label="이전 페이지"
              >
                ‹
              </button>

              {getPageList(page, totalPages).map((p, idx) =>
                p === "..." ? (
                  <span key={`el-${idx}`} className="ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`page-btn ${p === page ? "is-current" : ""}`}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="icon-btn"
                aria-label="다음 페이지"
              >
                ›
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="icon-btn"
                aria-label="마지막 페이지"
              >
                ⏭
              </button>

              {/* 페이지 크기 선택 */}
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="perpage-select"
                aria-label="페이지 당 항목 수"
              >
                <option value={10}>10개씩</option>
                <option value={20}>20개씩</option>
                <option value={50}>50개씩</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* ====== 상세 모달 ====== */}
      {isModalOpen && selectedScholarship && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={closeModal}
              aria-label="닫기"
              title="닫기"
            >
              ✕
            </button>
            <h2>{selectedScholarship.name} 상세 정보</h2>
            <div className="modal-body">
              <p><strong>성적기준:</strong> {selectedScholarship.grade_criteria_details}</p>
              <p><strong>소득기준:</strong> {selectedScholarship.income_criteria_details}</p>
              <p><strong>지원내역:</strong> {selectedScholarship.support_details}</p>
              <p><strong>특정자격:</strong> {selectedScholarship.specific_qualification_details}</p>
              <p><strong>지역거주여부:</strong> {selectedScholarship.residency_requirement_details}</p>
              <p><strong>선발방법:</strong> {selectedScholarship.selection_method_details}</p>
              <p><strong>선발인원:</strong> {selectedScholarship.number_of_recipients_details}</p>
              <p><strong>자격제한:</strong> {selectedScholarship.eligibility_restrictions}</p>
              <p><strong>추천필요여부:</strong> {selectedScholarship.recommendation_required ? "필요" : "불필요"}</p>
              <p><strong>제출서류:</strong> {selectedScholarship.required_documents_details}</p>
              <p>
                <strong>홈페이지:</strong>{" "}
                {normalizeUrl(selectedScholarship.url) ? (
                  <a href={normalizeUrl(selectedScholarship.url)} target="_blank" rel="noopener noreferrer">
                    홈페이지 이동
                  </a>
                ) : (
                  <span>주소 없음</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====== 토스트 UI ====== */}
      <div aria-live="polite" aria-atomic="true" className="toast-root">
        {toast.open && (
          <div
            className={[
              "toast-card",
              toast.type === "success" ? "toast-success" :
              toast.type === "error" ? "toast-error" : "toast-info",
            ].join(" ")}
            role="status"
          >
            {toast.message}
          </div>
        )}
      </div>

      {/* 간단 키프레임 (CSS 파일 없이도 동작) */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
