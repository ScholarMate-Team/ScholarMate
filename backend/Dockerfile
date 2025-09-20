# 사용할 베이스 이미지를 지정합니다.
# 공식 파이썬 이미지 중 경량화된 버전(slim)을 사용합니다.
FROM python:3.11-slim

# 컨테이너 내부의 작업 디렉토리를 설정합니다.
# 앞으로 실행되는 모든 명령어는 이 디렉토리에서 이루어집니다.
WORKDIR /app

# 파이썬 의존성을 설치하기 전에, 운영체제에 필요한 패키지를 설치합니다.
# `libpq-dev`는 PostgreSQL 연결에 필요하며, `build-essential`은 컴파일에 필요합니다.
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 로컬의 requirements.txt 파일을 컨테이너의 /app 디렉토리로 복사합니다.
COPY requirements.txt .

# 복사한 requirements.txt를 사용하여 필요한 파이썬 패키지를 설치합니다.
# `--no-cache-dir`은 설치 후 캐시를 삭제하여 이미지 크기를 줄입니다.
RUN pip install --no-cache-dir -r requirements.txt

# 프로젝트의 모든 소스 코드를 컨테이너의 /app 디렉토리로 복사합니다.
COPY . .

# Gunicorn 서버가 사용할 포트를 외부에 노출하도록 설정합니다.
# Docker Compose에서 포트 매핑을 할 예정이므로 `EXPOSE`는 필수는 아닙니다.
EXPOSE 8000

# 컨테이너가 시작될 때 실행될 기본 명령어를 지정합니다.
# 여기서는 Django 서버를 구동하는 Gunicorn 명령어를 사용합니다.
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "ScholarMate_backend.wsgi"]