import React from "react";
import 전체장학금 from "../assets/img/전체.png";
import 맞춤형추천 from "../assets/img/맞춤.png";
import 장학캘린더 from "../assets/img/달력.png";

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

  return (
    <section className="py-20 bg-white w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">주요 기능</h2>
          <p className="mt-4 text-lg text-gray-600">
            장학금 지원을 위한 핵심 기능을 제공합니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition text-left"
            >
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-48 object-cover rounded-lg mb-4 border border-gray-300"
              />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">{card.title}</h3>
              <p className="text-gray-600">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
