# 히스토리 페이지 설정 가이드

## 📋 개요

사용자의 모의 면접 기록과 자기소개서 피드백을 확인할 수 있는 히스토리 페이지입니다.

**URL**: `/history`

---

## ✅ 파일 구조

### 1. 백엔드 API

**파일**: `pages/api/history/index.ts`

```typescript
// GET /api/history
// JWT 인증 필수
// 응답: { interviews: [...], coverLetters: [...] }
```

**특징:**
- ✅ JWT 토큰 검증 (`withAuth` 미들웨어)
- ✅ 사용자별 데이터 필터링
- ✅ PostgreSQL JOIN 쿼리
- ✅ 최신순 정렬

### 2. 프론트엔드 페이지

**파일**: `app/history/page.tsx`

```typescript
// 클라이언트 컴포넌트
// fetch('/api/history') 호출
// 한국어 UI
```

**특징:**
- ✅ `useEffect`로 데이터 로딩
- ✅ 로딩/에러 상태 처리
- ✅ 탭 UI (모의면접 기록 / 자기소개서 피드백)
- ✅ 클릭 시 상세 페이지 이동

---

## 🔧 404 에러 해결 방법

### 원인 1: 빌드 캐시 문제

**해결:**
```bash
# 1. .next 폴더 삭제
rm -rf .next

# 2. 재빌드
npm run build

# 3. 로컬 실행
npm run dev
```

### 원인 2: Vercel 배포 문제

**해결:**
```bash
# 1. Git 커밋 및 푸시
git add -A
git commit -m "Add history page"
git push origin main

# 2. Vercel 강제 재배포
vercel --prod --force
```

### 원인 3: 경로 불일치

**확인:**
- ✅ API 경로: `pages/api/history/index.ts` → `/api/history`
- ✅ 페이지 경로: `app/history/page.tsx` → `/history`
- ✅ fetch URL: `/api/history` (정확히 일치)

---

## 📊 데이터 흐름

```
사용자 클릭 "/history"
    ↓
app/history/page.tsx 렌더링
    ↓
useEffect 실행
    ↓
fetch('/api/history', { Authorization: Bearer TOKEN })
    ↓
pages/api/history/index.ts 실행
    ↓
withAuth 미들웨어 (JWT 검증)
    ↓
PostgreSQL 쿼리 (interviews + coverLetters)
    ↓
JSON 응답
    ↓
프론트엔드 상태 업데이트
    ↓
UI 렌더링
```

---

## 🧪 테스트 방법

### 1. 로컬 테스트

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 접속
# http://localhost:3000/history
```

**확인사항:**
1. ✅ 로그인 필요 (JWT 토큰)
2. ✅ 데이터 로딩 (로딩 스피너 표시)
3. ✅ 탭 전환 (모의면접 / 자기소개서)
4. ✅ 아이템 클릭 시 상세 페이지 이동

### 2. API 직접 테스트

```bash
# 1. 로그인하여 토큰 획득
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 2. 히스토리 조회
curl -X GET http://localhost:3000/api/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**예상 응답:**
```json
{
  "interviews": [
    {
      "id": 1,
      "status": "completed",
      "totalQuestions": 5,
      "answeredQuestions": 2,
      "statusLabel": "완료",
      "jobPosting": {
        "id": 1,
        "title": "소프트웨어 엔지니어",
        "companyName": "삼성전자"
      }
    }
  ],
  "coverLetters": [
    {
      "id": 1,
      "contentPreview": "저는...",
      "status": "Feedback Complete",
      "jobPosting": {
        "title": "소프트웨어 엔지니어",
        "companyName": "삼성전자"
      }
    }
  ]
}
```

### 3. 브라우저 개발자 도구

**Network 탭 확인:**
```
Request URL: http://localhost:3000/api/history
Request Method: GET
Status Code: 200 OK (성공) 또는 404 Not Found (실패)
```

**404 발생 시:**
- ✅ URL 철자 확인: `/api/history` (정확히)
- ✅ 파일 존재 확인: `pages/api/history/index.ts`
- ✅ 빌드 캐시 삭제 후 재시작

---

## 🔍 문제 해결

### 증상 1: 404 Not Found

**원인:**
- 파일이 없거나
- 경로가 잘못되었거나
- 빌드 캐시 문제

**해결:**
```bash
# 1. 파일 존재 확인
ls pages/api/history/index.ts
ls app/history/page.tsx

# 2. 빌드 캐시 삭제
rm -rf .next
rm -rf node_modules/.cache

# 3. 재빌드
npm run build

# 4. 로컬 실행
npm run dev
```

### 증상 2: 401 Unauthorized

**원인:**
- JWT 토큰이 없거나
- 토큰이 만료되었거나
- 로그인하지 않음

**해결:**
```typescript
// 브라우저 콘솔에서 확인
console.log(localStorage.getItem('token'));

// 토큰이 없으면 다시 로그인
window.location.href = '/login';
```

### 증상 3: 빈 목록 표시

**원인:**
- 데이터베이스에 데이터가 없음

**해결:**
1. 자기소개서 작성: `/cover-letters`
2. 모의 면접 진행: `/interview`
3. 히스토리 페이지 새로고침

---

## 📝 체크리스트

### 파일 존재 확인
- [x] `pages/api/history/index.ts` 존재
- [x] `app/history/page.tsx` 존재
- [x] Header에 `/history` 링크 추가
- [x] 홈페이지에 히스토리 카드 존재

### 기능 확인
- [ ] 로컬에서 `/history` 접속 가능
- [ ] API 호출 성공 (200 OK)
- [ ] 데이터 로딩 및 표시
- [ ] 탭 전환 작동
- [ ] 아이템 클릭 시 이동

### 배포 확인
- [ ] Git 커밋 및 푸시
- [ ] Vercel 자동 배포 성공
- [ ] 프로덕션 URL 접속 테스트

---

## 🚀 배포 절차

### 1. 로컬 빌드 테스트

```bash
npm run build
```

**성공 시:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (5/5)
✓ Finalizing page optimization

Route (app)                              Size
┌ ○ /                                    1.2 kB
├ ○ /history                             2.5 kB  ← 확인
└ ...
```

### 2. Git 커밋

```bash
git add -A
git commit -m "Add history page link to header"
git push origin main
```

### 3. Vercel 배포

**자동 배포:**
- Vercel이 자동으로 감지하고 배포

**수동 배포:**
```bash
vercel --prod --force
```

### 4. 배포 확인

```
https://your-domain.vercel.app/history
```

---

## 💡 팁

### Tip 1: 개발 중 빠른 새로고침

```bash
# .next 폴더만 삭제하고 재시작 (빠름)
rm -rf .next && npm run dev
```

### Tip 2: API 응답 확인

```javascript
// 브라우저 콘솔에서 직접 테스트
fetch('/api/history', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### Tip 3: 404 디버깅

```bash
# Next.js 라우팅 디버그 모드
DEBUG=* npm run dev
```

---

## 📚 관련 문서

- **[면접 조기 종료](./INTERVIEW_EARLY_FINISH.md)** - 조기 종료 기능 설명
- **[Prisma 스키마](./PRISMA_SCHEMA_UPDATE.md)** - 데이터베이스 스키마
- **[환경 변수](./ENVIRONMENT_VARIABLES.md)** - 환경 설정

---

**작성일:** 2025-11-18  
**버전:** 1.0  
**작성자:** AI Assistant


