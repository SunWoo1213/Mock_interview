# 구현 상세

README에서 줄인 구현 포인트 · 변경 사항 · 설정값 · 프로젝트 구조를 모은 문서입니다.

## 맥락을 반영한 면접 질문 생성
- MVP에서는 기본 프로필(나이·성별·경력·학력)만 조회했고, 2번째 질문부터는 대화 이력만 넣어 **누구에게나 비슷한 질문**이 나왔습니다.
- 모든 턴에 현재 직무·경력 요약·자격증, **채용 공고 분석 결과(요약·필수/우대 요건·키워드)**, 자기소개서, 지금까지의 질의응답을 함께 넣도록 개편했습니다.
- 질문 전략을 꼬리 질문 / 새 주제에 **상황 질문**을 더한 3가지로 명시하고, 생성된 질문이 10자 미만이면 기본 질문으로 대체해 안정성을 확보했습니다.
- 질문 생성: `temperature 0.7`, `max_tokens 300`(MVP 200) / 공고 분석은 일관성을 위해 `temperature 0.3`
- 컨텍스트가 늘면서 질문당 토큰은 약 500 → 800~1,000으로 증가, 면접 1회(5문항) 비용은 약 $0.01~0.02 **(추정)**
- 📄 [INTERVIEW_CONTEXT_AWARE_REFACTOR.md](features/INTERVIEW_CONTEXT_AWARE_REFACTOR.md)

## 피드백 프롬프트 재설계 (점수 → 정성 피드백)
- MVP는 자기소개서 `overall_score`, 면접 4개 점수(태도·내용·일관성·직무 적합성)를 매겼지만, 점수만으로는 무엇을 고쳐야 할지 알 수 없어 **점수를 모두 제거**했습니다.
- 자기소개서: "수석 채용 담당자" 페르소나, 평가 기준 5개(명확성·직무 적합성·STAR·구체성·차별성), 출력 JSON 예시(few-shot), `response_format: json_object`, `temperature 0.5 → 0.7`
- 면접: 답변한 **모든 턴**에 요약·강점·개선점·STAR 기반 모범 답안을 생성. 조기 종료 시에는 "답변 수가 적다고 감점하지 말라"는 규칙을 프롬프트에 넣었습니다.

## LLM 출력 정규화
- GPT가 문자열 대신 객체를 배열에 넣어 돌려주는 경우가 있었고, 이를 그대로 렌더링하다 **React 에러 #31**(Objects are not valid as a React child)이 발생했습니다.
- 서버에서 응답을 스키마에 맞게 정규화하고(문자열·배열 강제, 객체로 온 항목은 `issue`·`suggestion` 등 필드를 꺼내 문장으로 변환, `improvements`로 바뀐 필드명도 수용, 수정 예시 최대 3개·턴별 강점/개선점 최대 3개), 클라이언트에서도 객체면 문자열로 변환해 렌더링합니다.

## 구조화된 피드백 저장 (TEXT → JSONB)
- 면접 턴별 피드백을 자유 텍스트에서 `user_answer_summary / strengths / improvements / better_answer_example` 구조의 **JSONB**로 바꿨습니다.
- 기존 데이터는 `{"legacy_feedback": ...}`로 감싸 호환성을 지켰고, 조회용 **GIN 인덱스 2개**를 추가했습니다.
- 📄 [MIGRATION_GUIDE.md](database/MIGRATION_GUIDE.md)

## 서버리스 환경에서의 미디어 처리
- TTS 결과는 `response_format: mp3`로 고정하고, 100바이트 미만이면 거부합니다. MP3 헤더가 이상하면 경고 로그를 남깁니다.
- 공개 버킷 대신 **Presigned URL**(24시간)로 제공해 버킷을 공개하지 않고도 재생할 수 있게 했습니다.
- `vercel.json`에서 API 함수 최대 실행 시간을 처음부터 60초로 두어, GPT·TTS·STT를 연달아 호출하는 요청을 처리합니다.

## 한·영 혼합 발음 개선
- TTS 모델을 `tts-1` → `tts-1-hd`로, 속도를 `1.0` → `0.95`로 바꿨습니다.
- 질문을 만드는 단계에서도 "영어 용어에 한국어 조사를 자연스럽게 붙이고, 소리 내어 읽기 좋은 구어체로 쓰라"는 규칙을 프롬프트에 추가했습니다.

## 인증 구조
- 로그인하면 JWT를 `localStorage`에 저장하고, `AuthContext`가 `/api/auth/me`로 토큰을 검증해 전역 로그인 상태를 관리합니다.
- 공개 경로(`/`, `/login`, `/register`)를 뺀 모든 페이지를 `AuthGuard`로 감쌉니다.
- API는 `withAuth`(Bearer 토큰 검증) · `withCors` · `withErrorHandler` 래퍼로 감싸고, 클라이언트는 401을 받으면 토큰을 지우고 로그인 페이지로 보냅니다.
- 프로필은 `INSERT ... ON CONFLICT (user_id) DO UPDATE`(UPSERT)로 저장합니다.

## 안전한 스키마 변경
- 운영 중 컬럼 추가(`current_job`, `career_summary`, `certifications`, `voice`)는 `ADD COLUMN IF NOT EXISTS` 또는 `information_schema`를 확인하는 `DO` 블록으로 **여러 번 실행해도 안전하게** 작성했습니다.
- 절차: 백업 → 마이그레이션 SQL 적용(피드백 JSONB 전환은 트랜잭션) → 검증 스크립트 → 문제 시 롤백 SQL 또는 백업 복원
- 검증: `npm run db:verify`(user_profiles 컬럼·인덱스), `npm run db:verify:schema`(전체 테이블·컬럼 타입·인덱스)
- 📄 [MIGRATION_GUIDELINE.md](database/MIGRATION_GUIDELINE.md) · [DB_SCHEMA_CHECKLIST.md](database/DB_SCHEMA_CHECKLIST.md)

## 데이터 모델
`users` · `user_profiles` · `job_postings` · `cover_letters` · `cover_letter_feedbacks` · `interview_sessions` · `interview_turns`
테이블 7개, 기본 인덱스 9개 + GIN 인덱스 2개, `updated_at` 자동 갱신 트리거 5개 ([schema.sql](../database/schema.sql))

## 변경 사항 요약 (Before → After)

| 영역| Before | After |
| --- | --- | --- |
| 면접 질문 | 기본 프로필 + (2번째부터) 대화 이력 | 직무·경력 요약·자격증·**공고 분석·자소서·대화 이력**을 모든 턴에 반영 |
| 답변 제출 | 60초 후 자동 제출 | 녹음 후 "다음 질문" 버튼으로 제출 |
| 면접 종료 | 5개 질문 모두 완료해야 종료 | 답변 1개 이상이면 조기 종료 가능 |
| 피드백 형식 | 점수 중심, TEXT 컬럼 | 점수 제거, 정성 피드백, **JSONB** + GIN 인덱스 |
| TTS | `tts-1`, 속도 1.0, 고정 목소리 | `tts-1-hd`, 속도 0.95, 목소리 6종 랜덤 |
| 오디오 제공 | S3 공개 URL | **Presigned URL** (24시간) |
| API 호출 | `NEXT_PUBLIC_API_URL` 절대 경로 | 상대 경로 (`/api`) |
| 환경 변수 | 26개 (오타·중복 포함) | **7개** |
| S3 리전<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | `ap-northeast-2` → `eu-west-2` (둘 다 오진) | `ap-southeast-2` (실제 버킷 위치) |
| UI | 다크 모드 → 라이트 테마(blue-600) | 모던 SaaS (Zinc, Inter, 글래스모피즘 헤더) |

## 주요 설정값

| 항목 | 값|
| --- | --- |
| 면접 질문 수 / 답변 시간 | 5개 / 60초 |
| GPT-4o temperature | 공고 분석 0.3 · 자소서·질문·피드백 0.7 |
| 질문 생성 max_tokens | 300 |
| Vercel API 최대 실행 시간 | 60초 |
| DB 커넥션 풀 | 최대 20 · idle 30초 · 연결 타임아웃 2초 |
| JWT 만료 / bcrypt salt rounds | 7일 / 10 |
| S3 Presigned URL (조회) | 24시간 |
| 업로드 제한 | PDF 10MB · 텍스트 50 ~ 50,000자 |
| API 라우트 / DB 테이블 | 20개 / 7개 |

## 프로젝트 구조

```
.
├── app/                    # Next.js App Router (페이지)
│   ├── cover-letters/      #   자기소개서 목록 · 공고 선택 · 작성(Split View) · 결과
│   ├── interview/          #   모의 면접 진행 · 결과
│   ├── job-postings/       #   공고 업로드 · 상세 · 히스토리
│   ├── history/            #   통합 히스토리
│   ├── profile/            #   프로필
│   └── login/, register/   #   인증
├── components/             # UI 컴포넌트 (면접, 오디오, 타이머, 공고 분석, 공고 선택 모달, AuthGuard 등)
├── context/                # AuthContext (전역 인증 상태)
├── lib/                    # 서버·클라이언트 공통 모듈
│   ├── openai.ts           #   GPT-4o 프롬프트 · 응답 정규화, TTS, STT
│   ├── s3.ts               #   S3 업로드 · Presigned URL
│   ├── db.ts               #   PostgreSQL 커넥션 풀
│   ├── auth.ts             #   JWT · bcrypt
│   ├── middleware.ts       #   인증 · CORS · 에러 핸들링 래퍼, multipart 파싱
│   ├── pdf-parser.ts       #   PDF 텍스트 추출
│   └── api-client.ts       #   프론트엔드 API 클라이언트
├── pages/api/              # REST API 20개 (auth, profile, job-postings, cover-letters, interview, history)
├── database/
│   ├── schema.sql          # 전체 스키마 (최신 상태)
│   └── migrations/         # 기존 DB 업그레이드용 증분 마이그레이션 SQL
├── prisma/schema.prisma    # Prisma 스키마 (모델 문서화용)
├── scripts/                # DB 초기화 · 마이그레이션 · 검증 스크립트
└── docs/                   # 가이드 · 기능 설계 · DB · 트러블슈팅 문서
```
