# CORS 에러 완전 해결 가이드

## 🔴 문제 상황

```
Access to fetch at 'https://ai-service2-6.vercel.app/api/auth/login' 
from origin 'https://ai-service2-6-53ywb091g-ai-service2.vercel.app' 
has been blocked by CORS policy
```

**원인:** Preview 배포에서 Production API를 호출하고 있음

---

## 🔍 문제 진단

### 현재 설정 확인

```powershell
vercel env ls | findstr NEXT_PUBLIC_API_URL
```

**출력:**
```
NEXT_PUBLIC_API_URL    Encrypted    Production, Preview, Development
```

**문제:** 이 환경 변수가 모든 환경에서 프로덕션 URL로 설정되어 있음!

---

## ✅ 해결 방법

### 방법 1: PowerShell 스크립트 (가장 쉬움)

```powershell
.\remove-api-url-env.ps1
```

스크립트가 자동으로:
1. Production에서 제거
2. Preview에서 제거
3. Development에서 제거
4. 확인 메시지 표시

### 방법 2: Vercel CLI (수동)

```powershell
# Production
vercel env rm NEXT_PUBLIC_API_URL production
# Y 입력

# Preview
vercel env rm NEXT_PUBLIC_API_URL preview
# Y 입력

# Development
vercel env rm NEXT_PUBLIC_API_URL development
# Y 입력
```

### 방법 3: Vercel Dashboard (GUI)

1. **https://vercel.com/dashboard** 접속
2. 프로젝트 선택: **ai-service2-6**
3. **Settings** → **Environment Variables**
4. `NEXT_PUBLIC_API_URL` 찾기
5. **⋮ (메뉴)** → **Remove**
6. 확인

---

## 🎯 왜 제거해야 하나요?

### Before (문제 상황)

```
환경 변수: NEXT_PUBLIC_API_URL=https://ai-service2-6.vercel.app

Preview 배포 (domain-abc.vercel.app):
  Frontend → NEXT_PUBLIC_API_URL을 사용
         → https://ai-service2-6.vercel.app/api (다른 도메인!)
         → CORS 에러 🔴
```

### After (해결)

```
환경 변수: (없음)

Preview 배포 (domain-abc.vercel.app):
  Frontend → API_URL = '' (상대 경로)
         → /api → domain-abc.vercel.app/api (같은 도메인!)
         → 성공 ✅

Production (ai-service2-6.vercel.app):
  Frontend → API_URL = '' (상대 경로)
         → /api → ai-service2-6.vercel.app/api (같은 도메인!)
         → 성공 ✅
```

---

## 📋 실행 단계

### 1단계: 환경 변수 제거

선택한 방법으로 `NEXT_PUBLIC_API_URL` 제거

### 2단계: 확인

```powershell
vercel env ls | findstr NEXT_PUBLIC_API_URL
```

**예상 결과:** 아무것도 나오지 않음 ✅

### 3단계: 재배포 (자동)

Vercel이 자동으로 재배포합니다.

또는 수동으로:
```powershell
vercel --prod
```

### 4단계: 테스트

1. Preview URL 접속
2. 로그인 시도
3. ✅ CORS 에러 없음
4. ✅ 정상 작동

---

## 🔍 검증

### Chrome DevTools 확인

**F12** → **Network** 탭

**Before:**
```
Request URL: https://ai-service2-6.vercel.app/api/auth/login
Origin: https://ai-service2-6-xxx.vercel.app
Status: (failed) CORS 🔴
```

**After:**
```
Request URL: https://ai-service2-6-xxx.vercel.app/api/auth/login
Origin: https://ai-service2-6-xxx.vercel.app
Status: 200 OK ✅
```

---

## 🚨 주의사항

### 제거해도 안전한가요?

**✅ 네! 완전히 안전합니다.**

- 코드에서 상대 경로(`API_URL = ''`)를 사용
- 각 환경이 자동으로 올바른 도메인 사용
- 로컬 개발(`localhost:3000`)도 정상 작동

### 언제 NEXT_PUBLIC_API_URL이 필요한가요?

- ❌ Vercel 배포: 필요 없음 (상대 경로 사용)
- ❌ 같은 도메인: 필요 없음
- ✅ 완전히 다른 도메인의 API 사용 시에만 필요
  - 예: Frontend는 Vercel, API는 AWS

---

## 💡 코드 설명

### lib/api-client.ts

```typescript
// ❌ Before (환경 변수 사용)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
// Preview에서도 프로덕션 URL 사용 → CORS!

// ✅ After (상대 경로)
const API_URL = '';
// Preview → /api (자신의 API)
// Production → /api (자신의 API)
```

### lib/middleware.ts

```typescript
// CORS 미들웨어 추가
export function withCors(handler) {
  // Vercel 도메인 허용
  const allowedOrigins = [
    'http://localhost:3000',
    'https://ai-service2-6.vercel.app',
    /https:\/\/ai-service2-6-.*\.vercel\.app$/, // Preview
  ];
  
  // 같은 도메인이면 CORS 문제 없음!
  // 하지만 안전을 위해 헤더 추가
}
```

---

## 🎉 완료 체크리스트

- [ ] `NEXT_PUBLIC_API_URL` 환경 변수 제거
- [ ] `vercel env ls`로 확인 (없어야 함)
- [ ] Vercel 자동 재배포 완료 대기
- [ ] Preview URL에서 로그인 테스트
- [ ] Production URL에서 로그인 테스트
- [ ] CORS 에러 없음 확인
- [ ] 브라우저 DevTools Network 탭 확인

---

## 🆘 여전히 문제가 있다면?

### 1. 브라우저 캐시 클리어

```
Chrome: Ctrl+Shift+Delete → 캐시된 이미지 및 파일
```

### 2. Hard Refresh

```
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)
```

### 3. Vercel 로그 확인

```powershell
vercel logs --prod
```

### 4. 환경 변수 다시 확인

```powershell
vercel env pull .env.check
cat .env.check | findstr NEXT_PUBLIC_API_URL
# 아무것도 없어야 함
```

---

**최종 업데이트:** 2025-11-18  
**해결 완료:** ✅ 환경 변수 제거 필요






