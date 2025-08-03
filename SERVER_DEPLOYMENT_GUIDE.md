# 🖥️ Casino-Club F2P 서버 배포 가이드

이 가이드는 새로 구입한 서버에 Casino-Club F2P 프로젝트를 배포하는 단계별 안내서입니다.

## 🛠️ 1. 서버 초기 설정

### 1.1 SSH 접속 설정

```bash
# 로컬에서 SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 서버에 SSH 키 복사
ssh-copy-id user@your_server_ip

# SSH로 서버 접속
ssh user@your_server_ip
```

### 1.2 기본 소프트웨어 설치

```bash
# 시스템 업데이트
sudo apt update
sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y curl wget git unzip htop vim build-essential

# 방화벽 설정
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8002  # 백엔드 API 포트
sudo ufw enable

# 시간대 설정
sudo timedatectl set-timezone Asia/Seoul
```

## 🐋 2. Docker 환경 설정

### 2.1 Docker 설치

```bash
# Docker 설치 스크립트 실행
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 설치 확인
docker --version
docker-compose --version
```

### 2.2 프로젝트 복제 및 Docker Compose 설정

```bash
# 프로젝트 복제
git clone https://github.com/heyjinjung/auto7777.git
cd auto7777

# Docker Compose 실행
cd cc-webapp
docker-compose up -d
```

## 🗄️ 3. 데이터베이스 마이그레이션

### 3.1 PostgreSQL 설정

```bash
# PostgreSQL 접속
docker exec -it cc-webapp_postgres_1 psql -U postgres

# 데이터베이스 생성
CREATE DATABASE ccf2p;
CREATE USER ccf2p_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ccf2p TO ccf2p_user;

# 테이블 생성은 애플리케이션의 마이그레이션으로 처리됨
```

### 3.2 SQLite에서 PostgreSQL로 데이터 마이그레이션

```bash
# 백엔드 디렉토리로 이동
cd backend

# 마이그레이션 실행
# 필요한 경우 가상 환경 활성화
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 환경 변수 설정
export DATABASE_URL=postgresql://ccf2p_user:secure_password@postgres:5432/ccf2p

# 데이터베이스 마이그레이션
alembic upgrade head

# SQLite 데이터 내보내기 스크립트 실행 (스크립트는 작성 필요)
python scripts/migrate_sqlite_to_postgres.py
```

## 🔒 4. HTTPS 및 보안 설정

### 4.1 Nginx 설치 및 설정

```bash
# Nginx 컨테이너 실행은 docker-compose.yml에 포함되어 있음
# Nginx 설정 파일 생성
mkdir -p nginx/conf.d
cat > nginx/conf.d/ccf2p.conf << 'EOF'
server {
    listen 80;
    server_name your_domain.com;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name your_domain.com;

    ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers EECDH+AESGCM:EDH+AESGCM;
    ssl_ecdh_curve secp384r1;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # HSTS 설정
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # 프론트엔드 서빙
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # 백엔드 API
    location /api {
        proxy_pass http://backend:8002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

### 4.2 SSL 인증서 설정

```bash
# Certbot 설치
sudo apt install -y certbot

# 인증서 발급
sudo certbot certonly --standalone -d your_domain.com

# 인증서 자동 갱신 설정
sudo certbot renew --dry-run

# 인증서 위치
sudo ls -la /etc/letsencrypt/live/your_domain.com/
```

## 🚀 5. CI/CD 파이프라인 설정

### 5.1 GitHub Actions Workflow 설정

프로젝트의 루트 디렉토리에 `.github/workflows/deploy.yml` 파일 생성:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up SSH
      uses: webfactory/ssh-agent@v0.7.0
      with:
        ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
        
    - name: Deploy to server
      run: |
        ssh -o StrictHostKeyChecking=no user@your_server_ip << 'EOF'
          cd /path/to/auto7777
          git pull
          cd cc-webapp
          docker-compose down
          docker-compose up -d --build
          
          # 추가 배포 스크립트
          # 데이터베이스 마이그레이션 등
        EOF
```

## 📊 6. 모니터링 및 로깅 설정

### 6.1 로깅 설정

```bash
# Docker 로그 설정
mkdir -p /var/log/ccf2p
chmod 755 /var/log/ccf2p

# docker-compose.yml에 로깅 설정 추가
```

### 6.2 Prometheus 및 Grafana 설정 (선택사항)

```bash
# docker-compose.yml에 Prometheus 및 Grafana 추가
# 설정 파일 생성
```

## 🔄 7. 배포 자동화 스크립트

### 7.1 배포 스크립트 작성

```bash
#!/bin/bash
# 파일명: deploy.sh

set -e

echo "Deploying Casino-Club F2P..."

# 프로젝트 디렉토리로 이동
cd /path/to/auto7777

# 최신 코드 가져오기
git pull

# 백엔드 배포
cd cc-webapp
docker-compose down
docker-compose up -d --build

# 데이터베이스 마이그레이션
docker exec cc-webapp_backend_1 alembic upgrade head

echo "Deployment completed successfully!"
```

### 7.2 스크립트 권한 설정

```bash
chmod +x deploy.sh
```

## ✅ 8. 배포 후 확인사항

- [ ] 백엔드 API 접근 가능 (`https://your_domain.com/api/health`)
- [ ] 프론트엔드 접근 가능 (`https://your_domain.com`)
- [ ] 로그 생성 확인
- [ ] 데이터베이스 연결 확인
- [ ] Redis 연결 확인
- [ ] 시스템 리소스 사용량 확인 (`htop`)

---

## 🛠️ 문제 해결

### 일반적인 문제 해결

- **백엔드 API 접근 불가**
  ```bash
  # 로그 확인
  docker logs cc-webapp_backend_1
  
  # 컨테이너 상태 확인
  docker ps -a
  ```

- **데이터베이스 연결 오류**
  ```bash
  # PostgreSQL 로그 확인
  docker logs cc-webapp_postgres_1
  
  # PostgreSQL 직접 접속
  docker exec -it cc-webapp_postgres_1 psql -U postgres
  ```

- **HTTPS 인증서 문제**
  ```bash
  # Nginx 로그 확인
  docker logs cc-webapp_nginx_1
  
  # SSL 인증서 상태 확인
  sudo certbot certificates
  ```

## 📝 추가 참고사항

- 배포 전 항상 테스트 환경에서 먼저 테스트
- 중요 데이터는 정기적으로 백업
- 환경별(개발, 스테이징, 프로덕션) 설정 분리 유지
- 시스템 업데이트 정기적 수행
