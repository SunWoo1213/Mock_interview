/**
 * OpenAI API 통합 유틸리티 (GPT-4o, TTS, STT)
 */
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================== GPT-4o 관련 ====================

export interface JobPostingAnalysis {
  keywords: string[];
  must_have: string[];
  nice_to_have: string[];
  summary: string;
  position: string;
  company: string;
}

/**
 * 채용 공고 분석
 */
export async function analyzeJobPosting(
  extractedText: string
): Promise<JobPostingAnalysis> {
  const prompt = `너는 전문 HR 매니저이자 채용 전문가야. 
다음 채용공고 텍스트를 분석해서 JSON 형식으로 추출해줘:

채용공고 텍스트:
${extractedText}

다음 형식의 JSON으로 응답해줘:
{
  "company": "회사명",
  "position": "직무명",
  "keywords": ["핵심 기술 키워드 10개"],
  "must_have": ["필수 자격 요건"],
  "nice_to_have": ["우대 사항"],
  "summary": "공고 요약 (2-3문장)"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: '당신은 전문 HR 매니저입니다.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}');
  } catch (error) {
    console.error('공고 분석 에러:', error);
    throw new Error('채용 공고 분석에 실패했습니다.');
  }
}

export interface CoverLetterFeedback {
  summary: string; // 전문적인 총평
  strengths: string[]; // 강점 목록
  weaknesses: string[]; // 약점/보완점 목록
  detailedAnalysis: Array<{
    section: string; // 서론/본론/결론 등
    feedback: string; // 섹션별 상세 피드백
  }>;
  actionableFixes: Array<{
    original: string; // 원본 약한 문장
    improved: string; // 개선된 문장
    reason: string; // 개선 이유
  }>;
  interview_questions: string[]; // 예상 면접 질문
}

/**
 * 자기소개서 피드백 생성 (고급 분석)
 */
export async function generateCoverLetterFeedback(
  userProfile: any,
  jobPosting: any,
  coverLetterText: string
): Promise<CoverLetterFeedback> {
  const systemPrompt = `당신은 글로벌 기업의 수석 채용 담당자이자 기술 채용 전문가입니다.

# 역할 및 전문성
- 10년 이상의 채용 경험을 보유한 인사 전문가
- ${jobPosting.title || '해당 직무'} 분야의 깊은 이해
- STAR 기법, 임팩트 중심 작성법에 대한 전문 지식
- 명확하고 실용적인 피드백 제공

# 평가 기준
1. **명확성 및 논리**: 구조가 논리적이고 읽기 쉬운가?
2. **직무 적합성**: 공고의 요구사항을 명확히 언급하는가?
3. **임팩트 (STAR 기법)**: 상황(Situation), 과제(Task), 행동(Action), 결과(Result)를 포함하는가?
4. **구체성**: 추상적인 표현이 아닌 구체적인 사례와 수치를 제시하는가?
5. **차별성**: 다른 지원자와 구별되는 독특한 경험이나 역량을 보여주는가?`;

  const userPrompt = `다음 자기소개서를 채용 공고와 비교하여 전문적으로 분석해주세요.

## 📋 채용 공고 정보
**회사**: ${jobPosting.company_name || '미상'}
**직무**: ${jobPosting.title || '미상'}
**핵심 키워드**: ${JSON.stringify(jobPosting.analysis_json?.keywords || [])}

**필수 요건**:
${jobPosting.analysis_json?.must_have?.map((item: string, idx: number) => `${idx + 1}. ${item}`).join('\n') || '제공되지 않음'}

**우대 사항**:
${jobPosting.analysis_json?.nice_to_have?.map((item: string, idx: number) => `${idx + 1}. ${item}`).join('\n') || '제공되지 않음'}

## 👤 지원자 프로필
- 나이: ${userProfile.age || '미상'}
- 현재 직무: ${userProfile.current_job || '미상'}
- 경력 요약: ${userProfile.career_summary || '제공되지 않음'}
- 경력 상세: ${JSON.stringify(userProfile.career_json || [])}
- 학력: ${JSON.stringify(userProfile.education_json || [])}
- 자격증: ${userProfile.certifications || JSON.stringify(userProfile.certificates_json || [])}

## 📝 자기소개서 전문
${coverLetterText}

---

위 정보를 바탕으로 다음 JSON 형식으로 깊이 있는 분석을 제공해주세요:

\`\`\`json
{
  "summary": "전체적으로 직무 경험이 잘 드러나는 자기소개서입니다. 다만 구체적인 성과 수치와 STAR 기법을 보완하면 더욱 강력해질 것입니다.",
  "strengths": [
    "채용 공고의 필수 요건인 'React 개발 경험'을 명확히 언급하고 있습니다.",
    "프로젝트 맥락과 본인의 역할이 명확하게 서술되어 있습니다.",
    "기술 스택을 구체적으로 나열하여 역량을 잘 보여줍니다."
  ],
  "weaknesses": [
    "정량적 성과(사용자 증가율, 성능 개선 수치 등)가 부족합니다.",
    "STAR 기법의 'Result(결과)' 부분이 약합니다. 프로젝트의 비즈니스 임팩트를 추가하세요.",
    "회사의 비전이나 직무에 대한 열정이 잘 드러나지 않습니다."
  ],
  "detailedAnalysis": [
    {
      "section": "서론",
      "feedback": "자기소개는 간결하나, 지원 동기가 명확하지 않습니다. 회사의 특정 가치나 제품에 대한 관심을 추가하면 좋습니다."
    },
    {
      "section": "본론 - 프로젝트 경험",
      "feedback": "기술 스택과 역할은 잘 서술되었으나, '어떤 문제를 해결했는가'와 '그 결과 어떤 성과가 있었는가'가 부족합니다. STAR 기법을 활용하세요."
    },
    {
      "section": "결론",
      "feedback": "입사 후 포부가 추상적입니다. 구체적으로 '어떤 프로젝트에 기여하고 싶은지', '어떤 가치를 창출할 것인지' 명시하세요."
    }
  ],
  "actionableFixes": [
    {
      "original": "React를 사용하여 웹 애플리케이션을 개발했습니다.",
      "improved": "React와 TypeScript를 활용하여 월 10만 사용자가 이용하는 전자상거래 플랫폼의 프론트엔드를 개발했으며, 페이지 로딩 속도를 40% 개선했습니다.",
      "reason": "구체적인 규모(10만 사용자)와 정량적 성과(40% 개선)를 추가하여 임팩트를 명확히 했습니다."
    },
    {
      "original": "팀원들과 협업하여 프로젝트를 성공적으로 완료했습니다.",
      "improved": "5명의 백엔드 개발자와 긴밀히 협업하여 RESTful API 설계 단계부터 참여했고, 주 2회 코드 리뷰를 통해 버그를 출시 전 90% 감소시켰습니다.",
      "reason": "협업의 구체적인 방식과 정량적 결과를 추가하여 '어떻게' 협업했는지 보여줍니다."
    },
    {
      "original": "귀사에 입사하여 성장하고 싶습니다.",
      "improved": "귀사의 AI 기반 추천 시스템 개발팀에 합류하여, 제 React 및 머신러닝 인터페이스 구현 경험을 바탕으로 사용자 경험을 혁신하고, 나아가 팀의 기술 블로그 기고를 통해 개발 문화 확산에도 기여하고 싶습니다.",
      "reason": "추상적인 '성장'이 아닌 구체적인 팀, 기여 방식, 그리고 부가 가치까지 명시했습니다."
    }
  ],
  "interview_questions": [
    "자기소개서에 언급한 '페이지 로딩 속도 40% 개선' 과정을 구체적으로 설명해주시겠습니까? 어떤 최적화 기법을 사용했나요?",
    "React 프로젝트에서 가장 어려웠던 기술적 도전은 무엇이었고, 어떻게 해결하셨나요?",
    "팀 협업 중 의견 충돌이 있었던 경험과 해결 방법을 말씀해주세요.",
    "우리 회사의 제품/서비스에 대해 알고 계신 것과, 개선하고 싶은 점이 있다면 무엇인가요?",
    "입사 후 3개월, 6개월, 1년 차에 각각 어떤 목표를 달성하고 싶으신가요?"
  ]
}
\`\`\`

**중요 지침**:
- strengths, weaknesses는 각각 3-5개 항목
- detailedAnalysis는 자기소개서의 주요 섹션별(서론, 본론, 결론 등) 분석
- actionableFixes는 **반드시 3개**의 구체적인 수정 예시 제공
- 모든 피드백은 실용적이고 즉시 적용 가능해야 함`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7, // 창의적이고 구체적인 피드백을 위해 약간 높임
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content || '{}');
    
    console.log('✅ [Cover Letter Feedback] AI 분석 완료');
    
    // 데이터 구조 검증 및 정규화
    const feedback: CoverLetterFeedback = {
      summary: String(parsed.summary || '종합 분석이 생성되지 않았습니다.'),
      strengths: Array.isArray(parsed.strengths) 
        ? parsed.strengths.map((s: any) => String(s)) 
        : [],
      weaknesses: Array.isArray(parsed.weaknesses)
        ? parsed.weaknesses.map((w: any) => String(w))
        : [],
      detailedAnalysis: Array.isArray(parsed.detailedAnalysis)
        ? parsed.detailedAnalysis.map((item: any) => ({
            section: String(item.section || ''),
            feedback: String(item.feedback || ''),
          }))
        : [],
      actionableFixes: Array.isArray(parsed.actionableFixes)
        ? parsed.actionableFixes.map((fix: any) => ({
            original: String(fix.original || ''),
            improved: String(fix.improved || ''),
            reason: String(fix.reason || ''),
          })).slice(0, 3) // 최대 3개만
        : [],
      interview_questions: Array.isArray(parsed.interview_questions)
        ? parsed.interview_questions.map((q: any) => String(q))
        : [],
    };
    
    return feedback;
  } catch (error) {
    console.error('❌ [Cover Letter Feedback] 피드백 생성 에러:', error);
    throw new Error('자기소개서 피드백 생성에 실패했습니다.');
  }
}

// ==================== 면접 관련 ====================

export interface InterviewContext {
  userProfile: {
    age?: number;
    gender?: string;
    current_job?: string;
    career_summary?: string;
    certifications?: string;
    career_json?: any;
    education_json?: any;
    certificates_json?: any;
    skills_json?: any;
  };
  jobPosting: {
    title?: string;
    company_name?: string;
    extracted_text?: string;
    analysis_json?: {
      keywords?: string[];
      must_have?: string[];
      nice_to_have?: string[];
      summary?: string;
      position?: string;
      company?: string;
    };
  };
  coverLetter: string;
  conversationHistory: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * 면접 질문 생성 (컨텍스트 기반 강화)
 */
export async function generateInterviewQuestion(
  context: InterviewContext,
  turnNumber: number,
  totalQuestions: number = 5
): Promise<string> {
  // 프로필 정보 정리
  const profileSummary = `
- 나이: ${context.userProfile.age || '미상'}
- 현재 직무: ${context.userProfile.current_job || '미상'}
- 경력 요약: ${context.userProfile.career_summary || '제공되지 않음'}
- 자격증: ${context.userProfile.certifications || '없음'}
- 상세 경력: ${JSON.stringify(context.userProfile.career_json || [], null, 2)}
- 학력: ${JSON.stringify(context.userProfile.education_json || [], null, 2)}
- 보유 기술: ${JSON.stringify(context.userProfile.skills_json || [], null, 2)}`.trim();

  // 채용공고 정보 정리
  const jobSummary = `
- 회사: ${context.jobPosting.company_name || '미상'}
- 직무: ${context.jobPosting.title || '미상'}
- 직무 요약: ${context.jobPosting.analysis_json?.summary || '제공되지 않음'}
- 필수 요건: ${JSON.stringify(context.jobPosting.analysis_json?.must_have || [], null, 2)}
- 우대 사항: ${JSON.stringify(context.jobPosting.analysis_json?.nice_to_have || [], null, 2)}
- 핵심 키워드: ${JSON.stringify(context.jobPosting.analysis_json?.keywords || [], null, 2)}`.trim();

  const systemPrompt = `당신은 ${context.jobPosting.company_name || '회사'}의 ${context.jobPosting.title || '직무'} 포지션 채용을 담당하는 전문 면접관입니다.

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

# 금지 사항
- 자기소개서에 이미 명시된 내용을 그대로 반복하는 질문
- 지나치게 일반적이거나 포괄적인 질문
- 예/아니오로 답할 수 있는 단순 질문`;

  let userPrompt = '';

  if (turnNumber === 1) {
    userPrompt = `# 첫 번째 질문 생성 요청

## 지원자 프로필
${profileSummary}

## 채용공고 정보
${jobSummary}

## 지원자 자기소개서
${context.coverLetter}

---

**요청사항:**
첫 번째 질문을 생성해주세요. 다음 중 하나를 선택하여 질문하되, 지원자의 프로필과 자기소개서 내용을 반영하여 구체적으로 물어보세요:

1. **1분 자기소개**: 지원자의 경력과 현재 직무를 고려한 자기소개 요청
2. **지원 동기**: 왜 이 회사의 이 직무에 지원했는지, 자기소개서에 언급된 내용과 연결하여 질문
3. **핵심 역량**: 채용공고의 필수 요건 중 하나를 선택하여 관련 경험 질문

**출력 형식:** 질문 문장만 출력 (설명 없이)
**예시:** "현재 ${context.userProfile.current_job || '직무'}에서 근무하고 계신다고 하셨는데, 간단히 자기소개 부탁드립니다."`;
  } else {
    userPrompt = `# ${turnNumber}번째 질문 생성 요청 (${turnNumber}/${totalQuestions})

## 지원자 프로필
${profileSummary}

## 채용공고 정보
${jobSummary}

## 지원자 자기소개서
${context.coverLetter}

## 이전 대화 내용
${context.conversationHistory.map((turn, idx) => 
  `**질문 ${idx + 1}:** ${turn.question}\n**답변 ${idx + 1}:** ${turn.answer || '(답변 없음)'}`
).join('\n\n')}

---

**요청사항:**
위 대화 흐름을 고려하여 ${turnNumber}번째 질문을 생성해주세요.

**질문 전략 선택:**
1. **꼬리 질문**: 직전 답변에서 더 깊이 파고들 수 있는 부분이 있다면 꼬리 질문
   - 예: 구체적인 수치, 과정, 결과, 어려움, 해결 방법 등
   
2. **새로운 주제**: 꼬리 질문이 부자연스럽다면 새로운 주제로 전환
   - 자기소개서에 언급된 다른 경험
   - 채용공고의 필수 요건 중 아직 다루지 않은 부분
   - 지원자의 프로필에서 주목할 만한 경력/기술

3. **상황 질문** (후반부 추천): 실제 직무 상황을 가정한 문제 해결 질문
   - 채용공고의 핵심 업무와 연결
   - 지원자의 경험을 바탕으로 답할 수 있는 수준

**중요:** 
- 지원자의 경력(${context.userProfile.current_job || '미상'})과 지원 직무(${context.jobPosting.title || '미상'})의 연관성을 고려
- 자기소개서 내용과 연결되는 구체적인 질문
- 단순 확인이 아닌 사고력을 요구하는 질문

**출력 형식:** 질문 문장만 출력 (설명 없이)`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const questionText = response.choices[0].message.content?.trim() || '';
    
    // 질문 검증 (너무 짧거나 비어있으면 기본 질문 반환)
    if (questionText.length < 10) {
      return turnNumber === 1 
        ? "간단히 자기소개 부탁드립니다."
        : "이전 답변에 대해 조금 더 구체적으로 설명해주시겠습니까?";
    }

    return questionText;
  } catch (error) {
    console.error('면접 질문 생성 에러:', error);
    throw new Error('면접 질문 생성에 실패했습니다.');
  }
}

export interface FinalInterviewFeedback {
  overall_feedback: string; // 종합 평가 (태도, 일관성, 합격 가능성)
  per_turn_feedback: Array<{
    turn_number: number;
    question: string;
    answer: string;
    user_answer_summary: string; // 사용자 답변 요약
    strengths: string[]; // 해당 답변의 좋았던 점
    improvements: string[]; // 해당 답변의 개선할 점
    better_answer_example: string; // 더 나은 모범 답안 예시
  }>;
  is_early_finish?: boolean;
  total_questions_answered?: number;
}

/**
 * 최종 면접 피드백 생성
 * @param context - 면접 컨텍스트 (사용자 프로필, 채용공고, 자기소개서)
 * @param turns - 질문/답변 턴 배열
 * @param isEarlyFinish - 조기 종료 여부 (기본값: false)
 */
export async function generateFinalInterviewFeedback(
  context: InterviewContext,
  turns: Array<{ question_text: string; user_answer_text: string }>,
  isEarlyFinish: boolean = false
): Promise<FinalInterviewFeedback> {
  const totalQuestionsAnswered = turns.filter(t => t.user_answer_text).length;
  
  const earlyFinishNote = isEarlyFinish 
    ? `\n\n⚠️ **중요**: 사용자가 면접을 조기 종료했습니다 (총 ${totalQuestionsAnswered}개 질문에 답변).
- 질문 수가 적다고 절대로 점수를 깎지 마세요.
- 제공된 질문/답변만 분석하고, "더 많은 질문이 있었다면..."과 같은 가정은 하지 마세요.
- 종합 피드백에서 면접이 조기 종료되었음을 자연스럽게 언급해주세요. (예: "면접을 조기 종료하셨지만, ${totalQuestionsAnswered}개의 질문에 대한 답변을 바탕으로...")
- 답변의 질과 깊이에 집중하여 피드백을 제공하세요.`
    : '';
  
  const systemPrompt = `당신은 ${context.jobPosting.title || '해당'} 분야의 최고 전문가 면접관이자 피드백 전문가입니다.

# 역할 및 전문성
- 10년 이상의 채용 경험을 보유한 인사 전문가
- 지원자의 답변을 깊이 있게 분석하고 건설적인 피드백 제공
- STAR 기법(Situation, Task, Action, Result) 기반 평가
- 각 답변의 강점과 개선점을 명확히 구분

# 평가 기준
1. **답변의 구조**: STAR 기법을 활용했는가?
2. **구체성**: 추상적인 표현이 아닌 구체적인 사례와 수치를 제시했는가?
3. **깊이**: 단순 사실 나열이 아닌 통찰과 배움을 보여주는가?
4. **직무 적합성**: 채용공고의 요구사항과 연결되는가?
5. **커뮤니케이션**: 명확하고 논리적으로 전달했는가?`;

  const userPrompt = `다음은 ${totalQuestionsAnswered}개의 질문과 답변으로 이루어진 면접 기록입니다. **각 턴(Turn)마다** 상세한 피드백을 제공해주세요.

## 📋 채용 공고 정보
**직무**: ${context.jobPosting.title || '미상'}
**회사**: ${context.jobPosting.company_name || '미상'}
**핵심 키워드**: ${JSON.stringify(context.jobPosting.analysis_json?.keywords || [])}
**필수 요건**: ${JSON.stringify(context.jobPosting.analysis_json?.must_have || [])}
**우대 사항**: ${JSON.stringify(context.jobPosting.analysis_json?.nice_to_have || [])}

## 👤 지원자 프로필
- 현재 직무: ${context.userProfile.current_job || '미상'}
- 경력 요약: ${context.userProfile.career_summary || '제공되지 않음'}
- 학력: ${JSON.stringify(context.userProfile.education_json || [])}
- 보유 기술: ${JSON.stringify(context.userProfile.skills_json || [])}

## 💬 면접 대화 기록 (${totalQuestionsAnswered}개 질문)
${turns.map((turn, idx) => 
  `### [질문 ${idx + 1}]
${turn.question_text}

### [답변 ${idx + 1}]
${turn.user_answer_text || '(답변 없음)'}`
).join('\n\n')}
${earlyFinishNote}

---

위 면접 내용을 바탕으로 다음 JSON 형식으로 **턴별 상세 분석**을 제공해주세요:

\`\`\`json
{
  "overall_feedback": "면접 전체에 대한 종합 평가 (5-7문장). 면접 태도, 답변의 일관성, 직무 적합성, 합격 가능성에 대한 전문적인 의견을 포함하세요.${isEarlyFinish ? ' 면접이 조기 종료되었음을 자연스럽게 언급하세요.' : ''}",
  "per_turn_feedback": [
    {
      "turn_number": 1,
      "question": "질문 텍스트",
      "answer": "답변 텍스트",
      "user_answer_summary": "답변의 핵심 내용을 2-3문장으로 요약",
      "strengths": [
        "이 답변에서 잘한 점 1 (구체적으로)",
        "이 답변에서 잘한 점 2 (구체적으로)"
      ],
      "improvements": [
        "개선이 필요한 점 1과 구체적인 개선 방법",
        "개선이 필요한 점 2와 구체적인 개선 방법"
      ],
      "better_answer_example": "STAR 기법을 활용한 모범 답안 예시. 지원자의 경험을 바탕으로 하되, 더 구체적인 수치와 결과를 포함하여 작성하세요."
    }
  ]
}
\`\`\`

**중요 지침**:
- **모든 턴(${totalQuestionsAnswered}개)에 대해** per_turn_feedback를 생성하세요
- strengths와 improvements는 각각 2-3개 항목
- better_answer_example은 지원자의 실제 경험을 기반으로 하되, STAR 기법을 활용하여 더욱 강력하게 재구성
- 모든 피드백은 건설적이고 실용적이어야 함`;

  try {
    console.log(`🤖 [Interview Feedback] Generating feedback for ${totalQuestionsAnswered} turns...`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7, // 창의적인 모범 답안 생성을 위해 약간 높임
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content || '{}');
    
    console.log('✅ [Interview Feedback] AI 분석 완료');
    
    // 데이터 구조 검증 및 정규화
    const feedback: FinalInterviewFeedback = {
      overall_feedback: String(parsed.overall_feedback || '종합 피드백이 생성되지 않았습니다.'),
      per_turn_feedback: Array.isArray(parsed.per_turn_feedback)
        ? parsed.per_turn_feedback.map((turn: any) => ({
            turn_number: Number(turn.turn_number || 0),
            question: String(turn.question || ''),
            answer: String(turn.answer || ''),
            user_answer_summary: String(turn.user_answer_summary || ''),
            strengths: Array.isArray(turn.strengths)
              ? turn.strengths.map((s: any) => String(s))
              : [],
            improvements: Array.isArray(turn.improvements)
              ? turn.improvements.map((i: any) => String(i))
              : [],
            better_answer_example: String(turn.better_answer_example || ''),
          }))
        : [],
      is_early_finish: isEarlyFinish,
      total_questions_answered: totalQuestionsAnswered,
    };
    
    console.log(`📊 [Interview Feedback] Generated feedback for ${feedback.per_turn_feedback.length} turns`);
    
    return feedback;
  } catch (error) {
    console.error('❌ [Interview Feedback] 피드백 생성 에러:', error);
    throw new Error('면접 피드백 생성에 실패했습니다.');
  }
}

// ==================== TTS (Text-to-Speech) ====================

/**
 * 텍스트를 음성으로 변환 (TTS)
 * @param text 변환할 텍스트
 * @param voice 음성 종류 (alloy, echo, fable, onyx, nova, shimmer)
 */
export async function textToSpeech(text: string, voice: string = 'nova'): Promise<Buffer> {
  try {
    console.log(`🎤 [TTS] Generating speech for text (${text.length} chars) with voice: ${voice}`);
    
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as any, // alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: 1.0,
      response_format: 'mp3', // 명시적으로 MP3 포맷 지정
    });

    const arrayBuffer = await mp3.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`✅ [TTS] Speech generated successfully (${buffer.length} bytes)`);
    
    // 버퍼 유효성 검증
    if (buffer.length < 100) {
      console.error('❌ [TTS] Generated audio buffer is too small');
      throw new Error('생성된 오디오가 유효하지 않습니다.');
    }
    
    // MP3 파일 헤더 확인 (ID3 또는 MPEG 헤더)
    const isValidMP3 = buffer[0] === 0xFF || 
                       (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33); // ID3
    
    if (!isValidMP3) {
      console.warn('⚠️ [TTS] Audio buffer may not be valid MP3 format');
    }
    
    return buffer;
  } catch (error) {
    console.error('❌ [TTS] Error:', error);
    throw new Error('음성 생성에 실패했습니다.');
  }
}

// ==================== STT (Speech-to-Text) ====================

/**
 * 음성을 텍스트로 변환 (STT)
 */
export async function speechToText(audioBuffer: Buffer, filename: string = 'audio.webm'): Promise<string> {
  try {
    // OpenAI Whisper API는 File 객체나 스트림을 요구
    const tempFilePath = path.join('/tmp', filename);
    fs.writeFileSync(tempFilePath, audioBuffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      language: 'ko', // 한국어
    });

    // 임시 파일 삭제
    fs.unlinkSync(tempFilePath);

    return transcription.text;
  } catch (error) {
    console.error('STT 에러:', error);
    throw new Error('음성 인식에 실패했습니다.');
  }
}

const openaiService = {
  analyzeJobPosting,
  generateCoverLetterFeedback,
  generateInterviewQuestion,
  generateFinalInterviewFeedback,
  textToSpeech,
  speechToText,
};

export default openaiService;

