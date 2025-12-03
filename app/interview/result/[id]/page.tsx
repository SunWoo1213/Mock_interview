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
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-zinc-900 mb-4" />
          <p className="text-zinc-600">면접 결과 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4 text-zinc-900">결과를 불러올 수 없습니다</h1>
          <p className="text-zinc-500 mb-8">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all shadow-sm active:scale-95 font-medium"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return <InterviewResultPage session={data.session} turns={data.turns} />;
}

