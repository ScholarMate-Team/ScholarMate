import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Spin, Empty } from "antd";
import { fetchNotice } from "../api/notices";

export default function NoticeDetail() {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchNotice(id); // 백엔드에서 조회수 +1 처리
        if (alive) setNotice(data);
      } catch (e) {
        console.error(e);
        if (alive) setNotice(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <main className="pt-28 pb-20 w-[min(92vw,900px)] mx-auto">
        <div className="py-12 flex justify-center"><Spin /></div>
      </main>
    );
  }

  if (!notice) {
    return (
      <main className="pt-28 pb-20 w-[min(92vw,900px)] mx-auto">
        <div className="py-12"><Empty description="해당 공지가 없습니다." /></div>
        <Link className="text-[#0B2D6B] underline" to="/notice">목록으로</Link>
      </main>
    );
  }

  return (
    <main className="pt-28 pb-20 w-[min(92vw,900px)] mx-auto">
      <Link className="text-[#0B2D6B] underline" to="/notice">← 목록으로</Link>

      <article className="mt-4 bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          {notice.is_pinned && (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">고정</span>
          )}
          <h1 className="text-2xl font-extrabold text-gray-900">{notice.title}</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(notice.created_at).toLocaleString()} · 조회 {notice.view_count?.toLocaleString?.() ?? notice.view_count}
        </p>
        <div className="mt-6 whitespace-pre-wrap leading-7 text-gray-800">
          {notice.content}
        </div>
      </article>
    </main>
  );
}
