import Slider from "react-slick";
import { useNavigate } from "react-router-dom";
import sliderImage1 from "../assets/img/메인1.jpg";
import sliderImage2 from "../assets/img/메인2.jpg";
import "../assets/css/slider.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function NextArrow(props) {
  const { onClick } = props;
  return (
    <button
      type="button"
      className="arrow next"
      onClick={onClick}
      aria-label="다음 슬라이드"
    >
      <FaChevronRight size={22} />
    </button>
  );
}

function PrevArrow(props) {
  const { onClick } = props;
  return (
    <button
      type="button"
      className="arrow prev"
      onClick={onClick}
      aria-label="이전 슬라이드"
    >
      <FaChevronLeft size={22} />
    </button>
  );
}

export default function SliderSection() {
  const navigate = useNavigate();

  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 10000,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    pauseOnHover: true,
    adaptiveHeight: false,
    responsive: [
      {
        breakpoint: 1024, // 태블릿 이하
        settings: { slidesToShow: 1 },
      },
      {
        breakpoint: 768, // 모바일 큰 화면
        settings: { slidesToShow: 1 },
      },
      {
        breakpoint: 480, // 모바일 작은 화면
        settings: { slidesToShow: 1, arrows: false }, // 모바일에서는 화살표 숨김
      },
    ],
  };

  const slides = [
    {
      img: sliderImage1,
      title: "ScholarMate",
      desc: (
        <>
          ScholarMate는 장학금 지원 기회를 놓치는 문제를 해결하고, <br />
          더 많은 학생들에게 교육의 평등성을 제공하는 것을 목표로 합니다.
        </>
      ),
      cta: { label: "자세히 알아보기", to: "/introduction" },
    },
    {
      img: sliderImage2,
      title: "AI 기반 추천",
      desc: (
        <>
          당신에게 맞는 장학금을 찾아보세요! <br />
          AI가 당신에게 가장 적합한 장학금을 추천해드립니다.
        </>
      ),
      cta: { label: "추천 받기", to: "/recommendation" },
    },
  ];

  return (
    <section className="slider__wrap">
      <Slider {...settings}>
        {slides.map((slide, index) => (
          <div key={index}>
            <div
              className="slider__img flex items-center justify-center text-center"
              style={{ backgroundImage: `url(${slide.img})` }}
              role="img"
              aria-label={slide.title}
            >
              <div className="slider__overlay" />
              <div className="desc text-white px-4 md:px-8">
                <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
                  {slide.title}
                </h3>
                <p className="text-base md:text-lg lg:text-xl mb-6 leading-relaxed">
                  {slide.desc}
                </p>
                <button
                  onClick={() => navigate(slide.cta.to)}
                  className="slider-btn"
                >
                  {slide.cta.label}
                </button>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
}
