/**
 * 동적 헤더 컴포넌트 (반응형)
 * 인증 상태에 따라 다른 UI를 표시합니다
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user, isLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* 로고/타이틀 */}
          <Link 
            href="/" 
            className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
          >
            AI 취업 준비
          </Link>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {isLoading ? (
              // 로딩 중일 때 작은 스피너 표시
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
              </div>
            ) : user ? (
              // 로그인된 상태
              <>
                <span className="text-sm lg:text-base text-gray-600 hidden lg:inline">
                  안녕하세요, <span className="text-gray-900 font-semibold">{user.name || user.email}</span>님
                </span>
                <Link
                  href="/profile"
                  className="px-3 lg:px-4 py-2 text-sm lg:text-base text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                  프로필
                </Link>
                <Link
                  href="/history"
                  className="px-3 lg:px-4 py-2 text-sm lg:text-base text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                  📊 활동 기록
                </Link>
                <button
                  onClick={logout}
                  className="px-3 lg:px-4 py-2 text-sm lg:text-base bg-white hover:bg-gray-50 rounded-lg transition-colors text-gray-700 border border-gray-300"
                >
                  로그아웃
                </button>
              </>
            ) : (
              // 로그인되지 않은 상태
              <>
                <Link
                  href="/login"
                  className="px-3 lg:px-4 py-2 text-sm lg:text-base text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="px-3 lg:px-4 py-2 text-sm lg:text-base bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white shadow-sm"
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>

          {/* 모바일 햄버거 메뉴 버튼 */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="block md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="메뉴"
          >
            {isMobileMenuOpen ? (
              // X 아이콘
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // 햄버거 아이콘
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* 모바일 메뉴 드롭다운 */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-200">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
              </div>
            ) : user ? (
              // 로그인된 상태 (모바일)
              <div className="flex flex-col space-y-2">
                <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200">
                  안녕하세요, <span className="text-gray-900 font-semibold">{user.name || user.email}</span>님
                </div>
                <Link
                  href="/profile"
                  className="px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  프로필
                </Link>
                <Link
                  href="/history"
                  className="px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  📊 활동 기록
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mx-4 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors text-gray-700 border border-gray-300 text-left"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              // 로그인되지 않은 상태 (모바일)
              <div className="flex flex-col space-y-2">
                <Link
                  href="/login"
                  className="px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="mx-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white text-center shadow-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
