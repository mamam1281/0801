# 🖼️ 이미지 처리 가이드 - Next.js + Casino-Club F2P

## 📋 개요
Next.js에서 이미지를 효율적으로 사용하는 방법들을 설명합니다.

---

## 🎯 이미지 추가 방법

### 1. **로컬 이미지 (추천)**

#### A. `public` 폴더에 이미지 저장
```
cc-webapp/frontend/public/
├── images/
│   ├── games/
│   │   ├── slot-thumbnail.jpg
│   │   ├── rps-thumbnail.jpg
│   │   ├── gacha-thumbnail.jpg
│   │   └── crash-thumbnail.jpg
│   ├── avatars/
│   │   ├── user-default.png
│   │   └── vj-luna.jpg
│   └── icons/
│       ├── gold-icon.png
│       └── diamond-icon.png
```

#### B. Next.js Image 컴포넌트 사용 (최적화)
```tsx
import Image from 'next/image';

// 게임 썸네일
<Image
  src="/images/games/slot-thumbnail.jpg"
  alt="네온 슬롯 게임"
  width={400}
  height={300}
  className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
/>

// VJ 프로필 이미지
<Image
  src="/images/avatars/vj-luna.jpg"
  alt="VJ Luna"
  width={400}
  height={600}
  className="w-full h-full object-cover"
  priority // 중요한 이미지는 우선 로딩
/>
```

#### C. 일반 img 태그 (현재 방식)
```tsx
<img 
  src="/images/games/slot-thumbnail.jpg"
  alt="네온 슬롯 게임"
  className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
/>
```

---

### 2. **외부 이미지 (Unsplash, CDN)**

#### A. 현재 코드에서 사용하는 방식
```tsx
// StreamingScreen.tsx에서 사용 중
const VIDEO_GALLERY = [
  {
    thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
    // ...
  }
];

<img 
  src={video.thumbnail} 
  alt={video.title}
  className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
/>
```

#### B. Next.js Image with external URLs
```tsx
// next.config.ts에 도메인 추가 필요
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'your-cdn.com']
  }
};

// 컴포넌트에서 사용
<Image
  src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop"
  alt="게임 썸네일"
  width={400}
  height={300}
  className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
/>
```

---

### 3. **동적 이미지 (base64, Blob)**

```tsx
// 사용자 업로드 이미지
const [imagePreview, setImagePreview] = useState<string>('');

const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

<img 
  src={imagePreview || '/images/default-thumbnail.jpg'}
  alt="업로드된 이미지"
  className="w-full h-32 object-cover"
/>
```

---

## 🎮 Casino-Club 프로젝트 적용 예시

### 1. **GameDashboard.tsx 개선**

```tsx
// 현재 코드 개선
const games: GameStats[] = [
  {
    id: 'slot',
    name: '네온 슬롯',
    type: 'slot',
    icon: Dice1,
    color: 'from-primary to-primary-light',
    thumbnail: '/images/games/neon-slot.jpg', // 👈 썸네일 추가
    // ...
  },
  {
    id: 'gacha',
    name: '가챠 뽑기', 
    type: 'gacha',
    icon: Gift,
    color: 'from-error to-warning',
    thumbnail: '/images/games/gacha-system.jpg', // 👈 썸네일 추가
    // ...
  }
];

// 게임 카드에 썸네일 추가
<motion.div className="glass-effect rounded-2xl p-6 relative overflow-hidden">
  {/* 게임 썸네일 */}
  <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
    <img 
      src={game.thumbnail}
      alt={game.name}
      className="w-full h-full object-cover rounded-lg"
    />
  </div>
  
  {/* 기존 게임 아이콘 */}
  <div className={`w-16 h-16 bg-gradient-to-r ${game.color} rounded-xl flex items-center justify-center relative z-10`}>
    <game.icon className="w-8 h-8 text-white" />
  </div>
  
  {/* ... 나머지 콘텐츠 */}
</motion.div>
```

### 2. **StreamingScreen.tsx 개선**

```tsx
// 현재 코드를 Next.js Image로 최적화
import Image from 'next/image';

// VJ 프로필 이미지
<div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-400">
  <Image 
    src="/images/avatars/vj-luna.jpg" // 로컬 이미지로 변경
    alt={EXCLUSIVE_VJ.name}
    width={64}
    height={64}
    className="w-full h-full object-cover"
    priority
  />
</div>

// 영상 썸네일
<div className="relative overflow-hidden">
  <Image 
    src={video.thumbnail} 
    alt={video.title}
    width={400}
    height={200}
    className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
    placeholder="blur"
    blurDataURL="/images/placeholder-blur.jpg"
  />
</div>
```

---

## 📁 추천 폴더 구조

```
cc-webapp/frontend/public/images/
├── games/                    # 게임 관련 이미지
│   ├── slot/
│   │   ├── thumbnail.jpg
│   │   ├── reel-symbols/
│   │   └── backgrounds/
│   ├── rps/
│   ├── gacha/
│   └── crash/
├── avatars/                  # 사용자/VJ 아바타
│   ├── default-user.png
│   ├── vj-luna.jpg
│   └── placeholder.jpg
├── ui/                       # UI 요소
│   ├── icons/
│   ├── badges/
│   └── decorations/
├── backgrounds/              # 배경 이미지
│   ├── casino-bg.jpg
│   ├── neon-grid.png
│   └── particles.svg
└── placeholders/             # 플레이스홀더
    ├── image-loading.gif
    └── blur-placeholder.jpg
```

---

## 🔧 실제 적용 코드

### 1. **이미지 폴더 생성 및 추가**

```bash
# 폴더 생성
mkdir -p cc-webapp/frontend/public/images/{games,avatars,ui,backgrounds,placeholders}

# 게임별 폴더
mkdir -p cc-webapp/frontend/public/images/games/{slot,rps,gacha,crash}
```

### 2. **next.config.ts 설정**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'your-cdn-domain.com'
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
```

### 3. **이미지 상수 정의**

```tsx
// constants/images.ts
export const GAME_IMAGES = {
  slot: {
    thumbnail: '/images/games/slot/thumbnail.jpg',
    background: '/images/games/slot/neon-background.jpg',
    symbols: [
      '/images/games/slot/symbols/cherry.png',
      '/images/games/slot/symbols/diamond.png',
      '/images/games/slot/symbols/seven.png',
    ]
  },
  gacha: {
    thumbnail: '/images/games/gacha/thumbnail.jpg',
    box: '/images/games/gacha/mystery-box.png',
    sparkles: '/images/games/gacha/sparkles.gif'
  }
};

export const VJ_IMAGES = {
  luna: {
    profile: '/images/avatars/vj-luna.jpg',
    stream: '/images/avatars/luna-streaming.jpg'
  }
};
```

---

## 🎯 최적화 팁

### 1. **이미지 압축**
- **WebP 형식** 사용 (50% 작은 파일 크기)
- **적절한 해상도**: 썸네일은 400x300px 정도
- **압축 도구**: TinyPNG, ImageOptim

### 2. **로딩 성능**
```tsx
// 중요한 이미지는 우선 로딩
<Image priority src="..." />

// 레이지 로딩 (기본값)
<Image loading="lazy" src="..." />

// 플레이스홀더 사용
<Image 
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,..."
  src="..."
/>
```

### 3. **반응형 이미지**
```tsx
<Image
  src="/images/game-hero.jpg"
  alt="Casino Game"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  fill
  className="object-cover"
/>
```

---

## 💡 추천 접근법

**Casino-Club 프로젝트의 경우:**

1. **로컬 이미지 사용**: 게임 아이콘, UI 요소
2. **CDN/Unsplash**: 개발 단계에서 임시 이미지
3. **Next.js Image**: 성능 최적화가 필요한 모든 이미지
4. **일반 img**: 간단한 아이콘이나 SVG

현재 코드에서 `src={video.thumbnail}`과 같이 사용하는 방식은 **개발 단계에서는 완벽**하며, 나중에 실제 이미지로 교체하면 됩니다! 🎯
