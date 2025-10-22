import React from "react";
import { FaChartLine, FaUsers, FaClock, FaBookmark } from "react-icons/fa";

export default function FeatureSection() {
  const features = [
    {
      icon: <FaChartLine className="text-lg text-white" />, // 아이콘 크기 축소
      title: "통합 검색",
      description: "모든 장학금 정보를 한 번에 검색",
    },
    {
      icon: <FaUsers className="text-lg text-white" />,
      title: "AI 추천",
      description: "개인화된 맞춤형 장학금 추천",
    },
    {
      icon: <FaClock className="text-lg text-white" />,
      title: "알림 서비스",
      description: "마감일 및 중요 일정 알림",
    },
    {
      icon: <FaBookmark className="text-lg text-white" />,
      title: "관리 서비스",
      description: "관심 장학금을 저장하고 쉽게 관리",
    },
  ];

  return (
    <section id="features" className="py-10 sm:py-16 bg-gray-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 제목 */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
            시스템 특징
          </h2>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            더 스마트한 장학금 관리를 경험하세요
          </p>
        </div>

        {/* ✅ 항상 2×2 정사각형 레이아웃 */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {features.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm hover:shadow-md transition aspect-square p-4 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black mb-3">
                {item.icon}
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-1 text-gray-900">
                {item.title}
              </h3>
              <p className="text-[11px] sm:text-sm text-gray-600 leading-snug">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
