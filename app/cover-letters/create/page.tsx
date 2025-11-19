/**
 * 자기소개서 작성 페이지
 */
'use client';

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!jobPostingId) {
      setError('채용 공고 ID가 필요합니다.');
      setIsLoading(false);
      return;
    }

    // TODO: 채용 공고 정보 로드
    // 현재는 apiClient에 getJobPosting이 없으므로 임시 처리
    setIsLoading(false);
  }, [jobPostingId]);

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mb-4" />
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="mb-8">
          <button
            onClick={() => router.push('/job-postings/upload')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← 채용 공고로 돌아가기
          </button>
        </div>

        <h1 className="text-4xl font-bold mb-8">자기소개서 작성</h1>

        {error && !feedback && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!feedback ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
              <label className="block text-lg font-bold mb-4">
                자기소개서를 작성하세요
              </label>
              <textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                rows={20}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500 transition-colors resize-none"
                placeholder="채용 공고의 요구사항을 바탕으로 자기소개서를 작성해주세요..."
                required
              />
              <p className="mt-2 text-sm text-gray-400">
                {contentText.length} 자
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold"
            >
              {isSubmitting ? 'AI 피드백 생성 중...' : 'AI 피드백 받기'}
            </button>
          </form>
        ) : (
          <div className="space-y-8">
            {/* 점수 및 종합 평가 */}
            <div className="p-8 bg-gradient-to-br from-primary-900/30 to-purple-900/30 rounded-lg border-2 border-primary-600">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold">📊 AI 분석 결과</h2>
                <div className="text-right">
                  <div className="text-5xl font-bold text-primary-400">
                    {feedback.overallScore || 0}
                  </div>
                  <div className="text-sm text-gray-400">/ 100점</div>
                </div>
              </div>
              
              {/* 종합 평가 */}
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
              <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span>🔍</span> 섹션별 상세 분석
                </h3>
                <div className="space-y-4">
                  {feedback.detailedAnalysis.map((analysis: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gray-800 rounded-lg border-l-4 border-primary-500">
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
                          <p className="text-gray-300 italic">"{fix.original}"</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">✅ 수정 후</div>
                        <div className="p-3 bg-green-900/20 border-l-4 border-green-500 rounded">
                          <p className="text-gray-300 font-medium">"{fix.improved}"</p>
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
                className="flex-1 px-6 py-4 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-semibold text-lg"
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
    </div>
  );
}

