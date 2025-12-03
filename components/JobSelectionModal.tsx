/**
 * 채용공고 선택 모달
 * 자기소개서 작성 전에 공고를 선택하는 UI
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface JobPosting {
  id: number;
  title: string | null;
  companyName: string | null;
  createdAt: string;
  analysisJson: any;
}

interface JobSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JobSelectionModal({ isOpen, onClose }: JobSelectionModalProps) {
  const router = useRouter();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadJobPostings();
    }
  }, [isOpen]);

  const loadJobPostings = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.getJobPostingHistory();
      setJobPostings(response.jobPostings || []);
    } catch (err: any) {
      console.error('채용공고 로드 에러:', err);
      setError(err.message || '채용공고를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPosting = (jobPostingId: number) => {
    router.push(`/cover-letters/create?jobPostingId=${jobPostingId}`);
  };

  const handleNewAnalysis = () => {
    router.push('/job-postings/upload');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-zinc-200">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">채용공고 선택</h2>
            <p className="text-sm text-zinc-500 mt-1">
              자기소개서를 작성할 공고를 선택해주세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
            aria-label="닫기"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mb-4" />
              <p className="text-zinc-600">채용공고를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadJobPostings}
                className="px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all font-medium shadow-sm active:scale-95"
              >
                다시 시도
              </button>
            </div>
          ) : jobPostings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-zinc-600 mb-6">
                분석된 채용공고가 없습니다.
                <br />
                먼저 채용공고를 분석해주세요.
              </p>
              <button
                onClick={handleNewAnalysis}
                className="px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg font-medium shadow-sm active:scale-95 transition-all"
              >
                📝 새로운 공고 분석하기
              </button>
            </div>
          ) : (
            <>
              {/* 새 공고 분석 버튼 */}
              <button
                onClick={handleNewAnalysis}
                className="w-full mb-4 px-4 py-3 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg font-medium shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>📝</span>
                <span>새로운 공고 분석하기</span>
              </button>

              {/* 구분선 */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-zinc-200" />
                <span className="text-sm text-zinc-500">또는 기존 공고 선택</span>
                <div className="flex-1 h-px bg-zinc-200" />
              </div>

              {/* 공고 목록 */}
              <div className="space-y-3">
                {jobPostings.map((posting) => (
                  <button
                    key={posting.id}
                    onClick={() => handleSelectPosting(posting.id)}
                    className="w-full p-4 bg-white border border-zinc-200 rounded-lg hover:border-zinc-900 hover:bg-zinc-50 transition-all text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-zinc-900 mb-1">
                          {posting.companyName || '회사명 없음'}
                        </h3>
                        <p className="text-sm text-zinc-600 mb-2">
                          {posting.title || '직무 정보 없음'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span>📅 {formatDate(posting.createdAt)}</span>
                          {posting.analysisJson && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                              ✓ 분석 완료
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-zinc-600 text-xl">→</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all shadow-sm"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

