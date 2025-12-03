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
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-zinc-900 mb-4" />
          <p className="text-zinc-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16 animate-fade-in">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 md:mb-4 text-zinc-900">
            AI 취업 준비 서비스
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-zinc-500 mb-3 md:mb-4 px-4">
            자기소개서 피드백부터 실전 모의면접까지, AI가 함께합니다
          </p>
          {user && (
            <p className="text-sm md:text-base lg:text-lg text-zinc-700">
              환영합니다, <span className="font-semibold text-zinc-900">{user.name || user.email}</span>님!
            </p>
          )}
        </div>

        {/* 벤토 그리드 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          {/* 모의 면접 - 중요하므로 2칸 차지 */}
          <div className="md:col-span-2 p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
            <div className="text-5xl mb-4">🎤</div>
            <h3 className="text-3xl font-bold mb-3 text-zinc-900">모의 면접</h3>
            <p className="text-base text-zinc-500 mb-6 leading-relaxed">
              실전처럼 AI 면접관과 음성으로 면접을 진행하세요. 
              실시간 피드백과 함께 면접 실력을 향상시킬 수 있습니다.
            </p>
            <button
              onClick={() => handleNavigation('/interview')}
              className="px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg font-medium shadow-sm active:scale-95 transition-all duration-200"
            >
              면접 시작하기
            </button>
          </div>

          {/* 활동 히스토리 */}
          <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-2xl font-bold mb-2 text-zinc-900">활동 히스토리</h3>
            <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
              내 자기소개서와 면접 기록을 한눈에 확인하세요.
            </p>
            <button
              onClick={() => handleNavigation('/history')}
              className="w-full px-4 py-2 bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-sm transition-all duration-200 font-medium"
            >
              히스토리 보기
            </button>
          </div>

          {/* 채용 공고 분석 */}
          <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-2xl font-bold mb-2 text-zinc-900">채용 공고 분석</h3>
            <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
              PDF 업로드만으로 핵심 키워드와 요구사항을 자동 분석합니다.
            </p>
            <button
              onClick={() => handleNavigation('/job-postings/upload')}
              className="w-full px-4 py-2 bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-sm transition-all duration-200 font-medium"
            >
              시작하기
            </button>
          </div>

          {/* 자소서 피드백 */}
          <div className="md:col-span-2 p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-2xl font-bold mb-2 text-zinc-900">자소서 피드백</h3>
            <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
              AI가 당신의 자기소개서를 분석하고 개선점을 제시합니다. 맞춤형 피드백으로 합격률을 높이세요.
            </p>
            <button
              onClick={handleOpenModal}
              className="px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg font-medium shadow-sm active:scale-95 transition-all duration-200"
            >
              피드백 받기
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

