import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { message as antdMessage } from "antd";
import api from "../api/axios";

function EnvelopeIcon({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function HeaderMessagesIcon({ intervalMs = 60000 }) {
  const [count, setCount] = useState(0);
  const [preview, setPreview] = useState([]);
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState({ id: null, username: null });
  const timerRef = useRef(null);
  const wrapRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");

  // 현재 로그인 사용자 정보
  useEffect(() => {
    if (!isLoggedIn) {
      setMe({ id: null, username: null });
      return;
    }
    (async () => {
      try {
        const { data } = await api.get("/auth/users/me/");
        setMe({ id: data?.id ?? null, username: data?.username ?? null });
      } catch {
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setMe({
              id: payload?.user_id ?? null,
              username: payload?.username ?? null,
            });
          }
        } catch {
          /* ignore */
        }
      }
    })();
  }, [isLoggedIn]);

  async function sync() {
    if (!isLoggedIn) {
      setCount(0);
      setPreview([]);
      setOpen(false);
      return;
    }
    try {
      const { data } = await api.get("/community/conversations/", {
        params: { page_size: 10, ordering: "-updated_at" },
      });
      const list = Array.isArray(data) ? data : data?.results ?? [];
      const unread = list.reduce(
        (sum, c) => sum + (c.unread_count ?? c.unread ?? 0),
        0
      );
      setCount(unread);

      setPreview(
        list.slice(0, 5).map((c) => {
          let names = Array.isArray(c.other_usernames)
            ? c.other_usernames
            : null;

          if (!names) {
            const participants = Array.isArray(c.participants)
              ? c.participants
              : [];
            names = participants
              .filter((p) => {
                if (me.id != null && p?.id != null) return p.id !== me.id;
                if (me.username && p?.username) return p.username !== me.username;
                return true;
              })
              .map((p) => p.username)
              .filter(Boolean);
          }

          return {
            id: c.id,
            other: (names || []).join(", "),
            last: c.last_message?.content ?? c.last_message?.body ?? "",
            at: c.updated_at,
          };
        })
      );
    } catch {
      /* 조용히 무시 */
    }
  }

  // 최초 + 주기적 동기화
  useEffect(() => {
    sync();
    timerRef.current = setInterval(sync, intervalMs);
    const onFocus = () => sync();
    const onVisible = () =>
      document.visibilityState === "visible" && sync();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs, isLoggedIn]);

  useEffect(() => {
    if (me.id != null || me.username) sync();
  }, [me.id, me.username]);

  useEffect(() => {
    if (pathname.startsWith("/messages")) sync();
  }, [pathname]);

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleToggle = () => {
    if (!isLoggedIn) {
      antdMessage.info("쪽지함은 로그인 후 이용 가능합니다.");
      return;
    }
    setOpen((v) => !v);
  };

  const badgeText = count > 99 ? "99+" : count;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`쪽지함${isLoggedIn ? `(미읽음 ${count}개)` : ""}`}
      >
        <EnvelopeIcon />
        {isLoggedIn && count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 text-[11px] leading-5 text-white bg-red-600 rounded-full text-center">
            {badgeText}
          </span>
        )}
      </button>

      {open && isLoggedIn && (
        <>
          {/* 🔹 모바일: 전체 화면 오버레이 */}
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div
            className={`
              sm:absolute sm:top-full sm:right-0 sm:mt-2 sm:w-80 sm:bg-white sm:border sm:rounded-xl sm:shadow-xl sm:overflow-hidden sm:z-50
              fixed inset-x-4 top-24 bottom-24 z-50 bg-white rounded-xl shadow-xl overflow-hidden
              sm:inset-auto
            `}
          >
            <div className="px-4 py-2 flex items-center justify-between bg-gray-50">
              <span className="text-sm font-medium">최근 쪽지</span>
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-white hover:text-gray-200 bg-black px-2 py-1 rounded"
              >
                닫기
              </button>
            </div>

            <ul className="max-h-full overflow-y-auto divide-y">
              {preview.length === 0 && (
                <li className="px-4 py-6 text-sm text-gray-500">
                  최근 쪽지가 없습니다.
                </li>
              )}
              {preview.map((c) => (
                <li
                  key={c.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setOpen(false);
                    navigate(`/messages/${c.id}`);
                  }}
                >
                  <div className="text-sm font-medium truncate">
                    {c.other || "알 수 없음"}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{c.last}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {c.at ? new Date(c.at).toLocaleString() : ""}
                  </div>
                </li>
              ))}
            </ul>

            <div className="px-4 py-2 bg-gray-50 text-right">
              <Link
                to="/messages"
                onClick={() => setOpen(false)}
                className="text-sm text-blue-600 hover:underline"
              >
                모두 보기
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
