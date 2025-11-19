/**
 * 자기소개서 상세 및 피드백 페이지
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    summary?: string;
    overall_feedback?: string; // 하위 호환성
    strengths?: string[];
    weaknesses?: string[];
    improvements?: Array<{
      issue: string;
      suggestion: string;
      example: string;
    }> | string[];
    detailedAnalysis?: Array<{
      section: string;
      feedback: string;
    }>;
    actionableFixes?: Array<{
      original: string;
      improved: string;
      reason: string;
    }>;
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

  const loadCoverLetter = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadCoverLetter();
  }, [id, loadCoverLetter]);

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
      <div className="max-w-5xl mx-auto px-8 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mb-4" />
          <p className="text-gray-400">자기소개서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-16">
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
      <div className="max-w-5xl mx-auto px-8 py-16">
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
    <div className="max-w-5xl mx-auto px-8 py-16">
      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-8">
            <button
              onClick={() => router.push('/history')}
              className="text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              ← 히스토리로 돌아가기
            </button>
          
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-slate-900">📝 자기소개서</h1>
              {coverLetter.company_name && coverLetter.title && (
                <p className="text-xl text-gray-600">
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
        <div className="mb-8 p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">자기소개서 내용</h2>
          <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
            {coverLetter.content_text}
          </div>
        </div>

        {/* AI 피드백 */}
        {coverLetter.feedback_json ? (
          <div className="space-y-6">
            {/* 종합 평가 */}
            <div className="p-8 bg-gradient-to-br from-primary-900/30 to-purple-900/30 rounded-lg border-2 border-primary-600">
              <h2 className="text-3xl font-bold mb-6">🤖 AI 분석 결과</h2>
              
              <div className="p-4 bg-black/30 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-primary-300">종합 평가</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {coverLetter.feedback_json.summary || coverLetter.feedback_json.overall_feedback}
                </p>
              </div>
            </div>

            {/* 강점 & 약점 */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* 강점 */}
              {coverLetter.feedback_json.strengths && coverLetter.feedback_json.strengths.length > 0 && (
                <div className="p-6 bg-green-900/20 rounded-lg border border-green-700">
                  <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2">
                    <span>✅</span> 잘 쓴 부분
                  </h3>
                  <ul className="space-y-3">
                    {coverLetter.feedback_json.strengths.map((strength, idx) => {
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
              {coverLetter.feedback_json.weaknesses && coverLetter.feedback_json.weaknesses.length > 0 && (
                <div className="p-6 bg-yellow-900/20 rounded-lg border border-yellow-700">
                  <h3 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
                    <span>⚠️</span> 보완이 필요한 부분
                  </h3>
                  <ul className="space-y-3">
                    {coverLetter.feedback_json.weaknesses.map((weakness, idx) => {
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
            {coverLetter.feedback_json.detailedAnalysis && coverLetter.feedback_json.detailedAnalysis.length > 0 && (
              <div className="p-6 bg-white rounded-lg border border-gray-700">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span>🔍</span> 섹션별 상세 분석
                </h3>
                <div className="space-y-4">
                  {coverLetter.feedback_json.detailedAnalysis.map((analysis, idx) => (
                    <div key={idx} className="p-4 bg-gray-800 rounded-lg border-l-4 border-primary-500">
                      <h4 className="font-bold text-primary-400 mb-2">{analysis.section}</h4>
                      <p className="text-gray-300 leading-relaxed">{analysis.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 실질적인 수정 예시 */}
            {coverLetter.feedback_json.actionableFixes && coverLetter.feedback_json.actionableFixes.length > 0 && (
              <div className="p-6 bg-blue-900/20 rounded-lg border border-blue-700">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                  <span>✏️</span> 즉시 적용 가능한 수정 예시
                </h3>
                <div className="space-y-6">
                  {coverLetter.feedback_json.actionableFixes.map((fix, idx) => (
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
            {coverLetter.feedback_json.interview_questions && coverLetter.feedback_json.interview_questions.length > 0 && (
              <div className="p-6 bg-purple-900/20 rounded-lg border border-purple-700">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-purple-400">
                  <span>💬</span> 예상 면접 질문
                </h3>
                <ul className="space-y-3">
                  {coverLetter.feedback_json.interview_questions.map((question, idx) => {
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
          </div>
        ) : (
          <div className="p-8 bg-white rounded-lg border border-gray-800 text-center">
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
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold"
          >
            이 자소서로 모의 면접 시작 →
          </button>
        </div>
      </div>
    </div>
  );
}


