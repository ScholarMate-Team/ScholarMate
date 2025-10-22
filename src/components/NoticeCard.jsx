import { Link } from "react-router-dom";

export default function NoticeCard({ notice }) {
  const { id, title, created_at, is_pinned } = notice;

  return (
    <li className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
      <Link to={`/notice/${id}`} className="block">
        <div className="flex items-center gap-2">
          {is_pinned && (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
              고정
            </span>
          )}
          <h4 className="font-semibold text-lg text-gray-900 line-clamp-1">{title}</h4>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(created_at).toLocaleDateString()}
        </p>
      </Link>
    </li>
  );
}
