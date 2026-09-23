# 트러블슈팅 10건

개발 중 겪은 문제와 해결 과정입니다. README의 [문제 해결 사례](../README.md#5-문제-해결-사례)에서 대표 사례를 골라 정리했고, 전체 목록은 여기에 있습니다.

<details>
<summary><b>1. S3 연동 이슈 연쇄: AccessDenied → 리전 오진 2회 → 재생 실패</b></summary>

- **AccessDenied**: IAM 사용자에게 버킷 권한이 없어 업로드 실패 → IAM 정책을 추가
- **PermanentRedirect (1차)**: 코드 기본 리전 `ap-northeast-2`로 접근해 실패 → 에러 메시지의 엔드포인트만 보고 `eu-west-2`로 변경
- **PermanentRedirect (2차)**: `eu-west-2`도 실제 버킷 위치가 아니었음 → 실제 리전(`ap-southeast-2`)을 확인하고 코드 기본값과 Vercel 3개 환경의 `AWS_REGION`을 통일
- **배운 점**: 에러 메시지로 추측하지 말고 `aws s3api get-bucket-location`으로 실제 설정부터 확인
- 📄 [S3_ACCESS_DENIED_FIX.md](troubleshooting/S3_ACCESS_DENIED_FIX.md) · [S3_REGION_FIX.md](troubleshooting/S3_REGION_FIX.md) · [S3_REGION_UPDATE.md](troubleshooting/S3_REGION_UPDATE.md)
</details>

<details>
<summary><b>2. TTS 오디오 재생 실패 (MEDIA_ELEMENT_ERROR: Format error)</b></summary>

- **문제**: 브라우저에서 질문 음성이 재생되지 않음
- **원인**: 오디오 포맷을 지정하지 않았고, 생성 결과를 검증하지 않았으며, 비공개 S3 객체에 접근 권한이 없었음
- **해결**: mp3 포맷 명시, 버퍼 크기 검증, 최종적으로 **Presigned URL 도입**
- 📄 [TTS_AUDIO_FIX.md](troubleshooting/TTS_AUDIO_FIX.md)
</details>

<details>
<summary><b>3. 브라우저 자동 재생 정책 (NotAllowedError)</b></summary>

- **문제**: 사용자 조작 없이 `audio.play()`를 호출하면 브라우저가 차단
- **해결**: 자동 재생이 실패하면 **"🔊 질문 듣기" 폴백 버튼**을 표시. 재생 로직을 `useEffect` 하나로 합치고 100ms 지연, `playsInline`, `preload="auto"`를 적용
- 📄 [TTS_AUTOPLAY_FIX.md](troubleshooting/TTS_AUTOPLAY_FIX.md) · [TTS_AUTOPLAY_REFACTOR.md](troubleshooting/TTS_AUTOPLAY_REFACTOR.md)
</details>

<details>
<summary><b>4. Vercel Preview 배포에서만 발생한 CORS 에러</b></summary>

- **문제**: Preview 도메인에서 로그인하면 CORS 차단
- **원인**: `NEXT_PUBLIC_API_URL`이 모든 환경에서 Production 도메인을 가리켜, Preview가 **다른 도메인의 API**를 호출함
- **해결**: 환경 변수를 제거하고 API 클라이언트를 **상대 경로(`/api`)** 로 변경해 각 배포가 자기 도메인의 API를 호출하도록 함. 여기에 서버의 `withCors` 허용 목록(localhost · Production · Preview 정규식)을 더함
- 📄 [CORS_FIX_GUIDE.md](troubleshooting/CORS_FIX_GUIDE.md)
</details>

<details>
<summary><b>5. 환경 변수 오타로 하드코딩 기본값에 의존</b></summary>

- **문제**: Vercel 변수 이름이 `S3_BuCKET_NAME`(오타)이라 코드가 환경 변수를 읽지 못하고 하드코딩된 기본 버킷 이름으로 동작하고 있었음 (당장은 동작하지만 버킷을 바꾸면 깨지는 잠재 버그)
- **추가 발견**: Vercel Storage 연동으로 자동 생성된 `storage_*` 변수 19개가 섞여 있었음
- **해결**: 오타를 수정하고, 코드가 실제로 쓰는 변수 7개만 남기도록 정리 대상을 정해 문서화 (26개 → 7개)
- 📄 [ENV_VAR_CLEANUP_SUMMARY.md](troubleshooting/ENV_VAR_CLEANUP_SUMMARY.md)
</details>

<details>
<summary><b>6. 녹음 종료 후 "Attempting to use a disconnected port"</b></summary>

- **원인**: `MediaRecorder`를 멈춘 뒤에도 미디어 스트림 트랙이 살아 있었고, 컴포넌트 언마운트 시 정리하지 않았음
- **해결**: `cleanupMediaStream()`에서 모든 트랙을 `stop()`하고, `onstop`과 언마운트 시점에 호출. 60초 타이머가 끝나면 자동 제출하던 방식은 녹음만 멈추고 **"다음 질문" 버튼으로 직접 제출**하도록 바꿈 (listening → recording → waiting_next → processing)
- 📄 [INTERVIEW_UI_REFACTOR.md](features/INTERVIEW_UI_REFACTOR.md)
</details>

<details>
<summary><b>7. 배포 후 스키마 불일치로 500 에러 (임시 관리자 API와 제거)</b></summary>

- **문제**: `column p.current_job does not exist`, `column "voice" ... does not exist`
- **원인**: 코드는 새 컬럼을 사용하는데 프로덕션 DB에는 마이그레이션이 적용되지 않았음
- **해결**: 여러 번 실행해도 안전한 마이그레이션 SQL과 실행·검증 스크립트를 만들고, 기존 행에는 기본값(`nova`)을 채움. `voice` 컬럼은 당시 일회성 관리자 마이그레이션 API로 반영했는데, **인증 없이 호출할 수 있는 엔드포인트**였기 때문에 이후 삭제하고 스크립트(`db:migrate:voice`)로 대체
- 📄 [MIGRATION_GUIDE.md](database/MIGRATION_GUIDE.md) · [VOICE_MIGRATION.md](database/VOICE_MIGRATION.md) · [INTERVIEW_START_DEBUG.md](troubleshooting/INTERVIEW_START_DEBUG.md)
</details>

<details>
<summary><b>8. 면접 결과 조회 시 "아직 완료되지 않은 면접입니다"</b></summary>

- **원인**: 면접을 마쳐도 세션 상태가 `completed`로 바뀌지 않는 경우가 있었음
- **해결**: 완료 처리 `UPDATE ... RETURNING`으로 결과를 확인하도록 함. 조기 종료 시 답변이 없는 마지막 턴은 삭제하고, 답변이 0개면 `cancelled`로 처리
- 📄 [INTERVIEW_RESULT_DEBUG.md](troubleshooting/INTERVIEW_RESULT_DEBUG.md) · [INTERVIEW_EARLY_FINISH.md](features/INTERVIEW_EARLY_FINISH.md)
</details>

<details>
<summary><b>9. 면접 시작 시 JWT 401 오류</b></summary>

- **문제**: 로그인한 상태에서도 `/api/interview/start`가 401을 반환
- **접근**: 원인 후보(토큰 미저장, `'null'` 문자열로 저장된 토큰, 헤더 누락, 환경별 `JWT_SECRET` 불일치)를 나누고, 클라이언트·미들웨어·토큰 추출 단계마다 로그를 넣어 범위를 좁힘
- **조치**: 클라이언트에서 `'null'`·빈 토큰을 걸러내고, `/api/interview/start`는 공통 미들웨어 대신 헤더 확인 → 토큰 추출 → 검증을 순서대로 명시적으로 수행하며 에러 유형(만료·서명 오류)별로 응답하도록 변경. 근본 원인은 문서에 확정 기록이 없음
- 📄 [JWT_AUTH_DEBUG.md](troubleshooting/JWT_AUTH_DEBUG.md)
</details>

<details>
<summary><b>10. Vercel 빌드 실패와 404</b></summary>

- **빌드 실패**: 로컬에서는 넘어가던 코드가 배포 빌드의 타입·린트 검사에서 실패. 쿼리 파라미터·`pathname`의 null 가능성(strict null), ESLint(`import/no-anonymous-default-export`, `exhaustive-deps`), `pdf-parse` 타입 선언(`types/pdf-parse.d.ts`), API 핸들러 반환 타입, `next.config.js`의 잘못된 키, JSX 문법 오류를 하나씩 수정
- **404**: 링크는 있는데 페이지 파일이 없던 경로를 만들고, 존재하지 않는 `/dashboard` 링크를 `/`로 수정. 히스토리 페이지 404는 빌드 캐시(`.next`) 삭제와 강제 재배포로 해결하고 통합 조회 API(`/api/history`)를 추가. favicon 404는 `app/icon.tsx`로 해결
- 📄 [HISTORY_PAGE_SETUP.md](features/HISTORY_PAGE_SETUP.md)
</details>
