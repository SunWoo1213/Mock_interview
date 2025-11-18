# AI 취업 준비 서비스 🚀

AI 기반 자기소개서 피드백 및 모의 면접 서비스입니다. GPT-4o, OpenAI TTS/STT를 활용하여 실전과 같은 면접 경험을 제공합니다.

## 주요 기능

### 1. 사용자 프로필 관리
- 나이, 성별, 경력, 학력, 자격증 등 저장
- AI 피드백에 개인화된 페르소나로 활용

### 2. 채용 공고 분석
- PDF 업로드 자동 텍스트 추출 (pdf-parse)
- GPT-4o로 핵심 키워드, 필수/우대 요건 자동 분석
- S3에 원본 PDF 저장

### 3. 자기소개서 피드백
- 사용자 스펙 + 채용 공고 + 자소서 통합 분석
- AI가 강점, 개선점, 예상 면접 질문 생성
- 구조화된 JSON 피드백 제공

### 4. 실시간 모의 면접
- OpenAI TTS로 질문 음성 생성
- 60초 타이머와 자동 녹음
- OpenAI Whisper STT로 답변 텍스트 변환
- 대화 히스토리 기반 꼬리 질문 생성 (5개 질문)
- 최종 종합 피드백 및 질문별 상세 피드백

## 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI/UX**: 다크 모드, Neo-brutalist 디자인

### Backend
- **Runtime**: Next.js API Routes (Vercel Serverless Functions)
- **Database**: PostgreSQL (with pg)
- **Storage**: AWS S3
- **AI**: OpenAI GPT-4o, TTS, Whisper STT

### Infrastructure
- **Hosting**: Vercel
- **Database**: PostgreSQL (Vercel Postgres, Supabase, 또는 AWS RDS)
- **Storage**: AWS S3

## 프로젝트 구조

```
AI_Service2_3/
├── app/                      # Next.js App Router
│   ├── globals.css          # 전역 스타일
│   ├── layout.tsx           # 루트 레이아웃
│   └── page.tsx             # 홈 페이지
├── components/              # React 컴포넌트
│   ├── AudioPlayer.tsx      # 오디오 플레이어
│   ├── AudioVisualizer.tsx  # 녹음 비주얼라이저
│   ├── CountdownTimer.tsx   # 카운트다운 타이머
│   ├── InterviewPage.tsx    # 면접 진행 페이지
│   ├── InterviewResultPage.tsx  # 면접 결과 페이지
│   ├── InterviewTurnCard.tsx    # 면접 턴 카드
│   └── JobPostingAnalysis.tsx   # 공고 분석 컴포넌트
├── pages/api/               # API Routes
│   ├── auth/
│   │   ├── register.ts      # 회원가입
│   │   └── login.ts         # 로그인
│   ├── profile/
│   │   └── index.ts         # 프로필 조회/수정
│   ├── job-postings/
│   │   ├── upload.ts        # 공고 업로드
│   │   └── analyze.ts       # 공고 분석
│   ├── cover-letters/
│   │   ├── create.ts        # 자소서 생성/피드백
│   │   └── [id].ts          # 자소서 조회
│   └── interview/
│       ├── start.ts         # 면접 시작
│       ├── answer.ts        # 답변 제출
│       └── result/[id].ts   # 결과 조회
├── lib/                     # 유틸리티 함수
│   ├── db.ts               # PostgreSQL 연결
│   ├── auth.ts             # JWT 인증
│   ├── s3.ts               # S3 업로드
│   ├── pdf-parser.ts       # PDF 파싱
│   ├── openai.ts           # OpenAI API
│   ├── middleware.ts       # API 미들웨어
│   └── api-client.ts       # Frontend API 클라이언트
├── database/
│   └── schema.sql          # DB 스키마
├── scripts/
│   └── migrate.js          # 마이그레이션 스크립트
└── package.json
```

## 설치 및 실행

### 1. 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 내용을 입력하세요:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ai_interview_db

# AWS S3
AWS_REGION=ap-southeast-2  # Sydney (버킷 실제 위치)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=ai-interview-bucket  # ⚠️ BUCKET (철자 확인!)

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
```

> 📚 **환경 변수 가이드**: 자세한 설명은 [환경 변수 문서](./docs/ENVIRONMENT_VARIABLES.md) 참고

### 2. 의존성 설치

```bash
npm install
```

### 3. 데이터베이스 마이그레이션

```bash
# 전체 스키마 생성 (처음 설치 시)
npm run db:migrate

# 프로필 필드 추가 마이그레이션 (user_profiles 테이블 업데이트)
npm run db:migrate:profile

# 마이그레이션 검증
npm run db:verify
```

> 💡 **마이그레이션 가이드**: 자세한 내용은 [마이그레이션 빠른 시작 가이드](./docs/MIGRATION_QUICKSTART.md) 참고

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 확인하세요.

## Vercel 배포 가이드

### 1. Vercel CLI 설치

```bash
npm i -g vercel
```

### 2. 프로젝트 배포

```bash
vercel
```

### 3. 환경 변수 설정

Vercel 대시보드 > 프로젝트 > Settings > Environment Variables에서 다음 환경 변수를 추가하세요:

- `DATABASE_URL`
- `AWS_REGION` (예: `ap-southeast-2` - Sydney)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME` ⚠️ **BUCKET** (철자 확인!)
- `OPENAI_API_KEY`
- `JWT_SECRET`

> 🔧 **환경 변수 정리**: 중복 변수 제거는 [fix-env-variables.ps1](./fix-env-variables.ps1) 스크립트 사용

### 4. 프로덕션 배포

```bash
vercel --prod
```

## 데이터베이스 스키마

주요 테이블:
- **users**: 사용자 정보
- **user_profiles**: 사용자 스펙 (경력, 학력, 자격증 등)
- **job_postings**: 채용 공고 (PDF, 추출 텍스트, AI 분석)
- **cover_letters**: 자기소개서
- **cover_letter_feedbacks**: 자소서 피드백
- **interview_sessions**: 면접 세션
- **interview_turns**: 면접 질문/답변 턴

자세한 스키마는 `database/schema.sql`을 참고하세요.

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 프로필
- `GET /api/profile` - 프로필 조회
- `PUT /api/profile` - 프로필 수정

### 채용 공고
- `POST /api/job-postings/upload` - PDF 업로드
- `POST /api/job-postings/analyze` - 공고 분석

### 자기소개서
- `POST /api/cover-letters/create` - 자소서 생성 및 피드백
- `GET /api/cover-letters/[id]` - 자소서 조회

### 면접
- `POST /api/interview/start` - 면접 시작
- `POST /api/interview/answer` - 답변 제출
- `GET /api/interview/result/[id]` - 결과 조회

## 주요 고려사항

### 1. Vercel 서버리스 제약
- Hobby 플랜: 10초 제한
- Pro 플랜: 60초 제한
- AI 작업(STT, TTS, GPT)은 비동기 처리 또는 폴링 방식 권장

### 2. S3 최적화
- 업로드된 파일은 S3에 저장
- Presigned URL 활용 가능

### 3. 확장성
- RESTful API 설계로 네이티브 앱 확장 가능
- JWT 토큰 기반 인증

## 문서

### 📖 주요 문서
- [API 문서](./API.md) - 전체 API 엔드포인트 상세 설명
- [배포 가이드](./DEPLOYMENT.md) - Vercel 배포 상세 가이드
- [기여 가이드](./CONTRIBUTING.md) - 프로젝트 기여 방법

### 🔧 마이그레이션 가이드
- [빠른 시작](./docs/MIGRATION_QUICKSTART.md) - 5분 안에 마이그레이션 완료
- [상세 가이드](./docs/MIGRATION_GUIDELINE.md) - 단계별 상세 설명 및 트러블슈팅
- [마이그레이션 개요](./MIGRATION_GUIDE.md) - 마이그레이션 배경 및 개요

### 🛠️ 트러블슈팅

**"column p.current_job does not exist" 에러가 발생하나요?**
```bash
# 프로필 필드 마이그레이션 실행
npm run db:migrate:profile

# 검증
npm run db:verify
```
자세한 내용은 [마이그레이션 빠른 시작 가이드](./docs/MIGRATION_QUICKSTART.md)를 참고하세요.

## 라이선스

MIT

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

