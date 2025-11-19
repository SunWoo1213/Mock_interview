/**
 * 자기소개서 상세 및 피드백 페이지
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface CoverLetterDetail {
  id: number;
  content_text: string;
  created_at: string;
  job_posting_id?: number;
  title?: string;
  company_name?: string;
  feedback_json?: {
    overall_feedback: string;
    strengths?: string[];
    improvements?: Array<{
      issue: string;
      suggestion: string;
      example: string;
    }> | string[];
    suggestions?: string[];
    interview_questions?: string[];
  };
}

export default function CoverLetterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [coverLetter, setCoverLetter] = useState<CoverLetterDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    loadCoverLetter();
  }, [id]);

  const loadCoverLetter = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/cover-letters/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('자기소개서를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setCoverLetter(data.coverLetter);
    } catch (err: any) {
      console.error('자기소개서 로드 에러:', err);
      setError(err.message || '자기소개서를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mb-4" />
          <p className="text-gray-400">자기소개서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <div className="mb-8">
            <button
              onClick={() => router.push('/history')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← 히스토리로 돌아가기
            </button>
          </div>
          <div className="p-6 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!coverLetter) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <div className="mb-8">
            <button
              onClick={() => router.push('/history')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← 히스토리로 돌아가기
            </button>
          </div>
          <p className="text-gray-400 text-center">자기소개서를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/history')}
            className="text-gray-400 hover:text-white transition-colors mb-4"
          >
            ← 히스토리로 돌아가기
          </button>
          
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">📝 자기소개서</h1>
              {coverLetter.company_name && coverLetter.title && (
                <p className="text-xl text-gray-400">
                  {coverLetter.company_name} - {coverLetter.title}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                작성일: {formatDate(coverLetter.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* 자기소개서 본문 */}
        <div className="mb-8 p-8 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-2xl font-bold mb-4">자기소개서 내용</h2>
          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {coverLetter.content_text}
          </div>
        </div>

        {/* AI 피드백 */}
        {coverLetter.feedback_json ? (
          <div className="p-8 bg-gradient-to-br from-primary-900/30 to-purple-900/30 rounded-lg border border-primary-600">
            <h2 className="text-2xl font-bold mb-6">🤖 AI 피드백</h2>

            {/* 종합 피드백 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-3 text-primary-400">종합 피드백</h3>
              <div className="p-4 bg-black/30 rounded-lg">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {coverLetter.feedback_json.overall_feedback}
                </p>
              </div>
            </div>

            {/* 강점 */}
            {coverLetter.feedback_json.strengths && coverLetter.feedback_json.strengths.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-3 text-green-400">✅ 잘 쓴 부분</h3>
                <div className="space-y-3">
                  {coverLetter.feedback_json.strengths.map((strength, idx) => {
                    const strengthText = typeof strength === 'string' ? strength : JSON.stringify(strength);
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-green-900/20 rounded-lg border border-green-700">
                        <span className="text-green-400 text-xl flex-shrink-0">●</span>
                        <span className="text-gray-300">{strengthText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 개선점 */}
            {coverLetter.feedback_json.improvements && coverLetter.feedback_json.improvements.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-3 text-yellow-400">⚠️ 개선이 필요한 부분</h3>
                <div className="space-y-3">
                  {coverLetter.feedback_json.improvements.map((improvement, idx) => {
                    // 안전하게 문자열로 변환
                    if (typeof improvement === 'string') {
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-700">
                          <span className="text-yellow-400 text-xl flex-shrink-0">●</span>
                          <span className="text-gray-300">{improvement}</span>
                        </div>
                      );
                    } else {
                      // 객체 형식인 경우
                      const issue = typeof improvement.issue === 'string' ? improvement.issue : JSON.stringify(improvement.issue || improvement);
                      const suggestion = typeof improvement.suggestion === 'string' ? improvement.suggestion : JSON.stringify(improvement.suggestion || '');
                      const example = typeof improvement.example === 'string' ? improvement.example : (improvement.example ? JSON.stringify(improvement.example) : '');
                      
                      return (
                        <div key={idx} className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-700">
                          <p className="font-semibold text-yellow-400 mb-2">문제: {issue}</p>
                          {suggestion && (
                            <p className="text-gray-300 mb-2">제안: {suggestion}</p>
                          )}
                          {example && (
                            <p className="text-sm text-gray-400 italic">예시: {example}</p>
                          )}
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            )}

            {/* 추천 사항 */}
            {coverLetter.feedback_json.suggestions && coverLetter.feedback_json.suggestions.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-3 text-blue-400">💡 추천 사항</h3>
                <div className="space-y-3">
                  {coverLetter.feedback_json.suggestions.map((suggestion, idx) => {
                    const suggestionText = typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion);
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-blue-900/20 rounded-lg border border-blue-700">
                        <span className="text-blue-400 text-xl flex-shrink-0">●</span>
                        <span className="text-gray-300">{suggestionText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 bg-gray-900 rounded-lg border border-gray-800 text-center">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-xl text-gray-400 mb-4">아직 AI 피드백이 생성되지 않았습니다.</p>
            <p className="text-sm text-gray-500">자기소개서 작성 후 AI 피드백을 받아보세요.</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/history')}
            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-semibold"
          >
            히스토리로 돌아가기
          </button>
          <button
            onClick={() => router.push('/interview')}
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-semibold"
          >
            이 자소서로 모의 면접 시작 →
          </button>
        </div>
      </div>
    </div>
  );
}


