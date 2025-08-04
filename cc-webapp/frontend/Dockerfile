FROM node:18-alpine
WORKDIR /app

# 의존성 설치
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# 소스코드 복사
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV development

EXPOSE 3000
ENV PORT 3000

# 개발 모드로 실행
CMD ["npm", "run", "dev"]
