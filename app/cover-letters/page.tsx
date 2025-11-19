/**
 * 자기소개서 목록 페이지
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function CoverLettersPage() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-8 py-16">
      <div className="mb-8">
        <button
          onClick={() => router.push('/')}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← 홈으로 돌아가기
        </button>
      </div>

      <h1 className="text-4xl font-bold mb-8">내 자기소개서</h1>

      <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-bold mb-4">아직 작성한 자기소개서가 없습니다</h2>
        <p className="text-gray-600 mb-8">
          채용 공고를 먼저 업로드하고 분석한 후 자기소개서를 작성하세요.
        </p>
        <button
          onClick={() => router.push('/job-postings/upload')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
        >
          채용 공고 업로드하기
        </button>
      </div>
    </div>
  );
}








