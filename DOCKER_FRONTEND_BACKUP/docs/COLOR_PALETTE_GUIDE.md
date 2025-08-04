# 🎨 **Casino Club 컬러 팔레트 가이드**

> 게임 UI 디자인 참고 이미지에서 추출한 Tailwind CSS 컬러 값 정리

---

## 📱 **1번 이미지: 코인 토스 게임 스타일**

### **배경 & 기본 색상**
```css
/* 메인 배경 그라디언트 */
bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900

/* 카드/컨테이너 배경 */
bg-purple-600
bg-purple-700/80

/* 기본 텍스트 */
text-white
text-blue-300
text-purple-200
```

### **액션 요소**
```css
/* 메인 버튼 */
bg-blue-500 hover:bg-blue-600
bg-purple-600 hover:bg-purple-700

/* 코인/원형 요소 */
bg-blue-500
border-blue-400

/* 베팅 컨트롤 */
bg-purple-600/50
text-white
```

---

## 🎰 **2번 이미지: 멀티 게임 허브 스타일**

### **멀티플라이어 섹션**
```css
/* 높은 배수 (위험) */
bg-red-500
bg-red-600
text-red-100

/* 중간 배수 (황금) */
bg-yellow-500
bg-amber-500
text-yellow-100

/* 안전 배수 (파랑) */
bg-blue-500
bg-blue-600
text-blue-100

/* 성공/획득 (녹색) */
bg-green-500
bg-emerald-600
text-green-100
```

### **메인 UI 요소**
```css
/* 배경 그라디언트 */
bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800

/* 메인 액션 버튼 */
bg-purple-500 hover:bg-purple-600
bg-gradient-to-r from-purple-600 to-indigo-600

/* 서브 게임 카드 */
bg-purple-600/80
bg-green-600/80
```

### **텍스트 색상**
```css
/* 멀티플라이어 표시 */
text-yellow-300
text-yellow-400
font-bold

/* 게임 타이틀 */
text-white
text-purple-100
```

---

## 🏆 **3번 이미지: 보상 시스템 스타일**

### **보상 카드 종류별**
```css
/* 프리벳 카드 (파랑) */
bg-blue-600
bg-blue-700/90
border-blue-400

/* 프리미엄 기능 (보라) */
bg-purple-600
bg-purple-700/90
border-purple-400

/* 에어드롭 (회색) */
bg-gray-800
bg-gray-700/90
border-gray-500
```

### **상태 표시**
```css
/* 활성/획득 가능 */
bg-green-500
text-green-100
border-green-400

/* 진행 중 */
bg-blue-500
text-blue-100
border-blue-400

/* 곧 출시 */
bg-gray-600
text-gray-200
border-gray-400
```

### **아이콘 & 액센트**
```css
/* 아이콘 색상 */
text-blue-400    /* 정보 아이콘 */
text-purple-400  /* 프리미엄 아이콘 */
text-yellow-400  /* 포인트/토큰 */
text-green-400   /* 성공 아이콘 */

/* Get 버튼 */
bg-blue-500 hover:bg-blue-600
text-white
```

---

## 🎯 **통합 컬러 시스템**

### **Primary Colors (메인 색상)**
```css
/* 브랜드 컬러 */
bg-purple-900    /* 메인 배경 */
bg-purple-600    /* 카드 배경 */
bg-purple-500    /* 버튼 기본 */

/* 액션 컬러 */
bg-blue-500      /* 주요 액션 */
bg-indigo-600    /* 보조 액션 */
```

### **Accent Colors (강조 색상)**
```css
/* 성공/획득 */
bg-green-500
bg-emerald-600

/* 위험/높은 배수 */
bg-red-500
bg-red-600

/* 경고/주의 */
bg-yellow-500
bg-amber-500

/* 포인트/보상 */
bg-yellow-400
bg-amber-400
```

### **Neutral Colors (중성 색상)**
```css
/* 배경 */
bg-gray-900
bg-gray-800

/* 텍스트 */
text-white       /* 메인 텍스트 */
text-gray-300    /* 보조 텍스트 */
text-gray-400    /* 비활성 텍스트 */
text-gray-500    /* 힌트 텍스트 */
```

---

## 🌈 **그라디언트 조합**

### **배경용 그라디언트**
```css
/* 메인 배경 */
bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900
bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800

/* 카드 배경 */
bg-gradient-to-r from-purple-600 to-indigo-600
bg-gradient-to-r from-blue-600 to-purple-600

/* 버튼 배경 */
bg-gradient-to-r from-purple-500 to-blue-500
bg-gradient-to-r from-blue-500 to-indigo-500
```

### **특수 효과용**
```css
/* 네온 글로우 효과 */
shadow-lg shadow-purple-500/50
shadow-lg shadow-blue-500/50
shadow-lg shadow-yellow-500/50

/* 호버 효과 */
hover:scale-105
hover:shadow-xl hover:shadow-purple-500/30
```

---

## 💡 **사용 가이드라인**

### **게임 요소별 권장 색상**
```css
/* 멀티플라이어 */
x1.0-1.5: bg-blue-500     /* 안전 */
x1.6-2.0: bg-yellow-500   /* 중간 */
x2.1-3.0: bg-orange-500   /* 위험 */
x3.0+:    bg-red-500      /* 고위험 */

/* 버튼 위계 */
Primary:   bg-purple-600  /* 메인 액션 */
Secondary: bg-blue-500    /* 보조 액션 */
Success:   bg-green-500   /* 성공/확인 */
Warning:   bg-yellow-500  /* 경고 */
Danger:    bg-red-500     /* 위험/삭제 */
```

### **텍스트 가독성**
```css
/* 어두운 배경 위 */
text-white       /* 메인 텍스트 */
text-gray-300    /* 보조 텍스트 */
text-yellow-400  /* 강조 텍스트 (포인트) */

/* 컬러 배경 위 */
text-white       /* 모든 컬러 배경에 안전 */
text-gray-100    /* 약간 부드러운 느낌 */
```

---

## 🔧 **실제 적용 예시**

### **게임 카드 컴포넌트**
```tsx
<div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-xl">
  <h3 className="text-white font-bold">룰렛 게임</h3>
  <p className="text-purple-100">최대 x2.5 배수</p>
  <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg">
    플레이
  </button>
</div>
```

### **보상 카드 컴포넌트**
```tsx
<div className="bg-blue-600/90 border border-blue-400 p-4 rounded-xl">
  <div className="text-blue-400 mb-2">🎁</div>
  <h4 className="text-white font-semibold">일일 보너스</h4>
  <p className="text-blue-100 text-sm">1000 토큰 획득</p>
  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
    Get
  </button>
</div>
```

### **멀티플라이어 표시**
```tsx
<div className="bg-red-500 text-white font-bold px-3 py-1 rounded-full">
  x3.2
</div>
<div className="bg-yellow-500 text-white font-bold px-3 py-1 rounded-full">
  x2.1
</div>
<div className="bg-blue-500 text-white font-bold px-3 py-1 rounded-full">
  x1.5
</div>
```
