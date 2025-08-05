FROM node:20-alpine AS base
# 기본 Next.js 빌드 환경 설정
WORKDIR /app

# 의존성 설치 단계
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --production

# 빌드 단계
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# .env.production 파일이 있으면 사용
RUN if [ -f .env.production ]; then cp .env.production .env; fi

# 프로덕션 빌드
RUN npm run build

# 프로덕션 이미지
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 필요한 파일만 복사하여 이미지 크기 최소화
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Standalone 모드 지원
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 포트 노출
EXPOSE 3000

ENV PORT 3000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ > /dev/null 2>&1 || exit 1

# 서버 시작
CMD ["node", "server.js"]
