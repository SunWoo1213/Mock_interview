/**
 * 공고 히스토리 페이지
 * 사용자가 업로드/분석한 모든 공고를 확인하고 관리
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

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

export default function JobPostingHistoryPage() {
  const router = useRouter();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await apiClient.getJobPostingHistory();
      setJobPostings(result.jobPostings);
    } catch (err: any) {
      console.error('히스토리 로드 에러:', err);
      setError(err.message || '히스토리를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

    if (!window.confirm('이 공고를 삭제하시겠습니까?\n연결된 자기소개서도 함께 삭제됩니다.')) {
      return;
    }

    setDeletingId(id);
    setError('');
    setSuccessMessage('');

    try {
      await apiClient.deleteJobPosting(id);
      setJobPostings(prev => prev.filter(posting => posting.id !== id));
      setSuccessMessage('공고가 삭제되었습니다.');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('삭제 에러:', err);
      setError(err.message || '삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectPosting = (id: number) => {
    router.push(`/cover-letters/create?jobPostingId=${id}`);
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
      <div className="max-w-6xl mx-auto px-8 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">공고 히스토리를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-gray-400 hover:text-white transition-colors"
          >
            ← 뒤로 가기
          </button>
          <h1 className="text-4xl font-black mb-2">
            📋 공고 히스토리
          </h1>
          <p className="text-gray-400">
            업로드하고 분석한 공고 목록입니다. 공고를 선택하여 자기소개서를 작성할 수 있습니다.
          </p>
        </div>

        {/* 성공 메시지 */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-500 rounded-lg">
            <p className="text-green-400">✅ {successMessage}</p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        {/* 새 공고 업로드 버튼 */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/job-postings/upload')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors"
          >
            ➕ 새 공고 업로드
          </button>
        </div>

        {/* 공고 목록 */}
        {jobPostings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">업로드된 공고가 없습니다.</p>
            <button
              onClick={() => router.push('/job-postings/upload')}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors"
            >
              첫 공고 업로드하기
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {jobPostings.map(posting => (
              <div
                key={posting.id}
                onClick={() => handleSelectPosting(posting.id)}
                className="relative p-6 bg-gray-900 border-2 border-gray-800 rounded-xl hover:border-primary-500 transition-all cursor-pointer group"
              >
                {/* 상태 뱃지 */}
                <div className="absolute top-4 right-4">
                  {posting.status === 'analyzed' ? (
                    <span className="px-3 py-1 bg-green-900/30 text-green-400 text-xs font-bold rounded-full border border-green-700">
                      ✅ 분석 완료
                    </span>
                  ) : posting.status === 'pending' ? (
                    <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 text-xs font-bold rounded-full border border-yellow-700">
                      ⏳ 분석 대기
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-900/30 text-red-400 text-xs font-bold rounded-full border border-red-700">
                      ❌ 실패
                    </span>
                  )}
                </div>

                {/* 공고 정보 */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2 pr-24">
                    {posting.title || posting.companyName || '제목 없음'}
                  </h3>
                  {posting.companyName && posting.title && (
                    <p className="text-gray-400 text-sm">{posting.companyName}</p>
                  )}
                </div>

                {/* 분석 결과 미리보기 */}
                {posting.analysisJson && (
                  <div className="mb-4 space-y-2">
                    {posting.analysisJson.keywords && (
                      <div className="flex flex-wrap gap-2">
                        {posting.analysisJson.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-primary-900/30 text-primary-400 text-xs rounded border border-primary-700"
                          >
                            {keyword}
                          </span>
                        ))}
                        {posting.analysisJson.keywords.length > 5 && (
                          <span className="px-2 py-1 text-gray-500 text-xs">
                            +{posting.analysisJson.keywords.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 텍스트 미리보기 */}
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                  {posting.extractedText.slice(0, 150)}...
                </p>

                {/* 날짜 및 액션 */}
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 text-xs">
                    {formatDate(posting.createdAt)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/job-postings/${posting.id}`);
                      }}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
                    >
                      상세보기
                    </button>
                    <button
                      onClick={(e) => handleDelete(posting.id, e)}
                      disabled={deletingId === posting.id}
                      className="px-3 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-sm font-medium rounded transition-colors disabled:opacity-50"
                    >
                      {deletingId === posting.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>

                {/* 호버 효과 */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-500 rounded-xl pointer-events-none transition-colors"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

