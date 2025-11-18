# 면접 질문 생성 로직 리팩토링 - 컨텍스트 기반 강화

## 📋 개요

면접 질문 생성 로직을 **완전히 컨텍스트 기반**으로 리팩토링하여, 지원자의 프로필, 경력, 자기소개서, 채용공고 요건을 종합적으로 분석한 개인화된 질문을 생성합니다.

---

## ✨ 주요 개선사항

### 1. **전체 컨텍스트 수집** ✅

#### 이전 (Generic)
```typescript
// 제한적인 프로필 정보
SELECT age, gender, career_json, education_json 
FROM user_profiles WHERE user_id = $1
```

#### 개선 후 (Context-Aware)
```typescript
// 모든 프로필 필드 포함
SELECT age, gender, 
       current_job,        // 현재 직무
       career_summary,     // 경력 요약
       certifications,     // 자격증
       career_json, education_json, certificates_json, skills_json
FROM user_profiles WHERE user_id = $1
```

**추가된 정보:**
- ✅ `current_job` - 현재 직무 (직무 연관성 평가)
- ✅ `career_summary` - 경력 요약 (빠른 컨텍스트 파악)
- ✅ `certifications` - 자격증 (역량 검증)

---

### 2. **채용공고 전체 텍스트 포함** ✅

#### 이전
```typescript
jobPosting: {
  title: coverLetter.title,
  company_name: coverLetter.company_name,
  analysis_json: coverLetter.analysis_json,  // 분석 결과만
}
```

#### 개선 후
```typescript
jobPosting: {
  title: coverLetter.title,
  company_name: coverLetter.company_name,
  extracted_text: coverLetter.extracted_text,  // ✅ 원문 추가
  analysis_json: coverLetter.analysis_json,
}
```

**효과:**
- 분석 결과뿐만 아니라 원문도 참고하여 더 정확한 질문 생성
- 분석 과정에서 누락될 수 있는 세부 요구사항 반영

---

### 3. **OpenAI 프롬프트 대폭 강화** ✅

#### 이전 (Generic Prompt)
```typescript
systemPrompt = `너는 ${title} 분야의 최고 전문가 면접관이야.`;

userPrompt = `첫 번째 질문을 생성해줘. 1분 자기소개 또는 지원 동기를 물어봐.`;
```

**문제점:**
- 일반적이고 포괄적인 질문
- 지원자 개인 정보 미반영
- 채용공고 요건과 연결 부족

#### 개선 후 (Context-Aware Prompt)

**시스템 프롬프트:**
```typescript
const systemPrompt = `당신은 ${company_name}의 ${title} 포지션 채용을 담당하는 전문 면접관입니다.

# 역할 및 임무
- 지원자의 프로필, 자기소개서, 채용공고 요건을 종합적으로 분석하여 질문을 생성합니다.
- 실제 면접처럼 자연스럽고 날카로운 질문을 던져야 합니다.
- 지원자의 역량, 경험, 직무 적합성을 평가할 수 있는 질문을 만들어야 합니다.

# 질문 생성 가이드라인
1. **개인화**: 지원자의 경력, 현재 직무, 자기소개서 내용을 반드시 반영
2. **직무 적합성**: 채용공고의 필수 요건과 우대 사항을 고려
3. **구체성**: 추상적이지 않고 구체적인 경험/사례를 물어볼 것
4. **깊이**: 단순 사실 확인이 아닌 사고력과 문제 해결 능력을 평가
5. **자연스러움**: 대화 흐름을 고려한 질문 (꼬리 질문 포함)
`;
```

**사용자 프롬프트 (첫 번째 질문):**
```typescript
userPrompt = `
## 지원자 프로필
- 나이: ${age}
- 현재 직무: ${current_job}
- 경력 요약: ${career_summary}
- 자격증: ${certifications}
- 상세 경력: ${JSON.stringify(career_json)}
- 학력: ${JSON.stringify(education_json)}

## 채용공고 정보
- 회사: ${company_name}
- 직무: ${title}
- 필수 요건: ${must_have}
- 우대 사항: ${nice_to_have}
- 핵심 키워드: ${keywords}

## 지원자 자기소개서
${coverLetter}

---

**요청사항:**
1. **1분 자기소개**: 지원자의 경력과 현재 직무를 고려한 자기소개 요청
2. **지원 동기**: 왜 이 회사의 이 직무에 지원했는지, 자기소개서에 언급된 내용과 연결
3. **핵심 역량**: 채용공고의 필수 요건 중 하나를 선택하여 관련 경험 질문
`;
```

**효과:**
- ✅ 지원자별 **개인화된 질문**
- ✅ 채용공고 요건과 **직무 적합성** 평가
- ✅ 자기소개서 내용과 **연결된 심화 질문**
- ✅ **구체적인 경험**을 묻는 질문

---

### 4. **질문 전략 체계화** ✅

#### 꼬리 질문 (Follow-up)
```typescript
**질문 전략 선택:**
1. **꼬리 질문**: 직전 답변에서 더 깊이 파고들 수 있는 부분이 있다면
   - 예: 구체적인 수치, 과정, 결과, 어려움, 해결 방법 등
```

**예시:**
- 답변: "팀원들과 협업하여 프로젝트를 완료했습니다."
- 꼬리 질문: "협업 과정에서 의견 충돌이 있었다면 어떻게 해결하셨나요?"

#### 새로운 주제 질문
```typescript
2. **새로운 주제**: 꼬리 질문이 부자연스럽다면 새로운 주제로 전환
   - 자기소개서에 언급된 다른 경험
   - 채용공고의 필수 요건 중 아직 다루지 않은 부분
   - 지원자의 프로필에서 주목할 만한 경력/기술
```

#### 상황 질문 (Situational)
```typescript
3. **상황 질문** (후반부 추천): 실제 직무 상황을 가정한 문제 해결 질문
   - 채용공고의 핵심 업무와 연결
   - 지원자의 경험을 바탕으로 답할 수 있는 수준
```

---

### 5. **질문 검증 로직 추가** ✅

```typescript
// 질문 검증 (너무 짧거나 비어있으면 기본 질문 반환)
if (questionText.length < 10) {
  return turnNumber === 1 
    ? "간단히 자기소개 부탁드립니다."
    : "이전 답변에 대해 조금 더 구체적으로 설명해주시겠습니까?";
}
```

**안전장치:**
- API 오류 시에도 면접 진행 가능
- 최소 품질 보장

---

## 📊 변경된 파일 목록

### 1. `pages/api/interview/start.ts`
**변경사항:**
- ✅ 프로필 쿼리에 `current_job`, `career_summary`, `certifications` 추가
- ✅ 채용공고 쿼리에 `extracted_text` 추가
- ✅ 컨텍스트 객체에 전체 정보 전달

### 2. `pages/api/interview/answer.ts`
**변경사항:**
- ✅ 프로필 쿼리 확장 (2곳)
- ✅ 채용공고 정보에 `extracted_text` 포함 (2곳)
- ✅ 다음 질문 생성 시 전체 컨텍스트 전달

### 3. `lib/openai.ts`
**변경사항:**
- ✅ `InterviewContext` 인터페이스 타입 강화
- ✅ `generateInterviewQuestion` 함수 완전 재작성
  - 프로필 정보 정리 로직
  - 채용공고 정보 정리 로직
  - 시스템 프롬프트 강화
  - 사용자 프롬프트 구조화
  - 질문 전략 체계화
  - 질문 검증 로직 추가

---

## 🎯 기대 효과

### Before (Generic Questions)
```
Q1: "간단히 자기소개 부탁드립니다."
Q2: "지원 동기가 무엇인가요?"
Q3: "강점과 약점을 말씀해주세요."
```

**문제점:**
- 누구에게나 동일한 질문
- 개인 경력/스펙 미반영
- 채용공고 요건과 무관

### After (Context-Aware Questions)
```
Q1: "현재 백엔드 개발자로 근무 중이시라고 하셨는데, 
     Python/Django에서 Node.js/Express로 전환하려는 이유가 무엇인가요?"
     
Q2: "자기소개서에서 '대용량 트래픽 처리 경험'을 언급하셨는데, 
     구체적으로 어떤 규모였고 어떤 기술을 사용하셨나요?"
     
Q3: "채용공고에서 'AWS 인프라 구축 경험'을 필수 요건으로 하고 있습니다. 
     실제 프로젝트에서 어떤 AWS 서비스를 사용해보셨는지, 
     특히 비용 최적화 경험이 있다면 말씀해주세요."
```

**효과:**
- ✅ **개인화**: 지원자의 현재 직무, 경력 반영
- ✅ **구체성**: 자기소개서 내용과 연결된 심화 질문
- ✅ **직무 적합성**: 채용공고 필수 요건 직접 평가
- ✅ **깊이**: 단순 확인이 아닌 경험과 역량 검증

---

## 🧪 테스트 방법

### 1. 프로필 데이터 준비
```sql
UPDATE user_profiles 
SET current_job = 'Backend Developer',
    career_summary = '3년차 백엔드 개발자, Python/Django 주력',
    certifications = 'AWS Solutions Architect Associate'
WHERE user_id = 1;
```

### 2. 자기소개서 작성
- 구체적인 프로젝트 경험 포함
- 채용공고 필수 요건과 연결
- 수치와 성과 명시

### 3. 면접 시작
```bash
POST /api/interview/start
{
  "coverLetterId": 1
}
```

### 4. 질문 확인
**체크 포인트:**
- [ ] 현재 직무(current_job)가 질문에 반영되었는가?
- [ ] 자기소개서 내용과 연결된 질문인가?
- [ ] 채용공고 필수 요건을 평가하는 질문인가?
- [ ] 구체적인 경험/사례를 묻는 질문인가?

---

## 📈 성능 및 비용

### Token 사용량
- **이전**: ~500 tokens/question
- **현재**: ~800-1000 tokens/question (컨텍스트 증가)
- **증가율**: 약 60-100% ↑

### API 비용 (GPT-4o 기준)
- **Input**: $2.50 / 1M tokens
- **Output**: $10.00 / 1M tokens
- **면접당 비용 (5개 질문)**: 약 $0.01-0.02

**비용 대비 효과:**
- ✅ 질문 품질 대폭 향상
- ✅ 면접 만족도 증가
- ✅ 직무 적합성 평가 정확도 향상

---

## 🔧 추가 개선 가능 영역

### 1. 질문 다양성 증대
```typescript
// 현재: temperature=0.7
// 개선: 질문 유형별 temperature 조정
const temperature = turnNumber === 1 ? 0.5 : 0.8;
```

### 2. 질문 캐싱
```typescript
// 동일한 채용공고 + 유사한 프로필의 경우 질문 재사용
// Redis 캐싱으로 비용 절감
```

### 3. A/B 테스트
```typescript
// Generic vs Context-Aware 질문 비교
// 사용자 만족도 및 면접 결과 분석
```

### 4. 다국어 지원
```typescript
// 영어, 중국어 등 다국어 면접 지원
// 언어별 프롬프트 최적화
```

---

## 📚 관련 문서

- **[API 문서](../API.md)** - Interview API 상세 스펙
- **[환경 변수 가이드](./ENVIRONMENT_VARIABLES.md)** - OPENAI_API_KEY 설정
- **[배포 가이드](../DEPLOYMENT.md)** - 프로덕션 배포 방법

---

## 🆘 트러블슈팅

### OpenAI API 에러

**증상:**
```
Error: 면접 질문 생성에 실패했습니다.
```

**해결:**
1. `OPENAI_API_KEY` 환경 변수 확인
2. API 사용량 한도 확인
3. 네트워크 연결 확인

### 질문이 너무 일반적

**원인:**
- 프로필 정보가 비어있음
- 자기소개서 내용이 부족

**해결:**
```sql
-- 프로필 확인
SELECT * FROM user_profiles WHERE user_id = ?;

-- 자기소개서 확인
SELECT content_text FROM cover_letters WHERE id = ?;
```

### 질문 검증 실패 (기본 질문 반환)

**원인:**
- GPT-4o가 너무 짧은 응답 생성
- API 타임아웃

**해결:**
- `max_tokens` 증가 (현재 300)
- `temperature` 조정
- 프롬프트 개선

---

## ✅ 체크리스트

리팩토링 완료 확인:

- [x] `user_profiles` 쿼리에 `current_job`, `career_summary`, `certifications` 포함
- [x] `job_postings` 쿼리에 `extracted_text` 포함
- [x] `InterviewContext` 인터페이스 타입 정의
- [x] `generateInterviewQuestion` 프롬프트 강화
- [x] 질문 전략 체계화 (꼬리 질문, 새 주제, 상황 질문)
- [x] 질문 검증 로직 추가
- [x] `start.ts` 업데이트
- [x] `answer.ts` 업데이트
- [ ] 로컬 테스트
- [ ] 프로덕션 배포
- [ ] 실제 사용자 피드백 수집

---

**작성일:** 2025-11-18  
**버전:** 2.0 (Context-Aware)  
**작성자:** AI Assistant

