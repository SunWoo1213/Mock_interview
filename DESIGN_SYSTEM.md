# 🎨 2025 Modern SaaS 디자인 시스템

## 색상 팔레트

### Primary Colors (Zinc Scale)
```css
/* 배경 */
bg-zinc-50    /* 전역 배경 */
bg-zinc-100   /* 호버 배경 */

/* 카드 & 컨테이너 */
bg-white      /* 카드 배경 */

/* 텍스트 */
text-zinc-900 /* 제목, 중요 텍스트 */
text-zinc-700 /* 본문 텍스트 */
text-zinc-600 /* 라벨 */
text-zinc-500 /* 부제목, 설명 */

/* 테두리 */
border-zinc-200 /* 기본 테두리 */
border-zinc-300 /* 호버 테두리 */
```

### Accent Colors
```css
/* 성공 */
bg-green-50, text-green-700, border-green-300

/* 경고 */
bg-yellow-50, text-yellow-700, border-yellow-200

/* 정보 */
bg-blue-50, text-blue-700, border-blue-200

/* 강조 */
bg-purple-50, text-purple-700, border-purple-200

/* 에러 */
bg-red-50, text-red-700, border-red-200

/* 주황 */
bg-orange-50, text-orange-700, border-orange-300
```

## 타이포그래피

### Font Family
```css
font-family: var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif;
```

### Font Sizes
```css
/* Headings */
text-4xl   /* Page Title (36px) */
text-3xl   /* Section Title (30px) */
text-2xl   /* Card Title (24px) */
text-xl    /* Subtitle (20px) */
text-lg    /* Large Body (18px) */

/* Body */
text-base  /* Normal Text (16px) */
text-sm    /* Small Text (14px) */
text-xs    /* Extra Small (12px) */
```

### Font Weights
```css
font-bold      /* 700 - Titles */
font-semibold  /* 600 - Subtitles */
font-medium    /* 500 - Buttons, Labels */
font-normal    /* 400 - Body Text */
```

## 간격 (Spacing)

### Padding
```css
p-2   /* 8px  - Tight */
p-3   /* 12px - Compact */
p-4   /* 16px - Standard */
p-6   /* 24px - Card */
p-8   /* 32px - Large Card */
```

### Gap
```css
gap-2  /* 8px  - Tight */
gap-3  /* 12px - Compact */
gap-4  /* 16px - Standard */
gap-6  /* 24px - Sections */
gap-8  /* 32px - Large Sections */
```

### Margin
```css
mb-2   /* 8px  - Tight */
mb-3   /* 12px - Compact */
mb-4   /* 16px - Standard */
mb-6   /* 24px - Section */
mb-8   /* 32px - Large Section */
```

## 둥글기 (Border Radius)

```css
rounded-lg    /* 8px  - Buttons, Inputs */
rounded-xl    /* 12px - Small Cards */
rounded-2xl   /* 16px - Cards (권장) */
rounded-3xl   /* 24px - Hero Sections */
rounded-full  /* 9999px - Pills, Badges */
```

## 그림자 (Shadows)

```css
shadow-sm     /* 기본 카드 그림자 */
shadow-md     /* 호버 시 */
shadow-lg     /* 모달, 드롭다운 */
```

## 호버 효과

```css
/* 카드 */
hover:shadow-md hover:-translate-y-1 transition-all duration-300

/* 버튼 */
hover:bg-zinc-800 active:scale-95 transition-all

/* 링크 */
hover:bg-zinc-100 rounded-full transition-all
```

## 컴포넌트 패턴

### Primary Button
```jsx
<button className="px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg font-medium shadow-sm active:scale-95 transition-all">
  버튼 텍스트
</button>
```

### Secondary Button
```jsx
<button className="px-4 py-2 bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-sm transition-all">
  버튼 텍스트
</button>
```

### Input Field
```jsx
<input
  type="text"
  className="w-full h-10 rounded-lg border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 focus:outline-none transition-all text-zinc-900 border"
  placeholder="입력하세요"
/>
```

### Textarea
```jsx
<textarea
  className="w-full rounded-lg border-zinc-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 focus:outline-none transition-all text-zinc-900 resize-none border"
  rows={5}
  placeholder="내용을 입력하세요"
/>
```

### Card (Standard)
```jsx
<div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
  <h3 className="text-2xl font-bold text-zinc-900 mb-3">제목</h3>
  <p className="text-zinc-500 mb-4">설명 텍스트</p>
  {/* Content */}
</div>
```

### Card (Bento Grid - Large)
```jsx
<div className="md:col-span-2 p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
  <div className="text-5xl mb-4">🎤</div>
  <h3 className="text-3xl font-bold mb-3 text-zinc-900">큰 카드 제목</h3>
  <p className="text-base text-zinc-500 mb-6 leading-relaxed">
    상세 설명 텍스트
  </p>
  {/* Content */}
</div>
```

### Header (Glassmorphism)
```jsx
<header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-zinc-200/50">
  <nav className="max-w-7xl mx-auto px-4 py-4">
    {/* Navigation Items */}
  </nav>
</header>
```

### Alert Success
```jsx
<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
  <p className="text-green-700">성공 메시지</p>
</div>
```

### Alert Error
```jsx
<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
  <p className="text-red-700">에러 메시지</p>
</div>
```

### Loading Spinner
```jsx
<div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-zinc-900" />
```

### Badge / Pill
```jsx
<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
  완료
</span>
```

## 애니메이션

### Fade In
```css
.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Hover Lift
```css
hover:-translate-y-1 transition-all duration-300
```

### Active Press
```css
active:scale-95 transition-all
```

## 반응형 브레이크포인트

```css
/* Mobile First */
/* base: < 768px (Mobile) */
md:   /* ≥ 768px (Tablet) */
lg:   /* ≥ 1024px (Desktop) */
xl:   /* ≥ 1280px (Large Desktop) */
2xl:  /* ≥ 1536px (Extra Large) */
```

## 레이아웃 패턴

### Bento Grid (3 Columns)
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
  <div className="md:col-span-2">{/* Large Card */}</div>
  <div>{/* Small Card */}</div>
  <div>{/* Small Card */}</div>
  <div className="md:col-span-2">{/* Large Card */}</div>
</div>
```

### Two Column Split
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div>{/* Left Column */}</div>
  <div>{/* Right Column */}</div>
</div>
```

### Centered Container
```jsx
<div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
  {/* Content */}
</div>
```

## 사용 가이드라인

### ✅ DO (권장)
- Zinc 계열 색상 사용
- `rounded-2xl` 카드 사용
- `shadow-sm` + `hover:shadow-md` 조합
- `transition-all duration-300` 사용
- `active:scale-95` 버튼 피드백
- `bg-zinc-50` 전역 배경
- Inter 폰트 사용

### ❌ DON'T (지양)
- 완전한 검정/흰색 배경 (bg-black, bg-white)
- Gray 계열 대신 Zinc 계열 사용
- 날카로운 모서리 (rounded-sm, rounded)
- 과도한 그림자 (shadow-xl, shadow-2xl)
- 다크 모드 스타일 (bg-gray-900 등)
- 너무 밝거나 진한 색상

## 접근성

- **색상 대비**: WCAG AA 기준 준수 (최소 4.5:1)
- **포커스 상태**: `focus:ring-2 focus:ring-zinc-900` 명확하게 표시
- **호버 피드백**: 모든 클릭 가능한 요소에 호버 효과
- **텍스트 크기**: 최소 14px (text-sm) 이상 사용

---

**버전**: 2.0  
**최종 업데이트**: 2025년 11월 20일

