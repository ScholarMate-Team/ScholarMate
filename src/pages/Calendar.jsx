import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "../api/axios";
import "../assets/css/CalendarPage.css";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [submittedIds, setSubmittedIds] = useState(() => {
    const saved = localStorage.getItem("submittedScholarships");
    return saved ? JSON.parse(saved) : [];
  });

  const [alertIds, setAlertIds] = useState(() => {
    const saved = localStorage.getItem("alertScholarships");
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
  document.body.classList.add("calendar-page");
  return () => {
    document.body.classList.remove("calendar-page");
  };
}, []);

  useEffect(() => {
    axios.get("/scholarships/calendar/")
      .then((res) => setEvents(res.data))
      .catch((err) => console.error("캘린더 불러오기 실패", err));
  }, []);

  useEffect(() => {
    const today = new Date();
    const d1Alerts = events.filter((e) => {
      const deadline = new Date(e.deadline);
      const diff = Math.floor((deadline - today) / (1000 * 60 * 60 * 24));
      return diff === 1 && alertIds.includes(e.id);
    });

    d1Alerts.forEach((e) => {
      alert(`⏰ [알림] 내일 마감: ${e.title}`);
    });
  }, [events, alertIds]);

  // ✅ 검색 시 자동 날짜 이동
  useEffect(() => {
    if (!searchTerm) return;
    const matched = events.find((e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (matched?.deadline) {
      setCalendarDate(new Date(matched.deadline));
    }
  }, [searchTerm, events]);

  // ✅ 날짜 문자열 생성 (시간대 오류 방지)
  const formatDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const renderTileContent = ({ date }) => {
    const dateStr = formatDate(date);

    const matches = events.filter((e) =>
      e.deadline?.startsWith(dateStr) &&
      e.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return matches.length > 0 ? (
      <div className="calendar-multi-event">
        {matches.map((event, index) => {
          const today = new Date();
          const deadline = new Date(event.deadline);
          const diffDays = Math.floor((deadline - today) / (1000 * 60 * 60 * 24));

          let badge = "";
          if (diffDays === 0) badge = "🔥 D-day";
          else if (diffDays === 1) badge = "⏰ D-1";
          else if (diffDays === 3) badge = "⚠️ D-3";

          const isSubmitted = submittedIds.includes(event.id);

          return (
            <div
              key={index}
              className={`calendar-event ${isSubmitted ? "submitted" : ""}`}
              title={event.title}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(event);
                setIsModalOpen(true);
              }}
            >
              {isSubmitted ? "✅" : "📌"} {event.title.slice(0, 2)} 마감 {badge && <span>({badge})</span>}
            </div>
          );
        })}
      </div>
    ) : null;
  };

  const handleSubmitComplete = () => {
    if (!submittedIds.includes(selectedEvent.id)) {
      const updated = [...submittedIds, selectedEvent.id];
      setSubmittedIds(updated);
      localStorage.setItem("submittedScholarships", JSON.stringify(updated));
    }
  };

  const handleSubmitCancel = () => {
    const updated = submittedIds.filter(id => id !== selectedEvent.id);
    setSubmittedIds(updated);
    localStorage.setItem("submittedScholarships", JSON.stringify(updated));
    alert("❎ 제출 완료가 취소되었습니다.");
  };

  const handleAlertRegister = () => {
    if (!alertIds.includes(selectedEvent.id)) {
      const updated = [...alertIds, selectedEvent.id];
      setAlertIds(updated);
      localStorage.setItem("alertScholarships", JSON.stringify(updated));
      alert("🔔 마감 알림이 등록되었습니다!");
    }
  };

  const handleAlertCancel = () => {
    const updated = alertIds.filter(id => id !== selectedEvent.id);
    setAlertIds(updated);
    localStorage.setItem("alertScholarships", JSON.stringify(updated));
    alert("🔕 알림이 취소되었습니다.");
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1 className="text-3xl font-bold mb-8 pb-4 border-b border-gray-300 text-gray-900">
          📅 나의 장학 캘린더
        </h1>
        <input
          type="text"
          placeholder="장학금 이름 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="calendar-search-input"
        />
      </div>

      <Calendar
        tileContent={renderTileContent}
        key={searchTerm}
        value={calendarDate}
      />

      {isModalOpen && selectedEvent && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🎓 {selectedEvent.title}</h3>
            <p><strong>제출 서류</strong></p>
            <div
              id="doc-content"
              style={{
                background: "#f9f9f9",
                padding: "1rem",
                borderRadius: "8px",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedEvent.required_documents_details?.trim() || "제출 서류 정보가 없습니다."}
            </div>

            <button
              onClick={() => {
                const text = selectedEvent.required_documents_details?.trim();
                if (!text) return alert("복사할 제출 서류가 없습니다.");
                navigator.clipboard.writeText(text);
                alert("✅ 제출 서류가 복사되었습니다!");
              }}
              style={{ marginTop: "10px", marginRight: "10px" }}
            >
              📋 복사하기
            </button>

            {submittedIds.includes(selectedEvent.id) ? (
              <button onClick={handleSubmitCancel} style={{ marginTop: "10px", marginRight: "10px" }}>
                🚫 제출 취소
              </button>
            ) : (
              <button onClick={handleSubmitComplete} style={{ marginTop: "10px", marginRight: "10px" }}>
                ✅ 제출 완료
              </button>
            )}

            {alertIds.includes(selectedEvent.id) ? (
              <button onClick={handleAlertCancel} style={{ marginTop: "10px", marginRight: "10px" }}>
                🔕 알림 취소
              </button>
            ) : (
              <button onClick={handleAlertRegister} style={{ marginTop: "10px", marginRight: "10px" }}>
                🔔 알림 등록
              </button>
            )}

            <button onClick={() => setIsModalOpen(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
