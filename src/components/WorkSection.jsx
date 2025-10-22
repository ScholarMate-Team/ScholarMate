import React from "react";
import {
  FaUserPlus,
  FaSearch,
  FaComments,
  FaClipboardList,
} from "react-icons/fa";

export default function HowItWorksSection() {
  const steps = [
    {
      icon: <FaUserPlus className="text-black text-base" />,
      title: "프로필 등록",
      description: "학점, 전공, 활동 내역 등 기본 정보를 입력하세요.",
    },
    {
      icon: <FaSearch className="text-black text-base" />,
      title: "맞춤 장학금 추천",
      description: "AI가 프로필을 분석하여 적합한 장학금을 추천해 드립니다.",
    },
    {
      icon: <FaComments className="text-black text-base" />,
      title: "경험 공유 확인",
      description: "수혜자들의 합격 후기와 조언을 참고하세요.",
    },
    {
      icon: <FaClipboardList className="text-black text-base" />,
      title: "지원 및 관리",
      description: "지원서 작성 가이드를 참고하고 마감일을 관리하세요.",
    },
  ];

  return (
    <section id="how-to" className="mt-16 sm:mt-24 py-10 sm:py-16 bg-gray-50">
      <div className="w-full px-0">
        {/* 제목 */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
            이용 방법
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed whitespace-normal break-keep">
            ScholarMate를 통해 맞춤형 장학금을 찾고 지원하는 과정을 알아보세요.
          </p>
        </div>

        {/* 카드 영역 */}
        <div className="grid md:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-white p-4 sm:p-5 rounded-lg shadow-sm text-center"
            >
              {/* Step 라벨 */}
              <span className="block text-[11px] sm:text-xs font-semibold text-blue-600 mb-1">
                Step {index + 1}
              </span>

              {/* 아이콘 (작게) */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                {step.icon}
              </div>

              {/* 제목 */}
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                {step.title}
              </h3>

              {/* 설명 */}
              <p className="text-[11px] sm:text-sm text-gray-600 leading-snug">
                {step.description}
              </p>

              {/* 👉 데스크탑: 오른쪽 화살표 */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <i className="fas fa-chevron-right text-gray-400 text-base"></i>
                </div>
              )}

              {/* 👉 모바일: 아래쪽 화살표 */}
              {index < steps.length - 1 && (
                <div className="block md:hidden mt-2">
                  <i className="fas fa-chevron-down text-gray-400 text-base"></i>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
