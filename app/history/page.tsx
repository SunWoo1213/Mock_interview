/**
 * 나의 활동 기록 페이지
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

type TabType = 'interviews' | 'cover-letters' | 'job-postings';

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

interface JobPosting {
  id: number;
  title: string | null;
  companyName: string | null;
  extractedText: string;
  analysisJson: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('interviews');
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // 통합 API 호출
      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setCoverLetters(data.coverLetters || []);
      setInterviews(data.interviews || []);

      // 채용공고 히스토리 로드
      const jobPostingsResult = await apiClient.getJobPostingHistory();
      setJobPostings(jobPostingsResult.jobPostings || []);
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

  const handleDelete = async (id: number, type: 'interview' | 'cover_letter' | 'job_posting', e: React.MouseEvent) => {
    // 이벤트 전파 방지 (카드 클릭 이벤트와 충돌 방지)
    e.stopPropagation();

    // 확인 대화상자
    const itemName = type === 'interview' ? '면접' : type === 'cover_letter' ? '자기소개서' : '채용공고';
    const confirmed = window.confirm(
      `정말 이 ${itemName}을(를) 삭제하시겠습니까?\n${type === 'job_posting' ? '연결된 자기소개서도 함께 삭제됩니다.\n' : ''}이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError('');
    setSuccessMessage('');

    try {
      if (type === 'job_posting') {
        await apiClient.deleteJobPosting(id);
        setJobPostings((prev) => prev.filter((item) => item.id !== id));
        setSuccessMessage('채용공고가 삭제되었습니다.');
        setShowModal(false);
      } else {
        const response = await fetch('/api/history/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ id, type }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '삭제에 실패했습니다.');
        }

        // UI에서 항목 제거
        if (type === 'interview') {
          setInterviews((prev) => prev.filter((item) => item.id !== id));
          setSuccessMessage('면접이 삭제되었습니다.');
        } else {
          setCoverLetters((prev) => prev.filter((item) => item.id !== id));
          setSuccessMessage('자기소개서가 삭제되었습니다.');
        }
      }

      // 3초 후 성공 메시지 자동 제거
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (err: any) {
      console.error('삭제 에러:', err);
      setError(err.message || '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleJobPostingClick = (posting: JobPosting) => {
    setSelectedPosting(posting);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPosting(null);
  };

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      {/* Header */}
      <div className="mb-6 md:mb-8 animate-fade-in">
        <button
          onClick={() => router.push('/')}
          className="text-zinc-600 hover:text-zinc-900 transition-colors mb-3 md:mb-4 text-sm md:text-base"
        >
          ← 홈으로 돌아가기
        </button>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-zinc-900">📊 나의 활동 기록</h1>
        <p className="text-sm md:text-base text-zinc-500">
          자기소개서, 모의 면접, 채용공고 분석 기록을 확인하세요
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-4 mb-6 md:mb-8 border-b border-zinc-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('interviews')}
            className={`px-3 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold transition-all whitespace-nowrap ${
              activeTab === 'interviews'
                ? 'text-zinc-900 border-b-2 border-zinc-900 font-bold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            🎤 모의면접 ({interviews.length})
          </button>
          <button
            onClick={() => setActiveTab('cover-letters')}
            className={`px-3 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold transition-all whitespace-nowrap ${
              activeTab === 'cover-letters'
                ? 'text-zinc-900 border-b-2 border-zinc-900 font-bold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            📝 자기소개서 ({coverLetters.length})
          </button>
          <button
            onClick={() => setActiveTab('job-postings')}
            className={`px-3 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold transition-all whitespace-nowrap ${
              activeTab === 'job-postings'
                ? 'text-zinc-900 border-b-2 border-zinc-900 font-bold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            📋 채용공고 분석 ({jobPostings.length})
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900" />
            <span className="ml-4 text-zinc-600">데이터 로딩 중...</span>
          </div>
        ) : (
          <>
            {/* Interviews Tab */}
            {activeTab === 'interviews' && (
              <div className="space-y-4">
                {interviews.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🎤</div>
                    <p className="text-xl text-zinc-600 mb-4">
                      아직 진행한 모의 면접이 없습니다.
                    </p>
                    <button
                      onClick={() => router.push('/interview')}
                      className="px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all font-medium shadow-sm active:scale-95"
                    >
                      모의 면접 시작하기
                    </button>
                  </div>
                ) : (
                  interviews.map((interview) => (
                    <div
                      key={interview.id}
                      onClick={() => handleInterviewClick(interview.id)}
                      className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {interview.jobPosting ? (
                            <div className="mb-2">
                              <h3 className="text-xl font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors">
                                {interview.jobPosting.companyName} - {interview.jobPosting.title}
                              </h3>
                            </div>
                          ) : (
                            <h3 className="text-xl font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors mb-2">
                              모의 면접 #{interview.id}
                            </h3>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-zinc-600 text-sm">
                              📊 진행률: {interview.answeredQuestions} / {interview.totalQuestions} 질문
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center gap-3">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                              interview.status === 'completed'
                                ? 'bg-green-100 text-green-700 border-2 border-green-400'
                                : interview.status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                                : 'bg-zinc-100 text-zinc-700 border-2 border-zinc-400'
                            }`}
                          >
                            {interview.statusLabel}
                          </span>
                          <button
                            onClick={(e) => handleDelete(interview.id, 'interview', e)}
                            disabled={deletingId === interview.id}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="삭제"
                          >
                            {deletingId === interview.id ? (
                              <span className="inline-block animate-spin">⏳</span>
                            ) : (
                              <span className="text-xl">🗑️</span>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-zinc-500">
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

            {/* Cover Letters Tab */}
            {activeTab === 'cover-letters' && (
              <div className="space-y-4">
                {coverLetters.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-xl text-zinc-600 mb-4">
                      아직 작성한 자기소개서가 없습니다.
                    </p>
                    <button
                      onClick={() => router.push('/cover-letters')}
                      className="px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all font-medium shadow-sm active:scale-95"
                    >
                      자기소개서 작성하기
                    </button>
                  </div>
                ) : (
                  coverLetters.map((letter) => (
                    <div
                      key={letter.id}
                      onClick={() => handleCoverLetterClick(letter.id)}
                      className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {letter.jobPosting ? (
                            <div className="mb-2">
                              <h3 className="text-xl font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors">
                                {letter.jobPosting.companyName} - {letter.jobPosting.title}
                              </h3>
                            </div>
                          ) : (
                            <h3 className="text-xl font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors mb-2">
                              자기소개서 #{letter.id}
                            </h3>
                          )}
                          <p className="text-zinc-600 text-sm line-clamp-2">
                            {letter.contentPreview}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center gap-3">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                              letter.status === 'Feedback Complete'
                                ? 'bg-green-100 text-green-700 border-2 border-green-400'
                                : 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                            }`}
                          >
                            {letter.status}
                          </span>
                          <button
                            onClick={(e) => handleDelete(letter.id, 'cover_letter', e)}
                            disabled={deletingId === letter.id}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="삭제"
                          >
                            {deletingId === letter.id ? (
                              <span className="inline-block animate-spin">⏳</span>
                            ) : (
                              <span className="text-xl">🗑️</span>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-zinc-500">
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

            {/* Job Postings Tab */}
            {activeTab === 'job-postings' && (
              <div className="space-y-4">
                {jobPostings.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-xl text-zinc-600 mb-4">
                      아직 분석한 채용공고가 없습니다.
                    </p>
                    <button
                      onClick={() => router.push('/job-postings/upload')}
                      className="px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all font-medium shadow-sm active:scale-95"
                    >
                      채용공고 분석하기
                    </button>
                  </div>
                ) : (
                  jobPostings.map((posting) => (
                    <div
                      key={posting.id}
                      onClick={() => handleJobPostingClick(posting)}
                      className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors mb-2">
                            {posting.title || posting.companyName || '제목 없음'}
                          </h3>
                          {posting.companyName && posting.title && (
                            <p className="text-zinc-600 text-sm mb-3">{posting.companyName}</p>
                          )}
                          
                          {/* 키워드 미리보기 */}
                          {posting.analysisJson?.keywords && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {posting.analysisJson.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border-2 border-blue-300"
                                >
                                  {keyword}
                                </span>
                              ))}
                              {posting.analysisJson.keywords.length > 5 && (
                                <span className="px-3 py-1.5 text-zinc-600 text-xs font-medium bg-zinc-100 rounded-lg border border-zinc-200">
                                  +{posting.analysisJson.keywords.length - 5}개 더
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4 flex items-center gap-3">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                              posting.status === 'analyzed'
                                ? 'bg-green-100 text-green-700 border-2 border-green-400'
                                : posting.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                                : 'bg-red-100 text-red-700 border-2 border-red-400'
                            }`}
                          >
                            {posting.status === 'analyzed' ? '✅ 분석 완료' : 
                             posting.status === 'pending' ? '⏳ 분석 대기' : '❌ 실패'}
                          </span>
                          <button
                            onClick={(e) => handleDelete(posting.id, 'job_posting', e)}
                            disabled={deletingId === posting.id}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="삭제"
                          >
                            {deletingId === posting.id ? (
                              <span className="inline-block animate-spin">⏳</span>
                            ) : (
                              <span className="text-xl">🗑️</span>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-zinc-500">
                        <span>📅 분석일: {formatDate(posting.createdAt)}</span>
                        <span className="text-zinc-900 font-medium group-hover:text-zinc-600">
                          👁️ 상세보기 →
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 채용공고 상세보기 모달 */}
      {showModal && selectedPosting && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-zinc-200 p-6 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                  {selectedPosting.title || selectedPosting.companyName || '채용공고'}
                </h2>
                {selectedPosting.companyName && selectedPosting.title && (
                  <p className="text-zinc-600">{selectedPosting.companyName}</p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="ml-4 p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-all"
                aria-label="닫기"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 space-y-6">
              {selectedPosting.analysisJson ? (
                <>
                  {/* 요약 */}
                  {selectedPosting.analysisJson.summary && (
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-3">📝 요약</h3>
                      <p className="text-zinc-700 leading-relaxed bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                        {selectedPosting.analysisJson.summary}
                      </p>
                    </div>
                  )}

                  {/* 핵심 키워드 */}
                  {selectedPosting.analysisJson.keywords && (
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-3">🏷️ 핵심 키워드</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedPosting.analysisJson.keywords.map((keyword: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border-2 border-blue-300"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 필수 요건 */}
                  {selectedPosting.analysisJson.must_have && (
                    <div>
                      <h3 className="text-lg font-bold text-red-600 mb-3">⭐ 필수 요건</h3>
                      <ul className="space-y-2 bg-red-50 p-4 rounded-lg border border-red-200">
                        {selectedPosting.analysisJson.must_have.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-red-600 mt-1">•</span>
                            <span className="text-zinc-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 우대 사항 */}
                  {selectedPosting.analysisJson.nice_to_have && (
                    <div>
                      <h3 className="text-lg font-bold text-blue-600 mb-3">✨ 우대 사항</h3>
                      <ul className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        {selectedPosting.analysisJson.nice_to_have.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span className="text-zinc-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 원본 텍스트 */}
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-3">📄 원본 공고 내용</h3>
                    <div className="bg-zinc-50 p-4 rounded-lg max-h-96 overflow-y-auto border border-zinc-200">
                      <pre className="whitespace-pre-wrap text-zinc-600 text-sm leading-relaxed font-sans">
                        {selectedPosting.extractedText}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-zinc-500">
                  <p>분석 결과가 없습니다.</p>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="sticky bottom-0 bg-white border-t border-zinc-200 p-6 flex gap-4">
              <button
                onClick={() => router.push(`/cover-letters/create?jobPostingId=${selectedPosting.id}`)}
                className="flex-1 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg transition-all shadow-sm active:scale-95"
              >
                📝 이 공고로 자소서 작성하기
              </button>
              <button
                onClick={closeModal}
                className="px-6 py-3 bg-white hover:bg-zinc-50 text-zinc-700 font-medium rounded-lg transition-colors border border-zinc-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

