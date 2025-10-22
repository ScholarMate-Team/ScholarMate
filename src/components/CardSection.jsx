import React from "react";
import Slider from "react-slick";
import 전체장학금 from "../assets/img/전체.png";
import 맞춤형추천 from "../assets/img/맞춤.png";
import 장학캘린더 from "../assets/img/달력.png";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function CardSection() {
  const cards = [
    {
      title: "전체 장학금",
      description: "다양한 기관의 장학금 정보를 한 곳에서 통합 관리",
      image: 전체장학금,
    },
    {
      title: "맞춤형 추천",
      description: "AI 기반 개인 맞춤형 장학금 추천 시스템",
      image: 맞춤형추천,
    },
    {
      title: "장학 캘린더",
      description: "장학금 신청 일정 및 마감일 관리 시스템",
      image: 장학캘린더,
    },
  ];

  // 슬라이더 설정 (모바일 전용)
  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    appendDots: (dots) => (
      <div>
        <ul className="custom-dots">{dots}</ul>
      </div>
    ),
  };

  return (
    <section id="functions" className="py-10 sm:py-16 bg-white w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 제목 */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
            주요 기능
          </h2>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            장학금 지원을 위한 핵심 기능을 제공합니다
          </p>
        </div>

        {/* 모바일: 슬라이더 */}
        <div className="block sm:hidden">
          <Slider {...sliderSettings}>
            {cards.map((card, idx) => (
              <div key={idx} className="px-2">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200 text-left">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-32 object-cover rounded-lg mb-3 border border-gray-300"
                  />
                  <h3 className="text-base font-semibold mb-1 text-gray-900">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-snug">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </Slider>
        </div>

        {/* 태블릿 이상: 그리드 */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition text-left"
            >
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-40 object-cover rounded-lg mb-3 border border-gray-300"
              />
              <h3 className="text-base font-semibold mb-1 text-gray-900">
                {card.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-snug">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
