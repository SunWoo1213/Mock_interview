/**
 * 자기소개서 작성 페이지
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import JobPostingAnalysis from '@/components/JobPostingAnalysis';

export default function CreateCoverLetterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobPostingId = searchParams?.get('jobPostingId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobPosting, setJobPosting] = useState<any>(null);
  const [contentText, setContentText] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [error, setError] = useState('');

  const loadJobPosting = useCallback(async () => {
    if (!jobPostingId) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await apiClient.getJobPosting(parseInt(jobPostingId));
      setJobPosting(result.jobPosting);
    } catch (err: any) {
      console.error('공고 로드 에러:', err);
      setError(err.message || '공고를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [jobPostingId]);

  useEffect(() => {
    if (!jobPostingId) {
      setIsLoading(false);
      return;
    }

    loadJobPosting();
  }, [jobPostingId, loadJobPosting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contentText.trim()) {
      setError('자기소개서를 작성해주세요.');
      return;
    }

    if (!jobPostingId) {
      setError('채용 공고 ID가 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await apiClient.createCoverLetter({
        jobPostingId: parseInt(jobPostingId),
        contentText,
      });

      setFeedback(result.feedback);
      alert('자기소개서 피드백이 생성되었습니다!');
    } catch (err: any) {
      setError(err.message || '피드백 생성에 실패했습니다.');
      console.error('피드백 생성 에러:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1800px] mx-auto px-6 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 공고 ID가 없는 경우
  if (!jobPostingId) {
    return (
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <button
            onClick={() => router.back()}
            className="mb-8 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← 뒤로 가기
          </button>

          <div className="text-center py-16">
            <div className="mb-8">
              <div className="w-32 h-32 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-primary-200">
                <span className="text-6xl">📝</span>
              </div>
              <h1 className="text-4xl font-black mb-4 text-slate-900">자기소개서 작성</h1>
              <p className="text-gray-600 text-lg mb-2">
                자기소개서를 작성하려면 먼저 채용 공고를 선택해주세요.
              </p>
              <p className="text-gray-500">
                공고 분석 결과를 참고하여 더 효과적인 자소서를 작성할 수 있습니다.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
              <button
                onClick={() => router.push('/cover-letters/select-posting')}
                className="w-full px-8 py-5 bg-primary-500 hover:bg-primary-600 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-primary-500/50"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📋</span>
                  <span>분석된 공고 선택하기</span>
                </div>
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">또는</span>
                </div>
              </div>

              <button
                onClick={() => router.push('/job-postings/upload')}
                className="w-full px-8 py-5 bg-white hover:bg-gray-50 text-slate-900 font-bold text-lg rounded-xl transition-all border-2 border-gray-200 hover:border-gray-300 shadow-sm"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">➕</span>
                  <span>새 공고 업로드 및 분석</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto px-6 py-8">
      {/* 헤더 */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/cover-letters/select-posting')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← 공고 선택
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {jobPosting?.title || jobPosting?.companyName || '자기소개서 작성'}
                </h1>
                {jobPosting?.companyName && jobPosting?.title && (
                  <p className="text-sm text-gray-600">{jobPosting.companyName}</p>
                )}
              </div>
            </div>
            {!feedback && (
              <button
                onClick={() => router.push('/cover-letters/select-posting')}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-slate-900 text-sm font-medium rounded border border-gray-300 transition-colors"
              >
                공고 변경
              </button>
            )}
          </div>
        </div>
      </div>

      {error && !feedback && (
        <div className="max-w-[1800px] mx-auto px-6 mt-4">
          <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {!feedback ? (
        /* Split View: 공고 분석 (좌) + 자소서 작성 (우) */
        <div className="flex h-[calc(100vh-120px)]">
          {/* 왼쪽: 공고 분석 결과 (참고용) */}
          <div className="w-2/5 border-r border-gray-200 overflow-y-auto bg-slate-50">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-slate-900">
                  <span>📋</span> 공고 분석 결과
                </h2>
                <p className="text-sm text-gray-600">
                  이 정보를 참고하여 자기소개서를 작성하세요
                </p>
              </div>

              {jobPosting?.analysisJson ? (
                <div className="space-y-6">
                  {/* 요약 */}
                  {jobPosting.analysisJson.summary && (
                    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <h3 className="text-sm font-bold text-primary-600 mb-2">📝 요약</h3>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {jobPosting.analysisJson.summary}
                      </p>
                    </div>
                  )}

                  {/* 핵심 키워드 */}
                  {jobPosting.analysisJson.keywords && (
                    <div>
                      <h3 className="text-sm font-bold text-primary-600 mb-3">🏷️ 핵심 키워드</h3>
                      <div className="flex flex-wrap gap-2">
                        {jobPosting.analysisJson.keywords.map((keyword: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-primary-50 text-primary-700 text-sm rounded-full border border-primary-200"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 필수 요건 */}
                  {jobPosting.analysisJson.must_have && (
                    <div>
                      <h3 className="text-sm font-bold text-red-600 mb-3">⭐ 필수 요건</h3>
                      <ul className="space-y-2">
                        {jobPosting.analysisJson.must_have.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span className="text-slate-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 우대 사항 */}
                  {jobPosting.analysisJson.nice_to_have && (
                    <div>
                      <h3 className="text-sm font-bold text-blue-600 mb-3">✨ 우대 사항</h3>
                      <ul className="space-y-2">
                        {jobPosting.analysisJson.nice_to_have.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span className="text-slate-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 작성 팁 */}
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="text-sm font-bold text-yellow-700 mb-2">💡 작성 팁</h3>
                    <ul className="space-y-1 text-xs text-slate-600">
                      <li>• 필수 요건을 모두 언급하세요</li>
                      <li>• 핵심 키워드를 자연스럽게 포함하세요</li>
                      <li>• 구체적인 경험과 성과를 기술하세요</li>
                      <li>• STAR 기법(상황-과제-행동-결과)을 활용하세요</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>공고 분석 정보가 없습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 자기소개서 작성 */}
          <div className="flex-1 overflow-y-auto bg-white">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="flex-1 p-6">
                <div className="mb-4">
                  <label className="block text-lg font-bold mb-2 text-slate-900">
                    ✍️ 자기소개서 작성
                  </label>
                  <p className="text-sm text-gray-600">
                    왼쪽의 공고 분석 결과를 참고하여 작성해주세요
                  </p>
                </div>
                <textarea
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  className="w-full h-[calc(100vh-280px)] px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none text-gray-900 leading-relaxed placeholder:text-gray-400"
                  placeholder="여기에 자기소개서를 작성해주세요...

팁:
- 왼쪽의 필수 요건을 모두 다루세요
- 핵심 키워드를 자연스럽게 포함하세요
- 구체적인 경험과 성과를 기술하세요
- STAR 기법을 활용하세요"
                  required
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-gray-600">
                    {contentText.length.toLocaleString()} 자
                  </p>
                  <p className="text-xs text-gray-500">
                    권장: 1,000자 이상
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 p-6 bg-slate-50">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-bold text-lg shadow-sm"
                >
                  {isSubmitting ? '🤖 AI 피드백 생성 중...' : '🚀 AI 피드백 받기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-8 py-12 space-y-8">
            {/* 종합 평가 */}
            <div className="p-8 bg-gradient-to-br from-primary-900/30 to-purple-900/30 rounded-lg border-2 border-primary-600">
              <h2 className="text-3xl font-bold mb-6">📊 AI 분석 결과</h2>
              
              <div className="p-4 bg-black/30 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-primary-300">종합 평가</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {feedback.summary || feedback.overall_feedback}
                </p>
              </div>
            </div>

            {/* 강점 & 약점 */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* 강점 */}
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="p-6 bg-green-900/20 rounded-lg border border-green-700">
                  <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2">
                    <span>✅</span> 잘 쓴 부분
                  </h3>
                  <ul className="space-y-3">
                    {feedback.strengths.map((strength: any, idx: number) => {
                      const strengthText = typeof strength === 'string' ? strength : JSON.stringify(strength);
                      return (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-green-400 mt-1 font-bold">{idx + 1}.</span>
                          <span className="text-gray-300 leading-relaxed">{strengthText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* 약점/개선점 */}
              {feedback.weaknesses && feedback.weaknesses.length > 0 && (
                <div className="p-6 bg-yellow-900/20 rounded-lg border border-yellow-700">
                  <h3 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
                    <span>⚠️</span> 보완이 필요한 부분
                  </h3>
                  <ul className="space-y-3">
                    {feedback.weaknesses.map((weakness: any, idx: number) => {
                      const weaknessText = typeof weakness === 'string' ? weakness : JSON.stringify(weakness);
                      return (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-yellow-400 mt-1 font-bold">{idx + 1}.</span>
                          <span className="text-gray-300 leading-relaxed">{weaknessText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* 섹션별 상세 분석 */}
            {feedback.detailedAnalysis && feedback.detailedAnalysis.length > 0 && (
              <div className="p-6 bg-white rounded-lg border border-gray-700">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span>🔍</span> 섹션별 상세 분석
                </h3>
                <div className="space-y-4">
                  {feedback.detailedAnalysis.map((analysis: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gray-800 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-bold text-primary-400 mb-2">{analysis.section}</h4>
                      <p className="text-gray-300 leading-relaxed">{analysis.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 실질적인 수정 예시 */}
            {feedback.actionableFixes && feedback.actionableFixes.length > 0 && (
              <div className="p-6 bg-blue-900/20 rounded-lg border border-blue-700">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                  <span>✏️</span> 즉시 적용 가능한 수정 예시
                </h3>
                <div className="space-y-6">
                  {feedback.actionableFixes.map((fix: any, idx: number) => (
                    <div key={idx} className="p-5 bg-gray-800 rounded-lg">
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">❌ 수정 전</div>
                        <div className="p-3 bg-red-900/20 border-l-4 border-red-500 rounded">
                          <p className="text-gray-300 italic">&ldquo;{fix.original}&rdquo;</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">✅ 수정 후</div>
                        <div className="p-3 bg-green-900/20 border-l-4 border-green-500 rounded">
                          <p className="text-gray-300 font-medium">&ldquo;{fix.improved}&rdquo;</p>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-900/20 rounded">
                        <div className="text-sm text-blue-400 mb-1">💡 개선 이유</div>
                        <p className="text-gray-300 text-sm">{fix.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 예상 면접 질문 */}
            {feedback.interview_questions && feedback.interview_questions.length > 0 && (
              <div className="p-6 bg-purple-900/20 rounded-lg border border-purple-700">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-purple-400">
                  <span>💬</span> 예상 면접 질문
                </h3>
                <ul className="space-y-3">
                  {feedback.interview_questions.map((question: any, idx: number) => {
                    const questionText = typeof question === 'string' ? question : JSON.stringify(question);
                    return (
                      <li key={idx} className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
                        <span className="text-purple-400 font-bold mt-1">Q{idx + 1}.</span>
                        <span className="text-gray-300 leading-relaxed">{questionText}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/interview')}
                className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold text-lg"
              >
                🎤 모의 면접 시작하기
              </button>
              <button
                onClick={() => router.push('/job-postings/upload')}
                className="px-6 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-semibold"
              >
                다른 공고 작성하기
              </button>
            </div>
        </div>
      )}
    </div>
  );
}

