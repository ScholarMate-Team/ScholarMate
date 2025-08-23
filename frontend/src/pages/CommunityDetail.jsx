import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, Avatar, Tag, Button } from "antd";
import { COMMUNITY_POSTS } from "../mock/community";

export default function CommunityDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const post = COMMUNITY_POSTS.find((p) => String(p.id) === String(id));

  if (!post) {
    return (
      <main className="pt-28 pb-20 w-[min(92vw,900px)] mx-auto">
        <p className="text-gray-500">해당 게시글을 찾을 수 없습니다.</p>
        <Link to="/community" className="text-[#0B2D6B] underline">
          ← 목록으로
        </Link>
      </main>
    );
  }

  return (
    <main className="pt-28 pb-20 w-[min(92vw,900px)] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button onClick={() => nav(-1)}>← 뒤로가기</Button>
        <Link to="/community" className="text-[#0B2D6B] underline">
          목록으로
        </Link>
      </div>

      <Card title={post.scholarshipName} className="shadow-md">
        <div className="flex items-center mb-4">
          <Avatar src={post.author.avatar} />
          <div className="ml-3">
            <div className="font-semibold">{post.author.name}</div>
            <div className="text-sm text-gray-500">
              {post.author.major} | {post.author.year}
            </div>
          </div>
        </div>

        <div className="text-gray-800 whitespace-pre-wrap leading-7 mb-4">
          {post.content}
        </div>

        <div className="flex flex-wrap gap-2">
          {post.tags.map((t, idx) => (
            <Tag key={idx} color="blue">
              #{t}
            </Tag>
          ))}
        </div>
      </Card>
    </main>
  );
}
