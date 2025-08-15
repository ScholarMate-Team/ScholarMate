# 🎓 ScholarMate

AI 기반 개인 맞춤형 장학금 추천 서비스

`ScholarMate`는 사용자의 학적 정보, 성적, 조건 등을 기반으로  
적합한 장학금을 자동으로 추천해주는 **웹 기반 졸업작품 프로젝트**입니다.  
프론트엔드와 백엔드를 나누어 개발하고, AWS에 배포하는 것을 목표로 합니다.

---

## 📌 주요 기능

- ✅ 장학금 조건 자동 분석 및 AI 추천
- ✅ 관심 장학금 찜 기능
- ✅ 마감일 캘린더 기능
- ✅ 제출 서류 모달 확인 기능
- ✅ JWT 기반 로그인 / 회원가입
- ✅ 커뮤니티(닉네임 기반 게시판)
- ✅ MySQL 기반 데이터 저장 및 필터링

---

## 🛠 기술 스택

| 파트        | 기술 |
|-------------|------|
| 프론트엔드  | React (Vite), Tailwind CSS, Axios |
| 백엔드      | Django, Django REST Framework, JWT |
| 데이터베이스 | MySQL (RDS) |
| 배포        | AWS EC2 (서버), Vercel (프론트), GitHub |

---

## 📁 폴더 구조

```
ScholarMate/
├── ScholarMate_frontend/     # 프론트엔드 - React + Tailwind
│   ├── public/               # 정적 파일 (index.html 등)
│   ├── src/                  # 주요 코드 (components, pages 등)
│   ├── package.json          # 프론트 의존성 설정
│   └── vite.config.js        # Vite 설정
│
└── ScholarMate_backend/      # 백엔드 - Django REST API
    ├── scholarships/         # 장학금 관련 앱
    ├── accounts/             # 사용자 인증 앱 (JWT)
    ├── community/            # 커뮤니티 게시판 앱
    ├── manage.py             # Django 명령어 실행 파일
    ├── requirements.txt      # 백엔드 의존성
    └── settings.py           # 프로젝트 설정
```

---

## 🚀 실행 방법

### 📦 프론트엔드 실행 (개발자용)

```bash
cd ScholarMate_frontend
npm install
npm run dev
```

### 🧪 백엔드 실행 (개발자용)

```bash
cd ScholarMate_backend
pip install -r requirements.txt
python manage.py runserver
```

---

## 👥 팀원

- 🧑‍💻 박해준 (프론트엔드)
- 🧑‍💻 김정민 (백엔드)

---

## 🎯 프로젝트 목표

> 사용자 맞춤형 장학금 정보를 손쉽게 제공하고,  
> 장학금 신청을 위한 관리와 준비를 한눈에 확인할 수 있는 통합 플랫폼을 개발합니다.

---

## 📷 시연 이미지 / 배포 링크 (추후 추가)

- 🔗 배포 링크: (추후 작성)
- 🖼️ 시연 캡처: (추후 이미지 추가 예정)
