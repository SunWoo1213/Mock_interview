# 면접관 목소리 랜덤 배정 마이그레이션 가이드

## 개요
면접 시작 시 OpenAI TTS 목소리를 랜덤으로 배정하는 기능이 추가되었습니다.

## 데이터베이스 변경사항

### 1. interview_sessions 테이블에 voice 컬럼 추가

```sql
-- voice 컬럼 추가
ALTER TABLE interview_sessions 
ADD COLUMN voice VARCHAR(20) DEFAULT 'nova';

-- 컬럼 주석 추가
COMMENT ON COLUMN interview_sessions.voice IS 'OpenAI TTS 목소리 (alloy, echo, fable, onyx, nova, shimmer)';
```

### 2. 기존 세션 업데이트 (옵션)

기존에 진행된 면접 세션들에 대해 기본값을 설정하려면:

```sql
-- 기존 레코드에 기본값 설정
UPDATE interview_sessions 
SET voice = 'nova' 
WHERE voice IS NULL;
```

## Vercel 배포 시 주의사항

### 방법 1: Vercel Postgres 콘솔 사용

1. Vercel 대시보드 접속
2. Storage 탭 선택
3. PostgreSQL 데이터베이스 선택
4. Query 탭에서 위의 SQL 실행

### 방법 2: psql 사용

```bash
# 환경변수에서 연결 정보 가져오기
psql $POSTGRES_URL

# SQL 실행
ALTER TABLE interview_sessions ADD COLUMN voice VARCHAR(20) DEFAULT 'nova';
```

## 검증

### 1. 컬럼 추가 확인

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'interview_sessions' 
  AND column_name = 'voice';
```

**예상 결과:**
```
 column_name | data_type  | column_default 
-------------+------------+----------------
 voice       | varchar(20)| 'nova'::character varying
```

### 2. 새 면접 시작 후 확인

```sql
SELECT id, voice, status, started_at
FROM interview_sessions
ORDER BY id DESC
LIMIT 5;
```

**예상 결과:** 최근 세션의 voice가 6가지 중 하나로 설정되어 있어야 함
- `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`

## 코드 변경사항 요약

### 1. DB 스키마 (`database/schema.sql`)
- `interview_sessions` 테이블에 `voice VARCHAR(20)` 컬럼 추가

### 2. OpenAI 라이브러리 (`lib/openai.ts`)
- `textToSpeech(text: string, voice: string = 'nova')` 함수 시그니처 변경
- voice 파라미터를 OpenAI API에 전달

### 3. 면접 시작 API (`pages/api/interview/start.ts`)
- 6가지 목소리 배열 정의: `TTS_VOICES`
- 랜덤 선택 함수: `randomChoice()`
- 세션 생성 시 랜덤 voice 저장
- 첫 질문 TTS 생성 시 선택된 voice 사용

### 4. 면접 답변 API (`pages/api/interview/answer.ts`)
- 세션 조회 시 voice 필드 포함
- 다음 질문 TTS 생성 시 저장된 voice 사용
- **일관성 보장**: 세션 내내 동일한 목소리 유지

### 5. 프론트엔드
- **변경 없음**: 사용자 선택 UI가 원래 없었음
- 백그라운드에서 자동으로 목소리 배정

## 기능 설명

### 랜덤 배정 로직

```typescript
const TTS_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;

function randomChoice<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

const selectedVoice = randomChoice(TTS_VOICES);
```

### 세션 내 일관성

1. 면접 시작 시: 랜덤 voice 선택 → DB 저장
2. 질문 2~5 생성 시: DB에서 voice 조회 → 동일한 voice 사용
3. 결과: 한 면접 세션 내에서는 항상 같은 목소리

## 롤백 절차

만약 문제가 발생하여 롤백이 필요한 경우:

```sql
-- 컬럼 삭제
ALTER TABLE interview_sessions DROP COLUMN voice;
```

⚠️ **주의**: 컬럼 삭제 전 백업 권장

## FAQ

### Q: 기존 면접 결과에 영향이 있나요?
A: 없습니다. voice 컬럼은 DEFAULT 값이 있어서 기존 레코드는 자동으로 'nova'로 설정됩니다.

### Q: 사용자가 목소리를 선택할 수 있나요?
A: 현재는 불가능합니다. 시스템이 자동으로 랜덤 배정합니다. 필요시 추후 사용자 선택 기능 추가 가능합니다.

### Q: 어떤 목소리들이 있나요?
A: OpenAI TTS 목소리 6가지:
- **alloy**: 중성적, 균형잡힌
- **echo**: 남성적, 신뢰감
- **fable**: 영국식, 세련된
- **onyx**: 깊고 권위있는
- **nova**: 명랑한, 친근한 (기본값)
- **shimmer**: 부드럽고 따뜻한

## 참고 자료

- [OpenAI TTS Voice 샘플](https://platform.openai.com/docs/guides/text-to-speech/voice-options)
- [PostgreSQL ALTER TABLE 문서](https://www.postgresql.org/docs/current/sql-altertable.html)

