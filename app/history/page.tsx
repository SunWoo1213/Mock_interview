/**
 * My Activity History 페이지
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

type TabType = 'cover-letters' | 'interviews';

interface CoverLetter {
  id: number;
  contentPreview: string;
  createdAt: string;
  updatedAt: string;
  jobPosting: {
    id: number;
    title: string;
    companyName: string;
  } | null;
  feedbackCount: number;
  lastFeedbackDate: string | null;
  status: string;
}

interface Interview {
  id: number;
  status: string;
  totalQuestions: number;
  answeredQuestions: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  jobPosting: {
    id: number;
    title: string;
    companyName: string;
  } | null;
  coverLetterId: number | null;
  statusLabel: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('cover-letters');
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [coverLetterData, interviewData] = await Promise.all([
        apiClient.getCoverLetterHistory(),
        apiClient.getInterviewHistory(),
      ]);

      setCoverLetters(coverLetterData.coverLetters);
      setInterviews(interviewData.interviews);
    } catch (err: any) {
      console.error('히스토리 로드 에러:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
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

  const handleCoverLetterClick = (id: number) => {
    router.push(`/cover-letters/${id}`);
  };

  const handleInterviewClick = (id: number) => {
    router.push(`/interview/result/${id}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors mb-4"
          >
            ← 홈으로 돌아가기
          </button>
          <h1 className="text-4xl font-bold mb-2">📊 My Activity History</h1>
          <p className="text-gray-400">
            내 자기소개서 피드백과 모의 면접 기록을 확인하세요
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('cover-letters')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'cover-letters'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            📝 Cover Letter Feedbacks ({coverLetters.length})
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'interviews'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            🎤 Mock Interview Sessions ({interviews.length})
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
            <span className="ml-4 text-gray-400">데이터 로딩 중...</span>
          </div>
        ) : (
          <>
            {/* Cover Letters Tab */}
            {activeTab === 'cover-letters' && (
              <div className="space-y-4">
                {coverLetters.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-xl text-gray-400 mb-4">
                      아직 작성한 자기소개서가 없습니다.
                    </p>
                    <button
                      onClick={() => router.push('/cover-letters')}
                      className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    >
                      자기소개서 작성하기
                    </button>
                  </div>
                ) : (
                  coverLetters.map((letter) => (
                    <div
                      key={letter.id}
                      onClick={() => handleCoverLetterClick(letter.id)}
                      className="p-6 bg-gray-900 rounded-lg border border-gray-800 hover:border-primary-500 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {letter.jobPosting ? (
                            <div className="mb-2">
                              <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                                {letter.jobPosting.companyName} - {letter.jobPosting.title}
                              </h3>
                            </div>
                          ) : (
                            <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors mb-2">
                              자기소개서 #{letter.id}
                            </h3>
                          )}
                          <p className="text-gray-400 text-sm line-clamp-2">
                            {letter.contentPreview}
                          </p>
                        </div>
                        <div className="ml-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              letter.status === 'Feedback Complete'
                                ? 'bg-green-900/30 text-green-400 border border-green-600'
                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}
                          >
                            {letter.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span>📅 작성일: {formatDate(letter.createdAt)}</span>
                        {letter.feedbackCount > 0 && (
                          <span>💬 피드백: {letter.feedbackCount}개</span>
                        )}
                        {letter.lastFeedbackDate && (
                          <span>🕒 최근 피드백: {formatDate(letter.lastFeedbackDate)}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Interviews Tab */}
            {activeTab === 'interviews' && (
              <div className="space-y-4">
                {interviews.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🎤</div>
                    <p className="text-xl text-gray-400 mb-4">
                      아직 진행한 모의 면접이 없습니다.
                    </p>
                    <button
                      onClick={() => router.push('/interview')}
                      className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    >
                      모의 면접 시작하기
                    </button>
                  </div>
                ) : (
                  interviews.map((interview) => (
                    <div
                      key={interview.id}
                      onClick={() => handleInterviewClick(interview.id)}
                      className="p-6 bg-gray-900 rounded-lg border border-gray-800 hover:border-primary-500 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {interview.jobPosting ? (
                            <div className="mb-2">
                              <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                                {interview.jobPosting.companyName} - {interview.jobPosting.title}
                              </h3>
                            </div>
                          ) : (
                            <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors mb-2">
                              모의 면접 #{interview.id}
                            </h3>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-gray-400 text-sm">
                              📊 진행률: {interview.answeredQuestions} / {interview.totalQuestions} 질문
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              interview.status === 'completed'
                                ? 'bg-green-900/30 text-green-400 border border-green-600'
                                : interview.status === 'in_progress'
                                ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-600'
                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}
                          >
                            {interview.statusLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        {interview.startedAt && (
                          <span>🕒 시작: {formatDate(interview.startedAt)}</span>
                        )}
                        {interview.completedAt && (
                          <span>✅ 완료: {formatDate(interview.completedAt)}</span>
                        )}
                        {!interview.completedAt && interview.createdAt && (
                          <span>📅 생성: {formatDate(interview.createdAt)}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

