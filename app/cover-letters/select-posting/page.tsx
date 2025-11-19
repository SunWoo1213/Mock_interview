/**
 * 공고 선택 페이지 (자기소개서 작성 전)
 * 분석된 공고 히스토리를 보여주고 선택하도록 함
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface JobPosting {
  id: number;
  title: string | null;
  companyName: string | null;
  analysisJson: any;
  status: string;
  createdAt: string;
}

export default function SelectPostingPage() {
  const router = useRouter();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await apiClient.getJobPostingHistory();
      // 분석 완료된 공고만 필터링
      const analyzed = result.jobPostings.filter(p => p.status === 'analyzed');
      setJobPostings(analyzed);
    } catch (err: any) {
      console.error('히스토리 로드 에러:', err);
      setError(err.message || '공고를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
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
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">공고 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>홈으로</span>
          </button>
          <h1 className="text-4xl font-black mb-2 text-slate-900">
            📋 공고 선택
          </h1>
          <p className="text-gray-600">
            자기소개서를 작성할 공고를 선택해주세요. 분석된 공고 정보를 참고하여 작성할 수 있습니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">❌ {error}</p>
          </div>
        )}

        {/* 새 공고 분석 버튼 */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                ➕ 새로운 공고 분석하기
              </h3>
              <p className="text-gray-600">
                아직 분석하지 않은 공고가 있나요? 먼저 공고를 업로드하고 분석해보세요.
              </p>
            </div>
            <button
              onClick={() => router.push('/job-postings/upload')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap ml-4"
            >
              공고 분석하기 →
            </button>
          </div>
        </div>

        {/* 공고 목록 */}
        {jobPostings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">📄</span>
              </div>
              <p className="text-gray-700 text-lg mb-2">분석된 공고가 없습니다.</p>
              <p className="text-gray-500 text-sm">먼저 채용 공고를 업로드하고 분석해주세요.</p>
            </div>
            <button
              onClick={() => router.push('/job-postings/upload')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-lg"
            >
              첫 공고 분석하기
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900">분석된 공고 목록</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {jobPostings.map(posting => (
                <button
                  key={posting.id}
                  onClick={() => handleSelectPosting(posting.id)}
                  className="relative p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left group"
                >
                  {/* 체크 아이콘 (호버 시) */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-lg">✓</span>
                  </div>

                  {/* 공고 정보 */}
                  <div className="mb-4 pr-12">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {posting.title || '제목 없음'}
                    </h3>
                    {posting.companyName && (
                      <p className="text-gray-600 text-lg">{posting.companyName}</p>
                    )}
                  </div>

                  {/* 분석 결과 미리보기 */}
                  {posting.analysisJson && posting.analysisJson.keywords && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {posting.analysisJson.keywords.slice(0, 6).map((keyword: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
                          >
                            {keyword}
                          </span>
                        ))}
                        {posting.analysisJson.keywords.length > 6 && (
                          <span className="px-3 py-1 text-gray-500 text-sm">
                            +{posting.analysisJson.keywords.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 분석 날짜 */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      분석일: {formatDate(posting.createdAt)}
                    </span>
                    <span className="text-blue-600 font-medium group-hover:text-blue-700">
                      선택하기 →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
