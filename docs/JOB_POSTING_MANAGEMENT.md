# 채용 공고 관리 기능

## 개요

사용자가 업로드하고 분석한 채용 공고를 저장, 조회, 선택, 삭제할 수 있는 기능입니다.

## 주요 기능

### 1. 공고 히스토리 페이지 (`/job-postings/history`)

- 사용자가 업로드한 모든 공고를 최신순으로 표시
- 각 공고의 상태 (분석 완료, 대기, 실패) 표시
- 공고 선택 시 자기소개서 작성 페이지로 이동
- 공고 삭제 기능 (연결된 자소서도 CASCADE로 삭제)
- 키워드 태그 미리보기

### 2. 공고 상세보기 페이지 (`/job-postings/[id]`)

- 공고의 전체 정보 표시
- AI 분석 결과 상세 보기
- 원본 텍스트 확인
- 원본 PDF 다운로드 (업로드한 경우)
- 자기소개서 작성 페이지로 바로 이동

### 3. 자기소개서 작성 페이지 개선 (`/cover-letters/create`)

- 공고 ID 없이 접근 시 공고 선택 안내
- 선택된 공고 정보 표시
- 공고 변경 버튼
- AI 분석 결과 미리보기

## API 엔드포인트

### GET `/api/job-postings/history`

사용자의 모든 공고 히스토리를 조회합니다.

**응답:**
```json
{
  "jobPostings": [
    {
      "id": 1,
      "title": "백엔드 개발자",
      "companyName": "ABC Tech",
      "extractedText": "...",
      "analysisJson": { ... },
      "status": "analyzed",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10
}
```

### GET `/api/job-postings/[id]`

특정 공고의 상세 정보를 조회합니다.

**응답:**
```json
{
  "jobPosting": {
    "id": 1,
    "title": "백엔드 개발자",
    "companyName": "ABC Tech",
    "originalS3Url": "https://...",
    "extractedText": "...",
    "analysisJson": { ... },
    "status": "analyzed",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE `/api/job-postings/[id]`

특정 공고를 삭제합니다. (CASCADE로 연결된 자소서도 삭제됨)

**응답:**
```json
{
  "message": "공고가 성공적으로 삭제되었습니다.",
  "id": 1
}
```

## 데이터베이스 구조

### job_postings 테이블

이미 존재하는 테이블이며, 다음 필드를 포함합니다:

- `id`: 공고 ID (Primary Key)
- `user_id`: 사용자 ID (Foreign Key)
- `title`: 공고 제목
- `company_name`: 회사명
- `original_s3_url`: 원본 PDF S3 URL
- `extracted_text`: 추출된 텍스트
- `analysis_json`: AI 분석 결과 (JSONB)
- `status`: 상태 (pending, analyzed, failed)
- `created_at`: 생성 시간
- `updated_at`: 수정 시간

## 사용 흐름

### 1. 공고 업로드 및 분석

```
사용자 → /job-postings/upload → PDF 업로드 또는 텍스트 입력
  → AI 분석 → DB 저장 → analyzed 상태로 업데이트
```

### 2. 자기소개서 작성

```
사용자 → /job-postings/history → 공고 선택
  → /cover-letters/create?jobPostingId=1 → 자소서 작성
  → AI 피드백 생성
```

### 3. 공고 관리

```
사용자 → /job-postings/history
  → 상세보기: /job-postings/[id]
  → 삭제: DELETE /api/job-postings/[id]
```

## 프론트엔드 컴포넌트

### ApiClient 메서드

```typescript
// 공고 히스토리 조회
await apiClient.getJobPostingHistory();

// 단일 공고 조회
await apiClient.getJobPosting(id);

// 공고 삭제
await apiClient.deleteJobPosting(id);
```

## 보안

- 모든 API는 JWT 인증 필요 (`withAuth` 미들웨어)
- 사용자는 자신의 공고만 조회/삭제 가능
- SQL 인젝션 방지 (Parameterized Query 사용)

## UI/UX 특징

### 공고 카드
- 상태별 색상 구분 (초록: 완료, 노랑: 대기, 빨강: 실패)
- 키워드 태그 미리보기 (최대 5개)
- 호버 효과로 선택 가능한 카드임을 표시
- 삭제 버튼 (확인 다이얼로그 포함)

### 공고 선택 플로우
- 공고 ID 없이 자소서 작성 페이지 접근 시 선택 안내
- "저장된 공고 선택" 또는 "새 공고 업로드" 선택 가능
- 선택된 공고 정보 및 분석 결과 표시

## 향후 개선 사항

- [ ] 공고 검색 기능
- [ ] 공고 태그/카테고리 분류
- [ ] 공고 즐겨찾기 기능
- [ ] 공고 공유 기능
- [ ] 공고 비교 기능

