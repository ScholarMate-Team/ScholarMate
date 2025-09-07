// 커뮤니티 목데이터 (CommunityPage/CommunityDetail 공용)
export const COMMUNITY_POSTS = [
  {
    id: 1,
    author: { name: "박해준", avatar: "", major: "컴퓨터공학과", year: "4학년" },
    scholarshipName: "국가장학금 1유형 신청 시 참고하세요!",
    scholarshipType: "국가장학금",
    year: "2025",
    content:
      "신청 시 가장 중요한 것은 기한을 놓치지 않는 것! 캘린더에 등록해두면 좋아요.",
    likes: 128, comments: 24, views: 1024,
    isLiked: false, isBookmarked: false,
    tags: ["국가장학금", "1유형"],
    created_at: "2025-08-23T10:00:00Z"
  },
  {
    id: 2,
    author: { name: "김정민", avatar: "", major: "정보통신공학과", year: "3학년" },
    scholarshipName: "교내 성적우수 장학금 신청 도움 드려요~",
    scholarshipType: "교내",
    year: "2025",
    content: "평점 3.8 이상 + 이수학점 기준 체크 필수. 가산점 항목도 꼭 확인하세요.",
    likes: 52, comments: 8, views: 410,
    isLiked: true, isBookmarked: false,
    tags: ["교내", "성적"],
    created_at: "2025-08-22T15:00:00Z"
  },
  {
    id: 3,
    author: { name: "임헌터", avatar: "", major: "전자공학과", year: "4학년" },
    scholarshipName: "지역 인재 장학(서류 준비 중요) 정보 드립니다.",
    scholarshipType: "지역",
    year: "2025",
    content: "거주지 증빙서류 준비가 생각보다 오래 걸립니다. 주민센터 제출 서류 꼭 확인하세요.",
    likes: 33, comments: 3, views: 210,
    isLiked: false, isBookmarked: true,
    tags: ["지역", "서류"],
    created_at: "2025-08-21T09:00:00Z"
  },
  {
    id: 4,
    author: { name: "이서연", avatar: "", major: "경영학과", year: "2학년" },
    scholarshipName: "교외 재단 장학금 서류 준비 팁",
    scholarshipType: "교외",
    year: "2025",
    content: "추천서와 자기소개서 초안은 미리 작성해 두는 게 좋아요.",
    likes: 80, comments: 12, views: 512,
    isLiked: false, isBookmarked: false,
    tags: ["교외", "서류"],
    created_at: "2025-08-20T11:30:00Z"
  },
  {
    id: 5,
    author: { name: "최민호", avatar: "", major: "법학과", year: "1학년" },
    scholarshipName: "장학금 면접 준비 경험 공유",
    scholarshipType: "면접",
    year: "2025",
    content: "기본 질문은 예상하고 연습하세요. 특히 자기소개는 확실히 준비해야 합니다.",
    likes: 40, comments: 6, views: 190,
    isLiked: false, isBookmarked: false,
    tags: ["면접", "팁"],
    created_at: "2025-08-19T14:00:00Z"
  },
  {
    id: 6,
    author: { name: "박소현", avatar: "", major: "국어국문학과", year: "3학년" },
    scholarshipName: "교내 장학금 신청 시 유의사항",
    scholarshipType: "교내",
    year: "2025",
    content: "성적 증명서 발급은 미리미리 준비하세요. 막학기 학생은 신청 조건 잘 확인!",
    likes: 29, comments: 2, views: 160,
    isLiked: false, isBookmarked: true,
    tags: ["교내", "성적"],
    created_at: "2025-08-18T10:00:00Z"
  },
  {
    id: 7,
    author: { name: "정유진", avatar: "", major: "간호학과", year: "2학년" },
    scholarshipName: "의료인 장학금 신청 후기",
    scholarshipType: "교외",
    year: "2025",
    content: "서류가 많지만 꼼꼼히 준비하면 충분히 가능합니다!",
    likes: 18, comments: 1, views: 120,
    isLiked: false, isBookmarked: false,
    tags: ["간호", "장학금"],
    created_at: "2025-08-17T09:30:00Z"
  },
  {
    id: 8,
    author: { name: "한지민", avatar: "", major: "수학과", year: "4학년" },
    scholarshipName: "이공계 특별 장학금 안내",
    scholarshipType: "교외",
    year: "2025",
    content: "이공계 전공자를 위한 특별 장학금이 새로 열렸습니다.",
    likes: 64, comments: 5, views: 350,
    isLiked: true, isBookmarked: false,
    tags: ["이공계", "특별"],
    created_at: "2025-08-16T15:00:00Z"
  },
  {
    id: 9,
    author: { name: "서지후", avatar: "", major: "경제학과", year: "1학년" },
    scholarshipName: "신입생 교내 장학 신청 방법",
    scholarshipType: "교내",
    year: "2025",
    content: "학과 사무실 공지 꼭 확인하세요. 신청서 양식은 교내 홈페이지에 있습니다.",
    likes: 22, comments: 0, views: 100,
    isLiked: false, isBookmarked: false,
    tags: ["신입생", "교내"],
    created_at: "2025-08-15T13:00:00Z"
  },
  {
    id: 10,
    author: { name: "장우석", avatar: "", major: "화학과", year: "2학년" },
    scholarshipName: "연구 장학금 준비 과정",
    scholarshipType: "연구",
    year: "2025",
    content: "연구계획서는 교수님께 미리 피드백 받는 걸 추천합니다.",
    likes: 45, comments: 7, views: 230,
    isLiked: false, isBookmarked: false,
    tags: ["연구", "장학금"],
    created_at: "2025-08-14T20:00:00Z"
  },
  {
    id: 11,
    author: { name: "문지호", avatar: "", major: "심리학과", year: "3학년" },
    scholarshipName: "심리학과 교외 장학 후기",
    scholarshipType: "교외",
    year: "2025",
    content: "면접에서 전공 관련 질문이 많이 나왔어요.",
    likes: 12, comments: 0, views: 75,
    isLiked: false, isBookmarked: false,
    tags: ["심리학", "면접"],
    created_at: "2025-08-13T11:00:00Z"
  },
  {
    id: 12,
    author: { name: "홍길동", avatar: "", major: "체육학과", year: "4학년" },
    scholarshipName: "체육특기생 장학금 후기",
    scholarshipType: "특기생",
    year: "2025",
    content: "경기 실적 증빙자료 제출이 핵심입니다.",
    likes: 8, comments: 1, views: 60,
    isLiked: false, isBookmarked: false,
    tags: ["체육", "특기"],
    created_at: "2025-08-12T09:00:00Z"
  }
];
