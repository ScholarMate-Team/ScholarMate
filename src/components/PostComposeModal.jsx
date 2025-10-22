// src/components/PostComposeModal.jsx
import { useEffect } from "react";
import { Modal, Form, Input, Select, message } from "antd";
import { createPost } from "../api/community";

const { TextArea } = Input;

export default function PostComposeModal({
  open,
  onClose,
  onCreated,
  defaultCategory = "story",
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        category: defaultCategory,
        scholarship_name: "",
        title: "",
        content: "",
        tags: [],
      });
    }
  }, [open, defaultCategory, form]);

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        category: values.category,
        scholarship_name: values.scholarship_name.trim(),
        title: values.title.trim(),
        content: values.content.trim(),
        tags: values.tags || [],
      };
      await createPost(payload);
      message.success("게시글이 등록되었습니다.");
      onClose?.();
      onCreated?.();
    } catch (e) {
      if (e?.errorFields) return;
      const msg = e?.response?.data?.detail || "등록에 실패했습니다.";
      message.error(String(msg));
    }
  };

  return (
    <Modal
      title="새 글 작성"
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      okText="등록"
      cancelText="취소"
      destroyOnHidden
      okButtonProps={{ className: "!bg-black !border-black" }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="category"
          label="글 유형"
          rules={[{ required: true, message: "글 유형을 선택하세요." }]}
        >
          <Select
            options={[
              { value: "story", label: "스토리(후기/노하우)" },
              { value: "feed", label: "피드(질문/짧은 글)" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="scholarship_name"
          label="장학금 이름 (필수)"
          rules={[
            { required: true, message: "장학금 이름을 입력하세요." },
            { min: 2, message: "장학금 이름은 2자 이상" },
          ]}
        >
          <Input placeholder="예) 국가장학금, 행복장학, 삼성꿈장학 등" />
        </Form.Item>

        <Form.Item
          name="title"
          label="제목"
          rules={[
            { required: true, message: "제목을 입력하세요." },
            { min: 2, message: "제목은 2자 이상" },
          ]}
        >
          <Input placeholder="제목" />
        </Form.Item>

        <Form.Item
          name="content"
          label="내용"
          rules={[{ required: true, message: "내용을 입력하세요." }]}
        >
          <TextArea rows={8} placeholder="경험, 준비 과정, 팁 등을 자유롭게 작성해 주세요." />
        </Form.Item>

        <Form.Item name="tags" label="태그 (엔터로 추가)">
          <Select mode="tags" tokenSeparators={[","]} placeholder="예) 자소서, 면접, 준비기간" />
        </Form.Item>

        {/* ✔ 수혜자 인증 배지 스위치 완전히 제거됨 */}
      </Form>
    </Modal>
  );
}
