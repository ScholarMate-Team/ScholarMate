import React from "react";
import { Link } from "react-router-dom"; // 추가
import "../assets/css/Card.css";

const Card = ({ image, title, description, link }) => {
  return (
    <article className="card">
      <img src={image} alt={title} />
      <div className="card__body">
        <h3 className="tit">{title}</h3>
        <p className="desc">{description}</p>
        <Link className="btn" to={link}> {/* Link 사용 */}
          바로가기 →
        </Link>
      </div>
    </article>
  );
};

export default Card;
