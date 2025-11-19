# JWT 인증 401 오류 디버깅 가이드

## 개요

`/api/interview/start` 호출 시 발생하는 `401 Unauthorized` 오류를 해결하기 위한 종합 가이드입니다.

---

## 수정 사항 요약

### 1. **프론트엔드 (lib/api-client.ts)**

**토큰 주입 디버깅 추가:**
- `fetch` 호출 직전에 토큰 존재 여부와 형식을 확인하는 로그 추가
- 토큰이 `'null'` 문자열이거나 빈 문자열인 경우 감지

**401 에러 전역 처리:**
- 응답이 `401 Unauthorized`인 경우 자동으로:
  - `localStorage`에서 잘못된 토큰 삭제
  - 사용자에게 알림 표시
  - 로그인 페이지로 강제 리다이렉트

**주요 로그:**
```
🔑 [API Client] Endpoint: /api/interview/start
🔑 [API Client] Sending Token: eyJhbGciOiJIUzI1NiI...
✅ [API Client] Authorization header set
```

---

### 2. **백엔드 미들웨어 (lib/middleware.ts)**

**인증 미들웨어 강화:**
- `Authorization` 헤더 수신 여부 확인 로그 추가
- 토큰 추출 성공/실패 로그 추가
- 토큰 검증 후 사용자 ID 로그 추가

**주요 로그:**
```
🔒 [Backend Auth] Request URL: /api/interview/start
🔒 [Backend Auth] Authorization Header: Bearer eyJhbGciOiJIUzI1NiI...
✅ [Backend Auth] Token extracted successfully
✅ [Backend Auth] Token verified - User ID: 1
```

---

### 3. **토큰 추출 함수 (lib/auth.ts)**

**extractTokenFromHeader 개선:**
- 헤더가 `undefined`인 경우 감지
- `"Bearer "` 접두사 누락 감지
- 추출된 토큰이 `'null'` 또는 `'undefined'` 문자열인 경우 감지

**주요 로그:**
```
✅ [extractToken] Token extracted successfully
```

**에러 로그 예시:**
```
❌ [extractToken] Authorization header is undefined or empty
❌ [extractToken] Authorization header does not start with "Bearer "
❌ [extractToken] Extracted token is invalid: null
```

---

### 4. **로그인 페이지 (app/login/page.tsx)**

**로그인 프로세스 디버깅:**
- 로그인 API 호출 전후 로그 추가
- 토큰 수신 확인
- `localStorage` 저장 확인

**주요 로그:**
```
🔐 [Login] Attempting login...
✅ [Login] Login successful, received token
🔑 [Login] Token: eyJhbGciOiJIUzI1NiI...
💾 [Login] Token stored in localStorage: YES
```

---

## 디버깅 절차

### 1단계: 로그인 확인

1. **브라우저 콘솔 열기** (F12)
2. **로그인 수행**
3. **콘솔 로그 확인:**
   - `✅ [Login] Login successful` 메시지가 보이는가?
   - `💾 [Login] Token stored in localStorage: YES` 인가?

**문제 발견 시:**
- 로그인 API 응답 확인
- `result.token`이 유효한 JWT 문자열인지 확인

---

### 2단계: API 호출 확인

1. **면접 시작 시도**
2. **프론트엔드 콘솔 로그 확인:**
   ```
   🔑 [API Client] Endpoint: /api/interview/start
   🔑 [API Client] Sending Token: eyJhbGciO...
   ✅ [API Client] Authorization header set
   ```

**문제 발견 시:**
- `Sending Token: null` → localStorage에 토큰이 없음
- `Invalid token (null string or empty)` → 'null' 문자열이 저장됨
- `No token found in localStorage` → 로그인이 제대로 되지 않음

---

### 3단계: 백엔드 로그 확인

**Vercel 로그 (배포 환경):**
1. Vercel 대시보드 → 프로젝트 선택
2. **Functions** 탭 → **Logs**
3. 다음 로그 확인:
   ```
   🔒 [Backend Auth] Request URL: /api/interview/start
   🔒 [Backend Auth] Authorization Header: Bearer eyJ...
   ✅ [Backend Auth] Token extracted successfully
   ✅ [Backend Auth] Token verified - User ID: 1
   ```

**로컬 개발 환경:**
- 터미널에서 Next.js dev 서버 로그 확인

**문제 발견 시:**
- `Authorization Header: undefined` → 헤더가 전달되지 않음 (CORS 문제?)
- `Token extraction failed` → 헤더 형식이 잘못됨
- `유효하지 않은 토큰` → JWT 검증 실패 (만료, 서명 불일치 등)

---

## 일반적인 문제와 해결책

### 문제 1: 토큰이 localStorage에 없음

**원인:**
- 로그인이 제대로 완료되지 않음
- 로그인 후 페이지 새로고침 시 토큰 손실

**해결:**
1. 로그인 페이지에서 다시 로그인
2. 콘솔에서 `localStorage.getItem('token')` 확인

---

### 문제 2: 토큰이 'null' 문자열로 저장됨

**원인:**
- 백엔드에서 `null`을 반환했지만 프론트엔드가 문자열로 변환

**해결:**
1. 로그아웃 후 다시 로그인
2. 백엔드 로그인 API 확인 (`/api/auth/login`)

---

### 문제 3: CORS 문제로 Authorization 헤더가 전달되지 않음

**원인:**
- CORS preflight에서 `Authorization` 헤더 허용되지 않음

**해결:**
- `lib/middleware.ts`의 `withCors` 미들웨어 확인
- `Access-Control-Allow-Headers`에 `Authorization` 포함 확인

**현재 설정:**
```typescript
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

---

### 문제 4: JWT 서명 검증 실패

**원인:**
- `JWT_SECRET` 환경 변수가 다름
- 토큰이 다른 환경에서 생성됨

**해결:**
1. `.env.local` (로컬) 및 Vercel 환경 변수에서 `JWT_SECRET` 확인
2. 동일한 비밀키 사용 확인
3. 로그아웃 후 해당 환경에서 다시 로그인

---

## 테스트 방법

### 수동 테스트

**1. localStorage 확인:**
```javascript
// 브라우저 콘솔에서 실행
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

**2. 수동으로 API 호출:**
```javascript
const token = localStorage.getItem('token');
fetch('/api/interview/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ coverLetterId: 1 })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
```

---

## 문제 해결 체크리스트

- [ ] 로그인 시 토큰이 localStorage에 저장되는가?
- [ ] 토큰이 유효한 JWT 문자열인가? (3개의 `.`으로 구분된 부분)
- [ ] API 호출 시 `Authorization: Bearer {token}` 헤더가 설정되는가?
- [ ] 백엔드에서 `Authorization` 헤더를 수신하는가?
- [ ] 토큰 추출이 성공하는가? (`extractTokenFromHeader`)
- [ ] JWT 검증이 성공하는가? (`verifyToken`)
- [ ] `JWT_SECRET` 환경 변수가 로컬과 배포 환경에서 동일한가?

---

## 추가 참고사항

### JWT 토큰 구조
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwNjA0ODAwfQ.signature
```
- **헤더** (알고리즘, 타입)
- **페이로드** (userId, email, 발급/만료 시간)
- **서명** (비밀키로 검증)

### 토큰 만료 시간
- 현재 설정: **7일** (`expiresIn: '7d'`)
- 만료 후 자동으로 401 에러 발생
- 사용자는 다시 로그인해야 함

---

## 연락처

문제가 지속되면 다음 정보와 함께 보고해주세요:
1. 브라우저 콘솔 로그 (전체)
2. Vercel Functions 로그 (백엔드)
3. 재현 단계

