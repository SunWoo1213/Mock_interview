/**
 * 홈 페이지 (로그인 필요)
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 text-gray-900">
            AI 취업 준비 서비스
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            자기소개서 피드백부터 실전 모의면접까지, AI가 함께합니다
          </p>
          {user && (
            <p className="text-lg text-primary-600">
              환영합니다, <span className="font-semibold">{user.name || user.email}</span>님!
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="p-8 bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">채용 공고 분석</h3>
            <p className="text-gray-600 mb-4">
              PDF 업로드만으로 핵심 키워드와 요구사항을 자동 분석합니다.
            </p>
            <Link
              href="/job-postings/upload"
              className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              시작하기
            </Link>
          </div>

          <div className="p-8 bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">자소서 피드백</h3>
            <p className="text-gray-600 mb-4">
              AI가 당신의 자기소개서를 분석하고 개선점을 제시합니다.
            </p>
            <Link
              href="/cover-letters"
              className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              시작하기
            </Link>
          </div>

          <div className="p-8 bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all">
            <div className="text-4xl mb-4">🎤</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">모의 면접</h3>
            <p className="text-gray-600 mb-4">
              실전처럼 AI 면접관과 음성으로 면접을 진행하세요.
            </p>
            <Link
              href="/interview"
              className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              시작하기
            </Link>
          </div>

          <div className="p-8 bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg border-2 border-primary-200 hover:border-primary-400 hover:shadow-md transition-all">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">활동 히스토리</h3>
            <p className="text-gray-600 mb-4">
              내 자기소개서와 면접 기록을 한눈에 확인하세요.
            </p>
            <Link
              href="/history"
              className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              히스토리 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

