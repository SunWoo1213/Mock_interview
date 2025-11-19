/**
 * 홈 페이지 (게스트도 접근 가능)
 */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import JobSelectionModal from '@/components/JobSelectionModal';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 네비게이션 핸들러: 로그인 상태 확인 후 이동
  const handleNavigation = (path: string) => {
    if (user) {
      // 로그인 상태: 해당 경로로 이동
      router.push(path);
    } else {
      // 게스트: 로그인 페이지로 리다이렉트
      router.push('/login');
    }
  };

  // 모달 열기 핸들러: 로그인 상태 확인
  const handleOpenModal = () => {
    if (user) {
      setIsModalOpen(true);
    } else {
      router.push('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 md:mb-4 text-gray-900">
            AI 취업 준비 서비스
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-3 md:mb-4 px-4">
            자기소개서 피드백부터 실전 모의면접까지, AI가 함께합니다
          </p>
          {user && (
            <p className="text-sm md:text-base lg:text-lg text-blue-600">
              환영합니다, <span className="font-semibold">{user.name || user.email}</span>님!
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12 lg:mb-16">
          <div className="p-6 md:p-8 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all">
            <div className="text-3xl md:text-4xl mb-3 md:mb-4">📝</div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">채용 공고 분석</h3>
            <p className="text-sm md:text-base text-gray-600 mb-4">
              PDF 업로드만으로 핵심 키워드와 요구사항을 자동 분석합니다.
            </p>
            <button
              onClick={() => handleNavigation('/job-postings/upload')}
              className="block md:inline-block w-full md:w-auto text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              시작하기
            </button>
          </div>

          <div className="p-6 md:p-8 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all">
            <div className="text-3xl md:text-4xl mb-3 md:mb-4">💬</div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">자소서 피드백</h3>
            <p className="text-sm md:text-base text-gray-600 mb-4">
              AI가 당신의 자기소개서를 분석하고 개선점을 제시합니다.
            </p>
            <button
              onClick={handleOpenModal}
              className="block md:inline-block w-full md:w-auto text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              시작하기
            </button>
          </div>

          <div className="p-6 md:p-8 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all">
            <div className="text-3xl md:text-4xl mb-3 md:mb-4">🎤</div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">모의 면접</h3>
            <p className="text-sm md:text-base text-gray-600 mb-4">
              실전처럼 AI 면접관과 음성으로 면접을 진행하세요.
            </p>
            <button
              onClick={() => handleNavigation('/interview')}
              className="block md:inline-block w-full md:w-auto text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              시작하기
            </button>
          </div>

          <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="text-3xl md:text-4xl mb-3 md:mb-4">📊</div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">활동 히스토리</h3>
            <p className="text-sm md:text-base text-gray-600 mb-4">
              내 자기소개서와 면접 기록을 한눈에 확인하세요.
            </p>
            <button
              onClick={() => handleNavigation('/history')}
              className="block md:inline-block w-full md:w-auto text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              히스토리 보기
            </button>
          </div>
        </div>
      </div>

      {/* 채용공고 선택 모달 */}
      <JobSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

