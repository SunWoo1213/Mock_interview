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
            <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
              <h2 className="text-2xl font-bold mb-4">AI 피드백</h2>

              {/* 종합 피드백 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">종합 피드백</h3>
                <p className="text-gray-300 whitespace-pre-wrap">
                  {feedback.overall_feedback}
                </p>
              </div>

              {/* 강점 */}
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-2">✅ 잘 쓴 부분</h3>
                  <ul className="space-y-2">
                    {feedback.strengths.map((strength: any, idx: number) => {
                      const strengthText = typeof strength === 'string' ? strength : JSON.stringify(strength);
                      return (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">●</span>
                          <span className="text-gray-300">{strengthText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* 개선점 */}
              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-2">⚠️ 개선이 필요한 부분</h3>
                  <div className="space-y-4">
                    {feedback.improvements.map((item: any, idx: number) => {
                      // 안전하게 문자열로 변환
                      const issue = typeof item === 'string' ? item : (typeof item.issue === 'string' ? item.issue : JSON.stringify(item.issue || item));
                      const suggestion = typeof item === 'string' ? '' : (typeof item.suggestion === 'string' ? item.suggestion : JSON.stringify(item.suggestion || ''));
                      const example = typeof item === 'string' ? '' : (typeof item.example === 'string' ? item.example : (item.example ? JSON.stringify(item.example) : ''));
                      
                      return (
                        <div key={idx} className="p-4 bg-gray-800 rounded-lg">
                          <p className="font-semibold text-red-400 mb-2">문제: {issue}</p>
                          {suggestion && (
                            <p className="text-gray-300 mb-2">제안: {suggestion}</p>
                          )}
                          {example && (
                            <p className="text-sm text-gray-400 italic">예시: {example}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 예상 면접 질문 */}
              {feedback.interview_questions && feedback.interview_questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-2">💬 예상 면접 질문</h3>
                  <ul className="space-y-2">
                    {feedback.interview_questions.map((question: any, idx: number) => {
                      const questionText = typeof question === 'string' ? question : JSON.stringify(question);
                      return (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary-400 mt-1">{idx + 1}.</span>
                          <span className="text-gray-300">{questionText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.push('/interview')}
                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-semibold"
              >
                모의 면접 시작하기
              </button>
              <button
                onClick={() => router.push('/job-postings/upload')}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
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

