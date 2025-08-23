import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

// NoticeList와 동일한 목데이터
const DUMMY = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  title: `ScholarMate 서비스 업데이트 ${i + 1}`,
  content: `업데이트 상세 내용입니다. (목데이터) #${i + 1}\n- 기능 개선\n- 버그 수정`,
  is_pinned: i < 2,
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
}));

export default function NoticeDetail() {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const found = DUMMY.find((n) => String(n.id) === String(id));
    setNotice(found || null);
    setLoading(false);
  }, [id]);

  if (loading) return (
    <main className="pt-28 pb-20 w-[min(92vw,900px)] mx-auto">불러오는 중…</main>
  );

  if (!notice)
    return (
      <main className="pt-28 pb-20 w-[min(92vw,900px)] mx-auto">
        <p className="text-gray-500">해당 공지가 없습니다.</p>
        <Link className="text-[#0B2D6B] underline" to="/notice">목록으로</Link>
      </main>
    );

  return (
    <main className="pt-28 pb-20 w-[min(92vw,900px)] mx-auto">
      <Link className="text-[#0B2D6B] underline" to="/notice">← 목록으로</Link>

      <article className="mt-4 bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          {notice.is_pinned && (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
              고정
            </span>
          )}
          <h1 className="text-2xl font-extrabold text-gray-900">{notice.title}</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(notice.created_at).toLocaleString()}
        </p>

        <div className="mt-6 whitespace-pre-wrap leading-7 text-gray-800">
          {notice.content}
        </div>
      </article>
    </main>
  );
}
