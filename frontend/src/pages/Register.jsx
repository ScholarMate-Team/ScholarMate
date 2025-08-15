import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../assets/css/Auth.css"; 

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (form.password !== form.confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await axios.post("/auth/users/", {
        username: form.username,
        password: form.password,
        email: form.email,
      });
      alert("회원가입 성공! 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (error) {
      if (error.response?.data?.username) {
        setErrorMessage("이미 가입된 아이디입니다.");
      } else if (error.response?.data?.password) {
        setErrorMessage("비밀번호는 8자리 이상이어야 합니다.");
      } else if (error.response?.data?.email) {
        setErrorMessage("유효하지 않은 이메일 형식입니다.");
      } else {
        setErrorMessage("회원가입 실패: " + JSON.stringify(error.response?.data));
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="text-3xl font-bold mb-8 pb-4 border-b border-gray-300 text-gray-900">
          회원가입
        </h1>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <form onSubmit={handleSubmit}>
          <input type="text" name="username" placeholder="아이디" onChange={handleChange} required />
          <input type="password" name="password" placeholder="비밀번호 (8자 이상)" onChange={handleChange} required />
          <input type="password" name="confirmPassword" placeholder="비밀번호 확인" onChange={handleChange} required />
          <input type="email" name="email" placeholder="이메일 주소" onChange={handleChange} required />
           <button type="submit" className="btn bg-black text-white px-4 py-2 rounded">
            회원가입
          </button>
        </form>
        <p>이미 계정이 있으신가요? <button className="link-btn" onClick={() => navigate("/login")}>로그인</button></p>
      </div>
    </div>
  );
}