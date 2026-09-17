# 면접 시작 기능 디버깅 가이드

## 📋 개요
면접 시작 기능이 작동하지 않을 때 확인해야 할 사항과 해결 방법을 정리한 문서입니다.

## 🔍 로깅 강화 완료

### 백엔드 (`pages/api/interview/start.ts`)
다음 정보를 상세하게 로깅합니다:

**0단계: 요청 정보**
- Request Method
- Request Body (전체)
- Authorization Header 존재 여부

**1단계: JWT 인증**
- Authorization Header 상태
- Token 추출 결과
- JWT 검증 결과 (userId)

**2단계: 요청 본문 검증**
- Body Keys
- coverLetterId (raw value & type)
- 검증 성공/실패

**3단계: 랜덤 목소리 선택**
- 사용 가능한 목소리 목록
- 선택된 목소리

**4단계: DB 세션 생성**
- Insert Parameters (userId, coverLetterId, job_posting_id, voice)
- 생성된 Session ID

**에러 처리**
- Error Name, Message, Code, Detail
- PostgreSQL specific info (column, table, constraint)
- Full Error Object (JSON)
- Stack Trace

### 프론트엔드 (`app/interview/page.tsx`, `lib/api-client.ts`)

**페이지 레벨:**
- coverLetterId 선택 상태
- coverLetterId type
- API 호출 전 전송 데이터
- API 응답 데이터 (sessionId, voice, turnNumber, etc.)
- 에러 발생 시 상세 정보

**API Client 레벨:**
- startInterview 호출 시 파라미터
- Payload 직렬화 결과
- 응답 수신 확인

## 🔧 API 페이로드 확인

### 백엔드가 요구하는 것
```json
{
  "coverLetterId": 123
}
```

### 백엔드가 **요구하지 않는** 것
- ❌ `voice` (랜덤으로 선택됨)
- ❌ `jobPostingId` (자소서에서 자동으로 가져옴)

### 프론트엔드가 전송하는 것
```typescript
await apiClient.startInterview(coverLetterId);
// → { coverLetterId: number }
```

## 🗃️ DB 스키마 확인

### `interview_sessions` 테이블에 `voice` 컬럼 필요

**스키마 정의 (`database/schema.sql`):**
```sql
voice VARCHAR(20) DEFAULT 'nova'
```

### 마이그레이션 실행 방법

**옵션 1: SQL 직접 실행**
```bash
node scripts/run-add-voice-column.js
```

**옵션 2: SQL 파일 확인**
```sql
-- database/migrations/add-voice-column.sql
-- 이 파일을 PostgreSQL에서 실행하면:
-- 1. voice 컬럼이 없으면 추가
-- 2. 기존 레코드에 기본값('nova') 설정
-- 3. 컬럼 확인 쿼리 실행
```

**옵션 3: 전체 스키마 재적용**
```bash
# 개발 환경
psql -U postgres -d your_database -f database/schema.sql

# 또는 Node.js 스크립트 사용
node scripts/init-db.js
```

## 🐛 디버깅 체크리스트

### 1. 브라우저 개발자 콘솔 확인
```
🎬 [Frontend] ========== 면접 시작 요청 ==========
🎬 [Frontend] coverLetterId: 123
🎬 [Frontend] coverLetterId type: number
📤 [Frontend] API 호출 시작...
📤 [Frontend] 전송 데이터: { coverLetterId: 123 }
🌐 [API Client] startInterview called
🌐 [API Client] Parameter - coverLetterId: 123
🌐 [API Client] Payload: {"coverLetterId":123}
✅ [Frontend] API 응답 수신:
   - sessionId: 456
   - voice: echo
   - turnNumber: 1
```

### 2. 서버 로그 확인 (Vercel/터미널)
```
📥 [Interview Start] ========== 요청 수신 ==========
📥 [Interview Start] Request Body: { "coverLetterId": 123 }
🔒 [Interview Start] ========== 인증 시작 ==========
✅ [Interview Start] JWT verified successfully, userId: 789
📋 [Interview Start] ========== 요청 본문 검증 시작 ==========
✅ [Interview Start] coverLetterId validated: 123
🎤 [Interview Start] ========== 랜덤 목소리 선택 ==========
✅ [Interview Start] 랜덤 선택된 면접관 목소리: echo
💾 [Interview Start] ========== DB 세션 생성 ==========
✅ [Interview Start] Session created successfully!
```

### 3. 일반적인 에러와 해결 방법

#### 에러: `coverLetterId가 필요합니다.`
**원인:** coverLetterId가 전송되지 않음
**확인:**
- 프론트엔드에서 자소서를 선택했는지
- `coverLetterId` state가 올바르게 설정되었는지

#### 에러: `토큰이 만료되었습니다.`
**원인:** JWT 토큰 만료
**해결:** 다시 로그인

#### 에러: `column "voice" of relation "interview_sessions" does not exist`
**원인:** DB에 voice 컬럼이 없음
**해결:** 
```bash
node scripts/run-add-voice-column.js
```

#### 에러: `자기소개서를 찾을 수 없습니다.`
**원인:** 
- coverLetterId가 잘못됨
- 다른 사용자의 자소서 ID를 사용
**해결:** 올바른 자소서 선택

## 📊 정상 작동 시 흐름

1. **사용자**: 자소서 선택
2. **프론트엔드**: `startInterview(coverLetterId)` 호출
3. **API Client**: `POST /api/interview/start` with `{ coverLetterId }`
4. **백엔드**:
   - JWT 검증 ✓
   - coverLetterId 검증 ✓
   - 자소서 + 공고 조회 ✓
   - 랜덤 목소리 선택 (예: 'echo') ✓
   - DB 세션 생성 (voice='echo') ✓
   - 첫 질문 생성 ✓
   - TTS 음성 생성 ✓
   - S3 업로드 ✓
   - 첫 턴 저장 ✓
5. **응답**: `{ sessionId, voice, turnNumber, questionText, questionAudioUrl }`
6. **프론트엔드**: InterviewPage 컴포넌트로 전환

## 🚀 변경 사항 요약

### 코드 변경
- ✅ 백엔드: 상세한 로깅 추가 (요청, 인증, 검증, DB, 에러)
- ✅ 프론트엔드: 전송 데이터 및 응답 로깅 추가
- ✅ API Client: 파라미터 및 페이로드 로깅 추가

### 확인된 사항
- ✅ `voice` 컬럼이 `database/schema.sql`에 정의되어 있음
- ✅ 마이그레이션 스크립트 (`database/migrations/add-voice-column.sql`) 존재
- ✅ 프론트엔드는 `coverLetterId`만 전송 (올바름)
- ✅ 백엔드는 `voice`를 랜덤 선택 (올바름)
- ✅ 에러 핸들링 완벽하게 구현됨

## 📝 다음 단계

1. **로컬 테스트:**
   ```bash
   npm run dev
   # 면접 시작 버튼 클릭
   # 브라우저 콘솔과 터미널 로그 확인
   ```

2. **DB 마이그레이션 (필요 시):**
   ```bash
   node scripts/run-add-voice-column.js
   ```

3. **배포:**
   ```bash
   git add .
   git commit -m "feat: enhance interview start debugging with comprehensive logging"
   git push
   ```

4. **Vercel 로그 확인:**
   - Vercel Dashboard → Project → Functions 탭
   - `/api/interview/start` 함수의 로그 확인

## 🔗 관련 파일

- `pages/api/interview/start.ts` - 백엔드 API
- `app/interview/page.tsx` - 면접 시작 페이지
- `lib/api-client.ts` - API 클라이언트
- `database/schema.sql` - DB 스키마
- `database/migrations/add-voice-column.sql` - Voice 컬럼 마이그레이션
- `scripts/run-add-voice-column.js` - 마이그레이션 실행 스크립트

---

**작성일:** 2024-11-19  
**버전:** 1.0  
**상태:** ✅ 로깅 강화 완료, 테스트 대기 중

