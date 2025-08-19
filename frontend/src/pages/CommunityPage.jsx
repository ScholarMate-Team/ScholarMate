import React, { useState, useEffect } from 'react';
import { Input, Card, Avatar, Tag, Skeleton } from 'antd';
import {
  SearchOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  BookOutlined,
  BookFilled
} from '@ant-design/icons';
import '../assets/css/community.css';

function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const mockPosts = [
      {
        id: 1,
        author: { name: '박해준', avatar: '', major: '컴퓨터공학과', year: '4학년' },
        scholarshipName: '국가장학금 1유형',
        scholarshipType: '국가장학금',
        year: '2025',
        content: '신청 시 가장 중요한 것은 기한을 놓치지 않는 것! 기한 체크는 캘린더에 등록해두면 편해요. 제출 서류는 미리 준비해두면 더 좋아요.',
        likes: 128, comments: 24, views: 1024,
        isLiked: false, isBookmarked: false,
        tags: ['국가장학금', '1유형']
      },
      {
        id: 2,
        author: { name: '김정민', avatar: '', major: '정보통신공학과', year: '3학년' },
        scholarshipName: '교내 성적우수 장학',
        scholarshipType: '교내',
        year: '2025',
        content: '평점 3.8 이상 + 이수학점 기준 체크 필수. 가산점 항목도 꼭 확인하세요.',
        likes: 52, comments: 8, views: 410,
        isLiked: true, isBookmarked: false,
        tags: ['교내', '성적']
      },
      {
        id: 3,
        author: { name: '임헌터', avatar: '', major: '전자공학과', year: '4학년' },
        scholarshipName: '지역 인재 장학(서류 준비 중요)',
        scholarshipType: '지역',
        year: '2025',
        content: '거주지 증빙서류 준비가 생각보다 오래 걸립니다. 주민센터 제출 서류 목록 미리 확인하세요.',
        likes: 33, comments: 3, views: 210,
        isLiked: false, isBookmarked: true,
        tags: ['지역', '서류']
      }
    ];
    setTimeout(() => { setPosts(mockPosts); setLoading(false); }, 600);
  }, []);

  const handleLike = (id) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const handleBookmark = (id) => {
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, isBookmarked: !p.isBookmarked } : p)));
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    setLoading(true);
    setTimeout(() => setLoading(false), 400);
  };

  const filteredPosts = posts.filter(post => {
    if (!searchValue) return true;
    const q = searchValue.toLowerCase();
    return (
      post.scholarshipName.toLowerCase().includes(q) ||
      post.content.toLowerCase().includes(q) ||
      post.author.name.toLowerCase().includes(q) ||
      post.tags.some(tag => tag.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-6 rounded-b-2xl shadow mt-[80px]">
        <div className="w-full px-6 md:px-10 flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            ScholarMate <span className="font-normal">커뮤니티</span>
          </h1>
          <div className="w-full md:w-1/3 mt-4 md:mt-0">
            <Input
              placeholder="장학금, 작성자, 내용 검색..."
              prefix={<SearchOutlined className="text-gray-200" />}
              className="rounded-full"
              size="large"
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </div>
        </div>
      </div>

      {/* 본문 */}
      <main className="w-full px-6 md:px-10 py-8">
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">게시글 목록</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {loading
              ? Array(6).fill(null).map((_, i) => (
                  <div key={i} className="h-full">
                    <Card className="card-full shadow-md h-full">
                      <Skeleton avatar active paragraph={{ rows: 3 }} />
                    </Card>
                  </div>
                ))
              : filteredPosts.length > 0
              ? filteredPosts.map((post) => (
                  <div key={post.id} className="h-full">
                    <Card
                      title={<span className="card-title-clamp">{post.scholarshipName}</span>}
                      className="card-full shadow-md hover:shadow-lg transition-shadow h-full"
                      actions={[
                        <div onClick={() => handleLike(post.id)} className="cursor-pointer">
                          {post.isLiked ? <HeartFilled className="text-red-500" /> : <HeartOutlined />}
                          <span className="ml-1">{post.likes}</span>
                        </div>,
                        <div onClick={() => handleBookmark(post.id)} className="cursor-pointer">
                          {post.isBookmarked ? <BookFilled className="text-blue-500" /> : <BookOutlined />}
                        </div>,
                        <ShareAltOutlined />,
                      ]}
                    >
                      <div className="post-body">
                        <div className="flex items-center mb-3">
                          <Avatar src={post.author.avatar} />
                          <div className="ml-3">
                            <div className="font-semibold">{post.author.name}</div>
                            <div className="text-sm text-gray-500">{post.author.major} | {post.author.year}</div>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-3 post-content">
                          {post.content}
                        </p>

                        <div className="flex flex-wrap gap-1 mt-auto">
                          {post.tags.map((tag, idx) => (
                            <Tag key={idx} color="blue">#{tag}</Tag>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))
              : <div className="col-span-full text-center text-gray-500">표시할 게시글이 없습니다.</div>}
          </div>
        </section>
      </main>
    </div>
  );
}

export default CommunityPage;
