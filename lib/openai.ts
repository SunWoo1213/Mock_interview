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
  strengths: string[];
  improvements: Array<{
    issue: string;
    suggestion: string;
    example: string;
  }>;
  interview_questions: string[];
  overall_feedback: string;
}

/**
 * 자기소개서 피드백 생성
 */
export async function generateCoverLetterFeedback(
  userProfile: any,
  jobPosting: any,
  coverLetterText: string
): Promise<CoverLetterFeedback> {
  const prompt = `너는 ${jobPosting.position || '해당'} 분야 최고의 커리어 코치이자 채용 전문가야.

### 사용자 프로필:
- 나이: ${userProfile.age || '미상'}
- 성별: ${userProfile.gender || '미상'}
- 경력: ${JSON.stringify(userProfile.career_json || [], null, 2)}
- 학력: ${JSON.stringify(userProfile.education_json || [], null, 2)}
- 자격증: ${JSON.stringify(userProfile.certificates_json || [], null, 2)}

### 채용 공고 정보:
- 회사: ${jobPosting.company_name || '미상'}
- 직무: ${jobPosting.title || '미상'}
- 필수 요건: ${JSON.stringify(jobPosting.analysis_json?.must_have || [], null, 2)}
- 우대 사항: ${JSON.stringify(jobPosting.analysis_json?.nice_to_have || [], null, 2)}

### 자기소개서:
${coverLetterText}

위 정보를 바탕으로 다음 형식의 JSON으로 피드백을 제공해줘:
{
  "overall_feedback": "종합 피드백 (3-5문장)",
  "strengths": ["잘 쓴 부분 3-5개"],
  "improvements": [
    {
      "issue": "개선이 필요한 부분",
      "suggestion": "구체적인 개선 방안",
      "example": "수정 예시"
    }
  ],
  "interview_questions": ["예상 면접 질문 3-5개"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: '당신은 전문 커리어 코치입니다.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content || '{}');
    
    // 데이터 구조 검증 및 정규화
    const feedback: CoverLetterFeedback = {
      overall_feedback: String(parsed.overall_feedback || ''),
      strengths: Array.isArray(parsed.strengths) 
        ? parsed.strengths.map((s: any) => String(s)) 
        : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements.map((item: any) => {
            if (typeof item === 'string') {
              return { issue: item, suggestion: '', example: '' };
            }
            return {
              issue: String(item.issue || ''),
              suggestion: String(item.suggestion || ''),
              example: String(item.example || ''),
            };
          })
        : [],
      interview_questions: Array.isArray(parsed.interview_questions)
        ? parsed.interview_questions.map((q: any) => String(q))
        : [],
    };
    
    return feedback;
  } catch (error) {
    console.error('자소서 피드백 에러:', error);
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
  overall_feedback: string;
  per_turn_feedback: Array<{
    turn_number: number;
    question: string;
    answer: string;
    feedback: string;
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
  
  const prompt = `너는 ${context.jobPosting.title} 분야의 최고 전문가 면접관이자 피드백 전문가야.

### 면접 대화 기록:
${turns.map((turn, idx) => 
  `[질문 ${idx + 1}] ${turn.question_text}\n[답변 ${idx + 1}] ${turn.user_answer_text || '(답변 없음)'}`
).join('\n\n')}

### 사용자 스펙:
${JSON.stringify(context.userProfile, null, 2)}

### 채용 공고:
${JSON.stringify(context.jobPosting.analysis_json, null, 2)}
${earlyFinishNote}

위 면접 내용을 바탕으로 다음 형식의 JSON 피드백을 제공해줘:
{
  "overall_feedback": "종합 피드백 (5-7문장). 면접 태도, 답변 내용, 일관성, 직무 적합성에 대한 상세한 설명을 포함해줘.${isEarlyFinish ? ' 면접이 조기 종료되었음을 자연스럽게 언급해줘.' : ''}",
  "per_turn_feedback": [
    {
      "turn_number": 1,
      "question": "질문",
      "answer": "답변",
      "feedback": "이 답변에 대한 구체적이고 상세한 피드백. 좋았던 점과 개선할 점을 모두 포함해줘."
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: '당신은 전문 면접관이자 피드백 전문가입니다. 제공된 답변의 질과 깊이에 집중하여 공정하고 건설적인 피드백을 제공합니다.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const content = response.choices[0].message.content;
    const feedback = JSON.parse(content || '{}');
    
    // 메타데이터 추가
    return {
      ...feedback,
      is_early_finish: isEarlyFinish,
      total_questions_answered: totalQuestionsAnswered,
    };
  } catch (error) {
    console.error('최종 피드백 에러:', error);
    throw new Error('면접 피드백 생성에 실패했습니다.');
  }
}

// ==================== TTS (Text-to-Speech) ====================

/**
 * 텍스트를 음성으로 변환 (TTS)
 */
export async function textToSpeech(text: string): Promise<Buffer> {
  try {
    console.log(`🎤 [TTS] Generating speech for text (${text.length} chars)`);
    
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // alloy, echo, fable, onyx, nova, shimmer
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

