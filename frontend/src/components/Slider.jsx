import Slider from "react-slick";
import sliderImage1 from "../assets/img/main.jpg";
import sliderImage2 from "../assets/img/배너.jpg";
import "../assets/css/Slider.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function NextArrow(props) {
  const { onClick } = props;
  return (
    <div className="arrow next" onClick={onClick}>
      <FaChevronRight size={24} />
    </div>
  );
}

function PrevArrow(props) {
  const { onClick } = props;
  return (
    <div className="arrow prev" onClick={onClick}>
      <FaChevronLeft size={24} />
    </div>
  );
}

export default function SliderSection() {
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
    },
  ];

  return (
    <section className="slider__wrap">
      <Slider {...settings}>
        {slides.map((slide, index) => (
          <div key={index}>
            <div
              className="slider__img"
              style={{ backgroundImage: `url(${slide.img})` }}
            >
              <div className="desc text-white text-center">
                <h3 className="text-4xl md:text-6xl font-bold mb-4">
                  {slide.title}
                </h3>
                <p className="text-lg md:text-xl mb-6">{slide.desc}</p>
                <button className="bg-black text-white font-bold px-6 py-3 rounded-lg shadow-md hover:bg-gray-800 hover:scale-105 transition duration-300">
                  자세히 알아보기
                </button>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
}
