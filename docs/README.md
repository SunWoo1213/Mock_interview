# 프로젝트 문서

개발하면서 남긴 설계 문서, 마이그레이션 기록, 트러블슈팅 기록을 주제별로 정리한 목록입니다.
프로젝트 소개는 [루트 README](../README.md)를 참고하세요.

```
docs/
├── guides/            # 개발·운영 가이드 (API, 배포, 환경 변수, 디자인 시스템)
├── features/          # 기능 설계 및 구현 기록
├── database/          # 스키마 및 마이그레이션 기록
└── troubleshooting/   # 장애 원인 분석 및 해결 기록
```

## 📘 가이드 (`guides/`)

| 문서 | 내용 |
| --- | --- |
| [API.md](guides/API.md) | 전체 REST API 엔드포인트 명세 |
| [DEPLOYMENT.md](guides/DEPLOYMENT.md) | Vercel · PostgreSQL · S3 배포 절차 |
| [ENVIRONMENT_VARIABLES.md](guides/ENVIRONMENT_VARIABLES.md) | 필수 환경 변수와 관리 방법 |
| [DESIGN_SYSTEM.md](guides/DESIGN_SYSTEM.md) | Modern SaaS(Zinc) 디자인 시스템 |

## 🧩 기능 설계 · 구현 (`features/`)

| 문서 | 내용 |
| --- | --- |
| [INTERVIEW_CONTEXT_AWARE_REFACTOR.md](features/INTERVIEW_CONTEXT_AWARE_REFACTOR.md) | 대화 맥락을 반영한 꼬리 질문 생성 로직 |
| [INTERVIEW_EARLY_FINISH.md](features/INTERVIEW_EARLY_FINISH.md) | 면접 조기 종료 기능 |
| [INTERVIEW_UI_REFACTOR.md](features/INTERVIEW_UI_REFACTOR.md) | 면접 화면 상호작용 개선 |
| [INTERVIEW_UI_IMPROVEMENTS.md](features/INTERVIEW_UI_IMPROVEMENTS.md) | "면접 종료 및 결과 보기" 버튼 추가 |
| [COVER_LETTER_SPLIT_VIEW.md](features/COVER_LETTER_SPLIT_VIEW.md) | 자기소개서 작성 Split View UI |
| [JOB_POSTING_MANAGEMENT.md](features/JOB_POSTING_MANAGEMENT.md) | 채용 공고 조회·선택·삭제 |
| [HISTORY_PAGE_SETUP.md](features/HISTORY_PAGE_SETUP.md) | 히스토리 페이지 구성 |
| [MODERN_SAAS_DESIGN_UPGRADE.md](features/MODERN_SAAS_DESIGN_UPGRADE.md) | Modern SaaS 스타일 디자인 전환 |

## 🗄️ 데이터베이스 (`database/`)

| 문서 | 내용 |
| --- | --- |
| [MIGRATION_QUICKSTART.md](database/MIGRATION_QUICKSTART.md) | 마이그레이션 빠른 시작 |
| [MIGRATION_GUIDE.md](database/MIGRATION_GUIDE.md) | 마이그레이션 배경과 개요 |
| [MIGRATION_GUIDELINE.md](database/MIGRATION_GUIDELINE.md) | 로컬/프로덕션 단계별 가이드, 롤백 전략 |
| [DB_SCHEMA_CHECKLIST.md](database/DB_SCHEMA_CHECKLIST.md) | 스키마 점검 체크리스트 |
| [PRISMA_SCHEMA_UPDATE.md](database/PRISMA_SCHEMA_UPDATE.md) | Prisma 스키마 정의 |
| [VOICE_MIGRATION.md](database/VOICE_MIGRATION.md) | 면접관 음성(`voice`) 컬럼 추가 배경 |
| [ADD_VOICE_COLUMN_MIGRATION.md](database/ADD_VOICE_COLUMN_MIGRATION.md) | `voice` 컬럼 마이그레이션 실행 방법 |

SQL 파일은 [`database/migrations/`](../database/migrations), 전체 스키마는 [`database/schema.sql`](../database/schema.sql)에 있습니다.

## 🛠️ 트러블슈팅 (`troubleshooting/`)

| 문서 | 다룬 문제 |
| --- | --- |
| [CORS_FIX_GUIDE.md](troubleshooting/CORS_FIX_GUIDE.md) | Preview 배포에서 Production API 호출로 인한 CORS 에러 |
| [JWT_AUTH_DEBUG.md](troubleshooting/JWT_AUTH_DEBUG.md) | JWT 인증 401 오류 |
| [S3_REGION_FIX.md](troubleshooting/S3_REGION_FIX.md) | S3 리전 불일치(PermanentRedirect) |
| [S3_REGION_UPDATE.md](troubleshooting/S3_REGION_UPDATE.md) | S3 리전 `ap-southeast-2` 전환 |
| [S3_ACCESS_DENIED_FIX.md](troubleshooting/S3_ACCESS_DENIED_FIX.md) | S3 AccessDenied (IAM 권한) |
| [ENV_VAR_CLEANUP_SUMMARY.md](troubleshooting/ENV_VAR_CLEANUP_SUMMARY.md) | 환경 변수 오타·중복 정리 |
| [TTS_AUDIO_FIX.md](troubleshooting/TTS_AUDIO_FIX.md) | TTS 오디오 재생 에러 |
| [TTS_AUTOPLAY_FIX.md](troubleshooting/TTS_AUTOPLAY_FIX.md) | 브라우저 자동 재생 정책 대응 |
| [TTS_AUTOPLAY_REFACTOR.md](troubleshooting/TTS_AUTOPLAY_REFACTOR.md) | TTS 자동 재생 로직 리팩터링 |
| [INTERVIEW_START_DEBUG.md](troubleshooting/INTERVIEW_START_DEBUG.md) | 면접 시작 실패 |
| [INTERVIEW_RESULT_DEBUG.md](troubleshooting/INTERVIEW_RESULT_DEBUG.md) | 면접 결과 조회 에러 |

> 일부 문서에 나오는 PowerShell 스크립트와 관리자용 마이그레이션 API는 일회성 작업 후 삭제되었습니다.
> 문서의 버킷 이름, 도메인, 키 값은 예시 값으로 마스킹되어 있습니다.
