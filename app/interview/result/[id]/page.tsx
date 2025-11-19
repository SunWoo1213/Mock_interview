/**
 * 면접 결과 페이지
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import InterviewResultPage from '@/components/InterviewResultPage';

export default function InterviewResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = typeof params?.id === 'string' ? params.id : '';

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const loadResult = useCallback(async () => {
    try {
      const result = await apiClient.getInterviewResult(parseInt(sessionId));
      setData(result);
    } catch (err: any) {
      setError(err.message || '결과를 불러오는데 실패했습니다.');
      console.error('결과 로드 에러:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mb-4" />
          <p className="text-gray-400">면접 결과 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">결과를 불러올 수 없습니다</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return <InterviewResultPage session={data.session} turns={data.turns} />;
}

