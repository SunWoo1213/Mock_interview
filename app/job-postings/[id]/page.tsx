/**
 * 공고 상세보기 페이지
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import JobPostingAnalysis from '@/components/JobPostingAnalysis';

interface JobPosting {
  id: number;
  title: string | null;
  companyName: string | null;
  originalS3Url: string | null;
  extractedText: string;
  analysisJson: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function JobPostingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadJobPosting = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await apiClient.getJobPosting(parseInt(id, 10));
      setJobPosting(result.jobPosting);
    } catch (err: any) {
      console.error('공고 로드 에러:', err);
      setError(err.message || '공고를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJobPosting();
  }, [loadJobPosting]);

  const handleWriteCoverLetter = () => {
    if (jobPosting) {
      router.push(`/cover-letters/create?jobPostingId=${jobPosting.id}`);
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
      <div className="max-w-5xl mx-auto px-8 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">공고를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !jobPosting) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || '공고를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => router.push('/job-postings/history')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors"
          >
            히스토리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-16">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/job-postings/history')}
            className="mb-4 text-gray-400 hover:text-white transition-colors"
          >
            ← 히스토리로 돌아가기
          </button>

          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black mb-2">
                {jobPosting.title || jobPosting.companyName || '공고 상세'}
              </h1>
              {jobPosting.companyName && jobPosting.title && (
                <p className="text-xl text-gray-400">{jobPosting.companyName}</p>
              )}
            </div>

            {/* 상태 뱃지 */}
            <div>
              {jobPosting.status === 'analyzed' ? (
                <span className="px-4 py-2 bg-green-900/30 text-green-400 text-sm font-bold rounded-full border border-green-700">
                  ✅ 분석 완료
                </span>
              ) : jobPosting.status === 'pending' ? (
                <span className="px-4 py-2 bg-yellow-900/30 text-yellow-400 text-sm font-bold rounded-full border border-yellow-700">
                  ⏳ 분석 대기
                </span>
              ) : (
                <span className="px-4 py-2 bg-red-900/30 text-red-400 text-sm font-bold rounded-full border border-red-700">
                  ❌ 실패
                </span>
              )}
            </div>
          </div>

          <p className="text-gray-500 text-sm">
            등록일: {formatDate(jobPosting.createdAt)}
          </p>
        </div>

        {/* 자기소개서 작성 버튼 */}
        <div className="mb-8">
          <button
            onClick={handleWriteCoverLetter}
            className="w-full px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white text-lg font-bold rounded-lg transition-colors"
          >
            📝 이 공고로 자기소개서 작성하기
          </button>
        </div>

        {/* 분석 결과 */}
        {jobPosting.analysisJson && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">🔍 AI 분석 결과</h2>
            <JobPostingAnalysis analysisJson={jobPosting.analysisJson} />
          </div>
        )}

        {/* 원본 텍스트 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">📄 원본 공고 내용</h2>
          <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
            <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed font-sans">
              {jobPosting.extractedText}
            </pre>
          </div>
        </div>

        {/* 원본 PDF 다운로드 */}
        {jobPosting.originalS3Url && (
          <div className="mb-8">
            <a
              href={jobPosting.originalS3Url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              📥 원본 PDF 다운로드
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

