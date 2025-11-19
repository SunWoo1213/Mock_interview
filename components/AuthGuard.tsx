/**
 * 클라이언트 사이드 인증 가드 컴포넌트
 * 인증되지 않은 사용자를 로그인 페이지로 리다이렉트합니다.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // 토큰 확인
    const token = localStorage.getItem('token');

    if (!token) {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      router.push('/login');
    } else {
      // 토큰이 있으면 검증 완료
      setIsVerified(true);
    }
  }, [router]);

  // 검증 중일 때 로딩 표시
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mb-4" />
          <p className="text-gray-400">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 검증 완료 시 자식 컴포넌트 렌더링
  return <>{children}</>;
}








