/**
 * 전역 인증 프로바이더 (App Router용)
 * 공개 라우트를 제외한 모든 페이지에 AuthGuard 적용
 */
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AuthGuard from './AuthGuard';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();

  // 인증이 필요 없는 공개 라우트 목록
  const publicRoutes = [
    '/',           // 홈 (게스트도 볼 수 있음)
    '/login',      // 로그인
    '/register',   // 회원가입
  ];

  // 현재 경로가 공개 라우트인지 확인
  const isPublicRoute = pathname ? publicRoutes.includes(pathname) : false;

  // 공개 라우트라면 AuthGuard 없이 렌더링
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // 보호된 라우트라면 AuthGuard로 감싸기
  return <AuthGuard>{children}</AuthGuard>;
}





