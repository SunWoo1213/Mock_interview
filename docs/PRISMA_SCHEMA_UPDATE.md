# Prisma 스키마 업데이트 가이드

## 📋 개요

코드베이스 전체와 완전히 동기화된 Prisma 스키마입니다. 면접 조기 종료 기능, 사용자 프로필, API 라우트의 모든 데이터 구조를 반영합니다.

**업데이트 날짜**: 2025-11-18  
**버전**: 2.4 (Early Finish + Full Context Support)

---

## ✨ 주요 개선사항

### 1. ✅ InterviewSessionStatus Enum 추가

```prisma
enum InterviewSessionStatus {
  PENDING      @map("pending")      // 대기 중
  IN_PROGRESS  @map("in_progress")  // 진행 중
  COMPLETED    @map("completed")    // 완료 (정상 완료 또는 조기 종료)
  CANCELLED    @map("cancelled")    // 취소됨
}
```

**장점:**
- ✅ 타입 안정성 향상
- ✅ IDE 자동완성 지원
- ✅ 오타 방지
- ✅ 명확한 상태 값

---

### 2. ✅ UserProfile 모델 상세 주석 추가

```prisma
model UserProfile {
  // 기본 정보
  age              Int?                                    // 나이
  gender           String?  @db.VarChar(20)                // 성별
  currentJob       String?  @map("current_job") @db.VarChar(200)      // 현재 직업
  careerSummary    String?  @map("career_summary") @db.Text           // 경력 요약
  certifications   String?  @db.Text                       // 자격증
  
  // 상세 정보 (JSON 형태)
  careerJson       Json     @default("[]") @map("career_json") @db.JsonB
  educationJson    Json     @default("[]") @map("education_json") @db.JsonB
  certificatesJson Json     @default("[]") @map("certificates_json") @db.JsonB
  skillsJson       Json     @default("[]") @map("skills_json") @db.JsonB
  
  // 인덱스
  @@index([userId])
  @@index([currentJob])  // 직업별 검색 최적화
}
```

**개선 사항:**
- ✅ 모든 필드에 설명 추가
- ✅ JSON 필드의 예시 구조 문서화
- ✅ 인덱스 추가 (검색 성능 향상)
- ✅ 면접 질문 생성 시 컨텍스트 사용 명시

---

### 3. ✅ InterviewSession 모델 강화

```prisma
model InterviewSession {
  // 상태 관리 (Enum 사용)
  status            InterviewSessionStatus @default(PENDING)
  totalQuestions    Int       @default(5) @map("total_questions")
  
  // 피드백 (조기 종료 메타데이터 포함)
  finalFeedbackJson Json?     @map("final_feedback_json") @db.JsonB
  // {"overall_feedback": "...", "per_turn_feedback": [...], 
  //  "is_early_finish": true, "total_questions_answered": 2}
  
  // 타임스탬프
  startedAt         DateTime? @map("started_at")
  completedAt       DateTime? @map("completed_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @default(now()) @updatedAt @map("updated_at")
  
  // 인덱스 (검색 성능 향상)
  @@index([userId])
  @@index([status])
  @@index([coverLetterId])
  @@index([jobPostingId])
}
```

**개선 사항:**
- ✅ `status`를 Enum으로 변경 (타입 안정성)
- ✅ `finalFeedbackJson` 구조 상세 설명
- ✅ 조기 종료 메타데이터 문서화
- ✅ 모든 외래 키에 인덱스 추가
- ✅ 상태 기반 검색 인덱스 추가

---

### 4. ✅ InterviewTurn 모델 개선

```prisma
model InterviewTurn {
  sessionId              Int      @map("session_id")
  turnNumber             Int      @map("turn_number")
  
  // 질문 (AI 생성)
  questionText           String   @map("question_text") @db.Text
  questionAudioS3Url     String?  @map("question_audio_s3_url") @db.Text
  
  // 답변 (사용자)
  userAnswerText         String?  @map("user_answer_text") @db.Text
  userAnswerAudioS3Url   String?  @map("user_answer_audio_s3_url") @db.Text
  
  // 개별 피드백 (선택적)
  feedbackText           String?  @map("feedback_text") @db.Text
  
  // Relations
  session InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  // 제약 조건 및 인덱스
  @@unique([sessionId, turnNumber])  // 중복 방지
  @@index([sessionId])
  @@index([turnNumber])
}
```

**개선 사항:**
- ✅ `feedbackText` 필드 추가 (database/schema.sql과 일치)
- ✅ `@@unique([sessionId, turnNumber])` 제약 조건 추가
- ✅ 모든 필드에 상세 설명 추가
- ✅ `onDelete: Cascade` 명시 (세션 삭제 시 턴도 삭제)
- ✅ 인덱스 추가 (검색 성능 향상)

---

## 📊 전체 스키마 구조

### 데이터베이스 관계도

```
users (1) ─────────┬─→ (1) user_profiles
                   │
                   ├─→ (*) job_postings
                   │         │
                   │         └─→ (*) cover_letters
                   │                   │
                   │                   └─→ (*) cover_letter_feedbacks
                   │
                   └─→ (*) interview_sessions
                             │
                             └─→ (*) interview_turns
```

### 핵심 모델 요약

| 모델 | 설명 | 주요 필드 | 관계 |
|------|------|-----------|------|
| **User** | 사용자 계정 | email, password_hash, name | 1:1 UserProfile<br/>1:N JobPosting, CoverLetter, InterviewSession |
| **UserProfile** | 사용자 스펙 | age, gender, currentJob, careerSummary, certifications | 1:1 User |
| **JobPosting** | 채용 공고 | title, companyName, extractedText, analysisJson | N:1 User<br/>1:N CoverLetter, InterviewSession |
| **CoverLetter** | 자기소개서 | contentText, jobPostingId | N:1 User, JobPosting<br/>1:N CoverLetterFeedback, InterviewSession |
| **InterviewSession** | 면접 세션 | status, finalFeedbackJson, startedAt, completedAt | N:1 User, CoverLetter, JobPosting<br/>1:N InterviewTurn |
| **InterviewTurn** | 질문-답변 턴 | turnNumber, questionText, userAnswerText, feedbackText | N:1 InterviewSession |

---

## 🔄 데이터베이스 동기화

### 1. Prisma 클라이언트 재생성

```bash
npx prisma generate
```

**효과:**
- ✅ TypeScript 타입 정의 업데이트
- ✅ Prisma Client API 재생성
- ✅ IDE 자동완성 업데이트

### 2. 데이터베이스 스키마 푸시 (Neon)

```bash
npx prisma db push
```

**주의사항:**
⚠️ **이 명령어는 신중하게 사용하세요!**

- ✅ 개발 환경에서는 안전 (로컬 DB)
- ⚠️ 프로덕션 환경에서는 백업 필수
- ❌ 기존 데이터와 충돌 가능성 확인 필요

**동작:**
1. Prisma 스키마를 읽음
2. 현재 데이터베이스 스키마와 비교
3. 차이점을 SQL로 변환
4. 데이터베이스에 직접 적용

**출력 예시:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "ai_interview_db" at "ep-xxx.us-east-1.aws.neon.tech:5432"

🚀  Your database is now in sync with your Prisma schema. Done in 2.5s

✔ Generated Prisma Client (4.16.2 | library) to ./node_modules/@prisma/client in 1.2s
```

### 3. 마이그레이션 생성 (권장)

프로덕션 환경에서는 마이그레이션 파일을 생성하는 것이 더 안전합니다:

```bash
npx prisma migrate dev --name update_interview_schema
```

**장점:**
- ✅ 변경 이력 추적
- ✅ 롤백 가능
- ✅ 팀원과 공유 가능
- ✅ CI/CD 자동화 가능

---

## 🧪 검증 방법

### 1. Prisma Studio로 확인

```bash
npx prisma studio
```

**확인 사항:**
- ✅ InterviewSession의 status 필드가 Enum인지
- ✅ InterviewTurn에 feedbackText 필드가 있는지
- ✅ 모든 인덱스가 적용되었는지

### 2. TypeScript 타입 확인

```typescript
import { PrismaClient, InterviewSessionStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Enum 타입 자동완성
const session = await prisma.interviewSession.create({
  data: {
    userId: 1,
    status: InterviewSessionStatus.IN_PROGRESS,  // 타입 안전
    totalQuestions: 5,
  },
});

// ✅ feedbackText 필드 사용 가능
const turn = await prisma.interviewTurn.create({
  data: {
    sessionId: session.id,
    turnNumber: 1,
    questionText: "자기소개 부탁드립니다.",
    feedbackText: "답변이 명확했습니다.",  // 새로운 필드
  },
});
```

### 3. 데이터베이스 쿼리 확인

```sql
-- status가 Enum인지 확인
SELECT status FROM interview_sessions LIMIT 5;

-- feedbackText 컬럼 확인
SELECT feedback_text FROM interview_turns WHERE feedback_text IS NOT NULL LIMIT 5;

-- 인덱스 확인
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('interview_sessions', 'interview_turns');
```

---

## 🔍 주요 변경 사항 상세

### 변경 1: Enum 타입 도입

**이전:**
```prisma
status String @default("pending") @db.VarChar(50)
```

**개선 후:**
```prisma
status InterviewSessionStatus @default(PENDING)
```

**영향:**
- ✅ TypeScript에서 타입 체크
- ✅ IDE 자동완성
- ❌ 기존 코드 수정 필요 (문자열 → Enum)

**마이그레이션:**
```typescript
// 이전
session.status = 'in_progress';

// 개선 후
import { InterviewSessionStatus } from '@prisma/client';
session.status = InterviewSessionStatus.IN_PROGRESS;

// 또는 raw SQL 사용 시 문자열 그대로 사용 가능
query(`UPDATE interview_sessions SET status = 'in_progress' WHERE id = $1`, [id]);
```

### 변경 2: feedbackText 필드 추가

**이전:**
```prisma
model InterviewTurn {
  // ... 기존 필드
  // feedbackText 없음
}
```

**개선 후:**
```prisma
model InterviewTurn {
  // ... 기존 필드
  feedbackText String? @map("feedback_text") @db.Text
}
```

**영향:**
- ✅ database/schema.sql과 완전 일치
- ✅ 개별 턴 피드백 저장 가능
- ✅ nullable이므로 기존 데이터와 호환

### 변경 3: 인덱스 추가

**추가된 인덱스:**
- `@@index([userId])` on UserProfile
- `@@index([currentJob])` on UserProfile
- `@@index([userId])` on InterviewSession
- `@@index([status])` on InterviewSession
- `@@index([coverLetterId])` on InterviewSession
- `@@index([jobPostingId])` on InterviewSession
- `@@index([sessionId])` on InterviewTurn
- `@@index([turnNumber])` on InterviewTurn

**성능 개선:**
- ✅ 사용자별 검색 속도 향상
- ✅ 상태별 필터링 최적화
- ✅ 조인 쿼리 성능 향상

---

## 📚 코드 예제

### 예제 1: 면접 세션 생성 (조기 종료 대비)

```typescript
import { PrismaClient, InterviewSessionStatus } from '@prisma/client';

const prisma = new PrismaClient();

// 면접 시작
const session = await prisma.interviewSession.create({
  data: {
    userId: req.user.userId,
    coverLetterId: 123,
    jobPostingId: 456,
    status: InterviewSessionStatus.IN_PROGRESS,
    startedAt: new Date(),
    totalQuestions: 5,
  },
});

console.log('세션 생성:', session.id);
```

### 예제 2: 조기 종료 (1개 질문만 답변)

```typescript
// 1개 질문만 답변 후 조기 종료
const turn = await prisma.interviewTurn.create({
  data: {
    sessionId: session.id,
    turnNumber: 1,
    questionText: "자기소개 부탁드립니다.",
    questionAudioS3Url: "https://s3.../q1.mp3",
    userAnswerText: "안녕하세요. 저는...",
    userAnswerAudioS3Url: "https://s3.../a1.webm",
  },
});

// 조기 종료 - 피드백 생성 및 상태 변경
const finalFeedback = {
  overall_feedback: "면접을 조기 종료하셨지만, 1개의 질문에 대한 답변을 바탕으로...",
  per_turn_feedback: [
    {
      turn_number: 1,
      question: turn.questionText,
      answer: turn.userAnswerText,
      feedback: "자기소개가 명확하고 구체적이었습니다.",
    },
  ],
  is_early_finish: true,
  total_questions_answered: 1,
};

await prisma.interviewSession.update({
  where: { id: session.id },
  data: {
    status: InterviewSessionStatus.COMPLETED,
    completedAt: new Date(),
    finalFeedbackJson: finalFeedback,
  },
});
```

### 예제 3: 사용자 프로필 조회 (컨텍스트 생성)

```typescript
// 면접 질문 생성을 위한 프로필 조회
const profile = await prisma.userProfile.findUnique({
  where: { userId: req.user.userId },
  select: {
    age: true,
    gender: true,
    currentJob: true,
    careerSummary: true,
    certifications: true,
    careerJson: true,
    educationJson: true,
    certificatesJson: true,
    skillsJson: true,
  },
});

// AI 질문 생성 시 컨텍스트로 사용
const context = {
  userProfile: profile,
  jobPosting: { /* ... */ },
  coverLetter: { /* ... */ },
  conversationHistory: [],
};

const question = await generateInterviewQuestion(context, 1, 5);
```

---

## ⚠️ 주의사항

### 1. Enum 마이그레이션

**기존 코드:**
```typescript
// ❌ 오류 발생
session.status = 'in_progress';
```

**수정 필요:**
```typescript
// ✅ 올바른 방법
import { InterviewSessionStatus } from '@prisma/client';
session.status = InterviewSessionStatus.IN_PROGRESS;
```

**또는 raw SQL 사용:**
```typescript
// ✅ raw SQL은 문자열 그대로 사용 가능
await query(
  `UPDATE interview_sessions SET status = 'in_progress' WHERE id = $1`,
  [sessionId]
);
```

### 2. feedbackText 필드

- ✅ nullable이므로 기존 데이터와 호환
- ✅ 현재는 `finalFeedbackJson.per_turn_feedback`에 통합 저장
- ✅ 향후 개별 저장으로 전환 가능

### 3. 인덱스 추가

- ✅ 자동으로 생성됨 (`npx prisma db push`)
- ✅ 기존 데이터가 많으면 시간 소요 가능
- ✅ 락(lock) 걸릴 수 있으므로 트래픽 낮은 시간에 실행 권장

---

## ✅ 체크리스트

### 스키마 업데이트
- [x] InterviewSessionStatus Enum 추가
- [x] UserProfile 상세 주석 추가
- [x] UserProfile 인덱스 추가
- [x] InterviewSession status를 Enum으로 변경
- [x] InterviewSession 인덱스 추가
- [x] InterviewTurn feedbackText 필드 추가
- [x] InterviewTurn @@unique 제약 조건 추가
- [x] InterviewTurn 인덱스 추가

### 동기화
- [ ] `npx prisma generate` 실행
- [ ] `npx prisma db push` 실행 (또는 migrate dev)
- [ ] Prisma Studio로 검증
- [ ] TypeScript 타입 확인
- [ ] 기존 코드 Enum 마이그레이션 (필요 시)

### 테스트
- [ ] 면접 시작 API 테스트
- [ ] 조기 종료 API 테스트
- [ ] 프로필 조회/업데이트 테스트
- [ ] 히스토리 페이지 테스트

---

## 📖 참고 문서

- **[Prisma 공식 문서](https://www.prisma.io/docs/)** - Prisma 스키마 가이드
- **[면접 조기 종료 기능](./INTERVIEW_EARLY_FINISH.md)** - 조기 종료 API 및 로직
- **[데이터베이스 스키마](../database/schema.sql)** - 원본 PostgreSQL 스키마
- **[마이그레이션 가이드](../MIGRATION_GUIDE.md)** - 데이터베이스 마이그레이션 전체 가이드

---

**작성일:** 2025-11-18  
**버전:** 2.4 (Prisma Schema Full Sync)  
**작성자:** AI Assistant



