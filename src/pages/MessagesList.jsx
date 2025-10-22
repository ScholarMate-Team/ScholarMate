// src/pages/MessagesList.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Card,
  Spin,
  Empty,
  Badge,
  Button,
  Popconfirm,
  message as antdMessage,
} from "antd";

export default function MessagesList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/community/conversations/", {
        params: { page_size: 50, ordering: "-latest_time" },
      });
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setItems(list);
    } catch (e) {
      console.error(e);
      antdMessage.error("쪽지 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const removeConversation = async (id) => {
    setRemovingId(id);
    try {
      try {
        await api.delete(`/community/conversations/${id}/`);
      } catch (e) {
        await api.post(`/community/conversations/${id}/leave/`);
      }
      setItems((prev) => prev.filter((c) => String(c.id) !== String(id)));
      antdMessage.success("대화방을 삭제했습니다.");
    } catch (e) {
      console.error(e);
      antdMessage.error("대화방 삭제에 실패했습니다.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className="pt-6 pb-20 w-[min(92vw,800px)] mx-auto">
      <Card title="쪽지함">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <Empty description="받은 대화가 없습니다." />
        ) : (
          <ul className="divide-y">
            {items.map((c) => {
              const other = c.partner?.username ?? "알 수 없음";
              const last = c.latest_message ?? "";
              const at = c.latest_time
                ? new Date(c.latest_time).toLocaleString()
                : "";
              const unread = c.unread_count ?? 0;

              return (
                <li
                  key={c.id}
                  className="py-3 px-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/messages/${c.id}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* 왼쪽: 상대 / 최신미리보기 */}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base">
                        {unread > 0 ? (
                          <Badge count={unread} offset={[6, -2]}>
                            {other}
                          </Badge>
                        ) : (
                          other
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1">
                        {last || "최근 메시지가 없습니다."}
                      </div>
                    </div>

                    {/* 오른쪽: 시간 & 삭제 버튼 */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3 shrink-0 text-right">
                      <div className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                        {at}
                      </div>
                      <Popconfirm
                        title="이 대화방을 삭제할까요?"
                        description="대화 목록에서 제거됩니다."
                        okText="삭제"
                        cancelText="취소"
                        okButtonProps={{ danger: true, loading: removingId === c.id }}
                        onConfirm={(e) => {
                          e?.stopPropagation?.();
                          removeConversation(c.id);
                        }}
                        onCancel={(e) => e?.stopPropagation?.()}
                      >
                        <Button
                          danger
                          size="small"
                          loading={removingId === c.id}
                          onClick={(e) => e.stopPropagation()}
                          className="!text-xs sm:!text-sm"
                        >
                          삭제
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}
