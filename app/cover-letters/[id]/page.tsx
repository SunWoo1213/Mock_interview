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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-700 font-medium">자기소개서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <div className="mb-8">
            <button
              onClick={() => router.push('/history')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← 히스토리로 돌아가기
            </button>
          </div>
          <div className="p-6 bg-red-50 border-2 border-red-300 rounded-lg shadow-sm">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!coverLetter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <div className="mb-8">
            <button
              onClick={() => router.push('/history')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← 히스토리로 돌아가기
            </button>
          </div>
          <div className="p-8 bg-white rounded-lg border-2 border-gray-200 text-center shadow-sm">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl text-slate-700 font-semibold">자기소개서를 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-8 py-16">
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
        <div className="mb-8 p-8 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">📄 자기소개서 내용</h2>
          <div className="text-slate-700 whitespace-pre-wrap leading-relaxed text-base">
            {coverLetter.content_text}
          </div>
        </div>

        {/* AI 피드백 */}
        {coverLetter.feedback_json ? (
          <div className="space-y-6">
            {/* 종합 평가 */}
            <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm">
              <h2 className="text-3xl font-bold mb-6 text-slate-900">🤖 AI 분석 결과</h2>
              
              <div className="p-6 bg-white rounded-lg border border-blue-200 shadow-sm">
                <h3 className="text-lg font-bold mb-3 text-blue-700">💬 종합 평가</h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base">
                  {coverLetter.feedback_json.summary || coverLetter.feedback_json.overall_feedback}
                </p>
              </div>
            </div>

            {/* 강점 & 약점 */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* 강점 */}
              {coverLetter.feedback_json.strengths && coverLetter.feedback_json.strengths.length > 0 && (
                <div className="p-6 bg-white rounded-lg border-2 border-green-300 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
                    <span>✅</span> 잘 쓴 부분
                  </h3>
                  <ul className="space-y-3">
                    {coverLetter.feedback_json.strengths.map((strength, idx) => {
                      const strengthText = typeof strength === 'string' ? strength : JSON.stringify(strength);
                      return (
                        <li key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <span className="text-green-600 mt-0.5 font-bold text-lg">{idx + 1}.</span>
                          <span className="text-slate-700 leading-relaxed text-base flex-1">{strengthText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* 약점/개선점 */}
              {coverLetter.feedback_json.weaknesses && coverLetter.feedback_json.weaknesses.length > 0 && (
                <div className="p-6 bg-white rounded-lg border-2 border-orange-300 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 text-orange-700 flex items-center gap-2">
                    <span>⚠️</span> 보완이 필요한 부분
                  </h3>
                  <ul className="space-y-3">
                    {coverLetter.feedback_json.weaknesses.map((weakness, idx) => {
                      const weaknessText = typeof weakness === 'string' ? weakness : JSON.stringify(weakness);
                      return (
                        <li key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                          <span className="text-orange-600 mt-0.5 font-bold text-lg">{idx + 1}.</span>
                          <span className="text-slate-700 leading-relaxed text-base flex-1">{weaknessText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* 섹션별 상세 분석 */}
            {coverLetter.feedback_json.detailedAnalysis && coverLetter.feedback_json.detailedAnalysis.length > 0 && (
              <div className="p-6 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-slate-900">
                  <span>🔍</span> 섹션별 상세 분석
                </h3>
                <div className="space-y-4">
                  {coverLetter.feedback_json.detailedAnalysis.map((analysis, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-lg border-l-4 border-blue-500 shadow-sm">
                      <h4 className="font-bold text-blue-700 mb-2 text-lg">{analysis.section}</h4>
                      <p className="text-slate-700 leading-relaxed text-base">{analysis.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 실질적인 수정 예시 */}
            {coverLetter.feedback_json.actionableFixes && coverLetter.feedback_json.actionableFixes.length > 0 && (
              <div className="p-6 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-700">
                  <span>✏️</span> 즉시 적용 가능한 수정 예시
                </h3>
                <div className="space-y-6">
                  {coverLetter.feedback_json.actionableFixes.map((fix, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-lg border border-gray-200">
                      <div className="mb-4">
                        <div className="text-sm text-red-700 font-semibold mb-2">❌ 수정 전</div>
                        <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
                          <p className="text-slate-700 italic text-base">&ldquo;{fix.original}&rdquo;</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-green-700 font-semibold mb-2">✅ 수정 후</div>
                        <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
                          <p className="text-slate-700 font-medium text-base">&ldquo;{fix.improved}&rdquo;</p>
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded border border-blue-200">
                        <div className="text-sm text-blue-700 font-semibold mb-2">💡 개선 이유</div>
                        <p className="text-slate-700 text-base">{fix.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 예상 면접 질문 */}
            {coverLetter.feedback_json.interview_questions && coverLetter.feedback_json.interview_questions.length > 0 && (
              <div className="p-6 bg-white rounded-lg border-2 border-purple-200 shadow-sm">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-purple-700">
                  <span>💬</span> 예상 면접 질문
                </h3>
                <ul className="space-y-3">
                  {coverLetter.feedback_json.interview_questions.map((question, idx) => {
                    const questionText = typeof question === 'string' ? question : JSON.stringify(question);
                    return (
                      <li key={idx} className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <span className="text-purple-600 font-bold mt-1 text-lg">Q{idx + 1}.</span>
                        <span className="text-slate-700 leading-relaxed text-base flex-1">{questionText}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-lg border-2 border-gray-200 text-center shadow-sm">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-xl text-slate-700 mb-4 font-semibold">아직 AI 피드백이 생성되지 않았습니다.</p>
            <p className="text-sm text-gray-600">자기소개서 작성 후 AI 피드백을 받아보세요.</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/history')}
            className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-slate-700 border-2 border-gray-300 rounded-lg transition-colors font-semibold shadow-sm"
          >
            ← 히스토리로 돌아가기
          </button>
          <button
            onClick={() => router.push('/interview')}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
          >
            이 자소서로 모의 면접 시작 →
          </button>
        </div>
      </div>
    </div>
  );
}


