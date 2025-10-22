import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Pagination,
  Input,
  Button,
  Spin,
  Empty,
  Modal,
  Form,
  Input as AntInput,
  Switch,
  message,
} from "antd";
import { fetchNotices, createNotice } from "../api/notices";
import { fetchMe } from "../api/user";

const { Search } = Input;

export default function NoticeList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 쿼리 파라미터 동기화 상태
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("page_size") || 10)
  );

  // 데이터 상태
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);

  // 사용자/권한 (관리자만 글쓰기 노출)
  const [me, setMe] = useState(null);

  // 글쓰기 모달
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const syncQuery = (next = {}) => {
    const params = new URLSearchParams({
      q: next.q ?? q,
      page: String(next.page ?? page),
      page_size: String(next.pageSize ?? pageSize),
    });
    setSearchParams(params);
  };

  // 내 정보 불러오기 (is_staff 확인)
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

  // 목록 불러오기 (디바운스)
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { total, items } = await fetchNotices({ q, page, pageSize });
        setTotal(total);
        setItems(items);
      } catch (e) {
        console.error(e);
        setTotal(0);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, page, pageSize]);

  // 검색 실행
  const onSearch = (value) => {
    setQ(value);
    setPage(1);
    syncQuery({ q: value, page: 1 });
  };

  // 페이지 변경
  const onChangePage = (p, ps) => {
    setPage(p);
    if (ps !== pageSize) setPageSize(ps);
    syncQuery({ page: p, pageSize: ps });
  };

  // 페이지 크기 변경
  const onShowSizeChange = (_, ps) => {
    setPageSize(ps);
    setPage(1);
    syncQuery({ page: 1, pageSize: ps });
  };

  // 글쓰기 모달 열기
  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      title: "",
      content: "",
      is_pinned: false,
      is_published: true,
    });
    setModalOpen(true);
  };

  // 글쓰기 저장
  const submitCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await createNotice(values); // 백엔드에서 IsAdminUser로 보호
      message.success("등록되었습니다.");
      setModalOpen(false);

      // 첫 페이지로 이동 & 재조회
      setPage(1);
      syncQuery({ page: 1 });
      setLoading(true);
      const { total, items } = await fetchNotices({ q, page: 1, pageSize });
      setTotal(total);
      setItems(items);
    } catch (e) {
      if (e?.errorFields) return;
      console.error(e);
      message.error(
        e?.response?.status === 403
          ? "권한이 없습니다. 관리자만 작성할 수 있어요."
          : "저장에 실패했습니다."
      );
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  return (
    <main className="pt-6 pb-6 w-[min(92vw,1000px)] mx-auto">
      {/* 제목 */}
      <h1 className="text-3xl font-extrabold text-[#0B2D6B] mb-6 text-center">
        공지사항
      </h1>

      {/* 검색 + 총건수 + (관리자) 글쓰기 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <Search
            placeholder="제목/내용 검색…"
            allowClear
            size="large"
            defaultValue={q}
            onSearch={onSearch}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: "100%", backgroundColor: "#fff" }}
            enterButton={
              <Button
                type="primary"
                size="large"
                style={{ backgroundColor: "#000", borderColor: "#000" }}
              >
                검색
              </Button>
            }
          />
        </div>

        <div className="flex items-center gap-2 sm:ml-3 justify-between sm:justify-end">
          <span className="text-sm text-gray-500">{total}건</span>
          {me?.is_staff && (
            <Button
              type="primary"
              onClick={openCreate}
              className="!bg-black !border-black !text-white hover:!bg-gray-800"
            >
              글쓰기
            </Button>
          )}
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <div className="py-12">
          <Empty description="공지사항이 없습니다." />
        </div>
      ) : (
        <ul className="grid gap-3 sm:divide-y sm:divide-gray-200 sm:border sm:rounded-lg sm:bg-white">
          {items.map((n) => (
            <li
              key={n.id}
              className="bg-white sm:bg-transparent sm:rounded-none sm:shadow-none 
                         p-4 sm:p-4 rounded-lg shadow-sm hover:bg-gray-50"
            >
              <Link to={`/notice/${n.id}`} className="block">
                <div className="flex items-center gap-2 mb-1">
                  {n.is_pinned && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      고정
                    </span>
                  )}
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1">
                    {n.title}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 페이지네이션 */}
      {total > 0 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={onChangePage}
            showSizeChanger
            onShowSizeChange={onShowSizeChange}
            pageSizeOptions={["10", "20", "50"]}
            showTotal={(t, range) => `${range[0]}-${range[1]} / 총 ${t}건`}
          />
        </div>
      )}

      {/* ✍️ 글쓰기 모달 (관리자 전용) */}
      <Modal
        title="새 공지 작성"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submitCreate}
        confirmLoading={saving}
        okText="등록"
        destroyOnHidden
        okButtonProps={{
          className: "!bg-black !border-black !text-white hover:!bg-gray-800",
        }}
        cancelButtonProps={{
          className: "!border-gray-400 hover:!border-gray-600",
        }}
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
            <Form.Item
              name="is_pinned"
              label="상단 고정"
              valuePropName="checked"
              className="mb-0"
            >
              <Switch className="!border !border-black" />
            </Form.Item>
            <Form.Item
              name="is_published"
              label="공개"
              valuePropName="checked"
              className="mb-0"
            >
              <Switch defaultChecked className="!border !border-black" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </main>
  );
}
