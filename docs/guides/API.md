# API 문서 📚

## 인증

모든 인증이 필요한 엔드포인트는 `Authorization` 헤더에 JWT 토큰을 포함해야 합니다.

```
Authorization: Bearer <token>
```

---

## 인증 (Auth)

### 회원가입

**POST** `/api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동"
}
```

**Response (201):**
```json
{
  "message": "회원가입 성공",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 로그인

**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "로그인 성공",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 프로필 (Profile)

### 프로필 조회

**GET** `/api/profile`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "profile": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "age": 28,
    "gender": "남성",
    "career_json": [
      {
        "company": "삼성전자",
        "position": "소프트웨어 엔지니어",
        "period": "2020-2023"
      }
    ],
    "education_json": [
      {
        "school": "서울대학교",
        "major": "컴퓨터공학",
        "degree": "학사",
        "graduation_year": 2020
      }
    ],
    "certificates_json": [
      {
        "name": "정보처리기사",
        "issued_date": "2020-05"
      }
    ],
    "skills_json": ["Python", "React", "AWS"]
  }
}
```

### 프로필 수정

**PUT** `/api/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "age": 28,
  "gender": "남성",
  "career_json": [...],
  "education_json": [...],
  "certificates_json": [...],
  "skills_json": [...]
}
```

**Response (200):**
```json
{
  "message": "프로필이 업데이트되었습니다."
}
```

---

## 채용 공고 (Job Postings)

### 공고 업로드

**POST** `/api/job-postings/upload`

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (FormData):**
- `file`: PDF 파일

**Response (201):**
```json
{
  "message": "공고가 업로드되었습니다. 분석을 진행해주세요.",
  "jobPostingId": 1,
  "extractedText": "채용 공고 전체 텍스트..."
}
```

### 공고 분석

**POST** `/api/job-postings/analyze`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "jobPostingId": 1
}
```

**Response (200):**
```json
{
  "message": "공고 분석이 완료되었습니다.",
  "analysis": {
    "company": "네이버",
    "position": "백엔드 개발자",
    "keywords": ["Java", "Spring Boot", "MySQL", "AWS"],
    "must_have": [
      "3년 이상 백엔드 개발 경험",
      "Java/Spring 프레임워크 사용 경험"
    ],
    "nice_to_have": [
      "MSA 아키텍처 설계 경험",
      "AWS 클라우드 인프라 구축 경험"
    ],
    "summary": "네이버에서 백엔드 개발자를 모집합니다..."
  }
}
```

---

## 자기소개서 (Cover Letters)

### 자소서 생성 및 피드백

**POST** `/api/cover-letters/create`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "jobPostingId": 1,
  "contentText": "자기소개서 전체 내용..."
}
```

**Response (201):**
```json
{
  "message": "자기소개서 피드백이 생성되었습니다.",
  "coverLetterId": 1,
  "feedback": {
    "overall_score": 85,
    "overall_feedback": "전반적으로 잘 작성되었습니다...",
    "strengths": [
      "구체적인 프로젝트 경험 제시",
      "직무 요구사항과 잘 연결됨"
    ],
    "improvements": [
      {
        "issue": "성과 수치가 부족함",
        "suggestion": "구체적인 수치와 결과를 추가하세요",
        "example": "'사용자 증가율 30% 달성' 등"
      }
    ],
    "interview_questions": [
      "프로젝트에서 가장 어려웠던 기술적 문제는?",
      "팀원과의 갈등을 어떻게 해결했나요?"
    ]
  }
}
```

### 자소서 조회

**GET** `/api/cover-letters/[id]`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "coverLetter": {
    "id": 1,
    "content_text": "자기소개서 내용...",
    "created_at": "2024-01-01T00:00:00Z",
    "job_posting_id": 1,
    "title": "백엔드 개발자",
    "company_name": "네이버",
    "feedback_json": { ... }
  }
}
```

---

## 면접 (Interview)

### 면접 시작

**POST** `/api/interview/start`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "coverLetterId": 1
}
```

**Response (201):**
```json
{
  "message": "면접이 시작되었습니다.",
  "sessionId": 1,
  "turnNumber": 1,
  "questionText": "간단히 1분 자기소개 부탁드립니다.",
  "questionAudioUrl": "https://bucket.s3.region.amazonaws.com/interview-questions/..."
}
```

### 답변 제출

**POST** `/api/interview/answer`

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (FormData):**
- `sessionId`: 1
- `turnNumber`: 1
- `audio`: 녹음 파일 (Blob)

**Response (200) - 진행 중:**
```json
{
  "message": "답변이 제출되었습니다.",
  "isCompleted": false,
  "sessionId": 1,
  "turnNumber": 2,
  "questionText": "이전 답변에서 언급한 프로젝트에 대해 자세히 설명해주세요.",
  "questionAudioUrl": "https://..."
}
```

**Response (200) - 완료:**
```json
{
  "message": "면접이 완료되었습니다.",
  "isCompleted": true,
  "sessionId": 1
}
```

### 면접 결과 조회

**GET** `/api/interview/result/[id]`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "session": {
    "id": 1,
    "status": "completed",
    "startedAt": "2024-01-01T10:00:00Z",
    "completedAt": "2024-01-01T10:15:00Z",
    "finalFeedback": {
      "overall_feedback": "전반적으로 우수한 면접이었습니다...",
      "attitude_score": 90,
      "content_score": 85,
      "consistency_score": 88,
      "job_fit_score": 92,
      "per_turn_feedback": [
        {
          "turn_number": 1,
          "question": "1분 자기소개...",
          "answer": "사용자 답변...",
          "feedback": "자신감 있는 답변이었습니다...",
          "score": 90
        }
      ]
    }
  },
  "turns": [
    {
      "turn_number": 1,
      "question_text": "1분 자기소개...",
      "user_answer_text": "사용자 답변...",
      "user_answer_audio_s3_url": "https://..."
    }
  ]
}
```

---

## 에러 응답

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "error": "에러 메시지"
}
```

**HTTP 상태 코드:**
- `400`: Bad Request (잘못된 요청)
- `401`: Unauthorized (인증 실패)
- `404`: Not Found (리소스 없음)
- `405`: Method Not Allowed (허용되지 않은 메서드)
- `500`: Internal Server Error (서버 오류)

