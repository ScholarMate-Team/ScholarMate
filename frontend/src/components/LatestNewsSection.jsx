import React from "react";
import koreaImg from "../assets/img/한국.png";
import dreamsponImg from "../assets/img/드림스폰.png";

export default function LatestNewsSection() {
  const news = [
    {
      date: "🎓 한국장학재단 (KOSAF)",
      title: "국가에서 운영하는 공식 장학금 지원 기관",
      description:
        "국가장학금 1유형/2유형을 포함한 공공재정 기반 장학금 제공, 다양한 봉사장학금, 우수인재 국가장학금, 다자녀장학금 등 운영",
      image: koreaImg,
      link: "https://www.kosaf.go.kr",
      imgClass: "max-h-48", // 그대로 유지
    },
    {
      date: "🌟 드림스폰 (DreamSpon)",
      title: "민간이 운영하는 장학 후원 매칭 플랫폼",
      description:
        "저소득층, 다문화, 탈북, 보호종료청년 등 사회적 배려계층 중심 지원, 단순한 금전 지원뿐만 아니라 멘토링, 진로상담, 정서 지원 등 포함",
      image: dreamsponImg,
      link: "https://www.dreamspon.com",
      imgClass: "max-h-32", // 더 작게 조정
    },
  ];

  return (
    <section className="py-20 bg-white w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">최신 소식</h2>
          <p className="mt-4 text-lg text-gray-600">최신 장학금 소식을 확인하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {news.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="bg-white flex items-center justify-center h-64 border-b border-gray-200">
                <img
                  src={item.image}
                  alt={`${item.title} 이미지`}
                  className={`object-contain ${item.imgClass}`}
                />
              </div>
              <div className="p-6 text-left">
                <div className="text-sm text-gray-500 mb-2">{item.date}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black font-medium hover:text-blue-800 transition-colors"
                >
                  자세히 보기 →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
