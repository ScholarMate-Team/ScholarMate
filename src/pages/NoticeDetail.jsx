import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Spin, Empty, Button, Modal, Form, Input as AntInput, Switch, message } from "antd";
import { fetchNotice, updateNotice, deleteNotice } from "../api/notices";
import { fetchMe } from "../api/user";

export default function NoticeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [me, setMe] = useState(null);

  // 수정 모달
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // 내 정보 (관리자 여부)
  useEffect(() => {
    (async () => {
      try {
        const u = await fetchMe();
        setMe(u);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  // 상세 로드 (view_count 증가)
  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchNotice(id);
      setItem(data);
    } catch (e) {
      console.error(e);
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const openEdit = () => {
    if (!item) return;
    form.resetFields();
    form.setFieldsValue({
      title: item.title,
      content: item.content,
      is_pinned: item.is_pinned,
      is_published: item.is_published ?? true,
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await updateNotice(item.id, values);
      message.success("수정되었습니다.");
      setEditOpen(false);
      load();
    } catch (e) {
      if (e?.errorFields) return;
      console.error(e);
      message.error(
        e?.response?.status === 403 ? "권한이 없습니다." : "수정에 실패했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    Modal.confirm({
      title: "삭제하시겠어요?",
      content: "삭제 후 되돌릴 수 없습니다.",
      okText: "삭제",
      okButtonProps: { danger: true },
      cancelText: "취소",
      async onOk() {
        try {
          await deleteNotice(item.id);
          message.success("삭제되었습니다.");
          navigate("/notice");
        } catch (e) {
          console.error(e);
          message.error("삭제에 실패했습니다.");
        }
      },
    });
  };

  return (
    <main className="pt-6 pb-6 w-[min(92vw,900px)] mx-auto">
      <Link className="text-[#0B2D6B] underline" to="/notice">← 목록으로</Link>

      {loading ? (
        <div className="py-16 flex justify-center"><Spin /></div>
      ) : !item ? (
        <div className="py-16"><Empty description="해당 공지가 없습니다." /></div>
      ) : (
        <article className="mt-4 bg-white border border-gray-200 rounded-lg sm:rounded-2xl p-4 sm:p-6 shadow-sm sm:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              {item.is_pinned && (
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">고정</span>
              )}
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">{item.title}</h1>
            </div>

            {/* 관리자 액션 */}
            {me?.is_staff && (
              <div className="flex gap-2">
                <Button
                  className="!bg-black !border-black !text-white hover:!bg-gray-800"
                  onClick={openEdit}
                >
                  수정
                </Button>
                <Button danger onClick={doDelete}>삭제</Button>
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {new Date(item.created_at).toLocaleString()}
            {typeof item.view_count === "number" && (
              <span className="ml-2 text-gray-400">조회 {item.view_count.toLocaleString()}회</span>
            )}
          </p>

          <div className="mt-6 whitespace-pre-wrap text-sm sm:text-base leading-6 sm:leading-7 text-gray-800">
            {item.content}
          </div>
        </article>
      )}

      {/* 수정 모달 */}
      <Modal
        title="공지 수정"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={submitEdit}
        okText="저장"
        confirmLoading={saving}
        destroyOnHidden
        okButtonProps={{ className: "!bg-black !border-black !text-white hover:!bg-gray-800" }}
        cancelButtonProps={{ className: "!border-gray-400 hover:!border-gray-600" }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="제목"
            rules={[
              { required: true, message: "제목을 입력하세요." },
              { min: 2, message: "제목은 2자 이상 입력하세요." },
            ]}
          >
            <AntInput placeholder="제목" />
          </Form.Item>

          <Form.Item
            name="content"
            label="내용"
            rules={[{ required: true, message: "내용을 입력하세요." }]}
          >
            <AntInput.TextArea rows={6} placeholder="내용" />
          </Form.Item>

          <div className="flex gap-6">
            <Form.Item name="is_pinned" label="상단 고정" valuePropName="checked" className="mb-0">
              <Switch className="!border !border-black" />
            </Form.Item>
            <Form.Item name="is_published" label="공개" valuePropName="checked" className="mb-0">
              <Switch className="!border !border-black" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </main>
  );
}
