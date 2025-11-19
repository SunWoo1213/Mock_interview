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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">공고 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 text-gray-400 hover:text-white transition-colors"
          >
            ← 대시보드로
          </button>
          <h1 className="text-4xl font-black mb-2">
            📋 공고 선택
          </h1>
          <p className="text-gray-400">
            자기소개서를 작성할 공고를 선택해주세요. 분석된 공고 정보를 참고하여 작성할 수 있습니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        {/* 새 공고 분석 버튼 */}
        <div className="mb-8 p-6 bg-gradient-to-r from-primary-900/30 to-purple-900/30 border-2 border-primary-500/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                ➕ 새로운 공고 분석하기
              </h3>
              <p className="text-gray-400">
                아직 분석하지 않은 공고가 있나요? 먼저 공고를 업로드하고 분석해보세요.
              </p>
            </div>
            <button
              onClick={() => router.push('/job-postings/upload')}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors whitespace-nowrap ml-4"
            >
              공고 분석하기 →
            </button>
          </div>
        </div>

        {/* 공고 목록 */}
        {jobPostings.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">📄</span>
              </div>
              <p className="text-gray-400 text-lg mb-2">분석된 공고가 없습니다.</p>
              <p className="text-gray-500 text-sm">먼저 채용 공고를 업로드하고 분석해주세요.</p>
            </div>
            <button
              onClick={() => router.push('/job-postings/upload')}
              className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors text-lg"
            >
              첫 공고 분석하기
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4">분석된 공고 목록</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {jobPostings.map(posting => (
                <button
                  key={posting.id}
                  onClick={() => handleSelectPosting(posting.id)}
                  className="relative p-6 bg-gray-900 border-2 border-gray-800 rounded-xl hover:border-primary-500 transition-all text-left group"
                >
                  {/* 체크 아이콘 (호버 시) */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-lg">✓</span>
                  </div>

                  {/* 공고 정보 */}
                  <div className="mb-4 pr-12">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {posting.title || '제목 없음'}
                    </h3>
                    {posting.companyName && (
                      <p className="text-gray-400 text-lg">{posting.companyName}</p>
                    )}
                  </div>

                  {/* 분석 결과 미리보기 */}
                  {posting.analysisJson && posting.analysisJson.keywords && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {posting.analysisJson.keywords.slice(0, 6).map((keyword: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-primary-900/30 text-primary-400 text-sm rounded-full border border-primary-700"
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
                    <span className="text-primary-400 font-medium group-hover:text-primary-300">
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

