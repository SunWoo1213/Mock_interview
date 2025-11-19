/**
 * 전역 인증 상태 관리 Context
 */
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 사용자 타입 정의
interface User {
  id: number;
  email: string;
  name?: string;
}

// AuthContext 타입 정의
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

// Context 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 컴포넌트 마운트 시 토큰 확인 및 사용자 정보 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        // localStorage에서 토큰 확인
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsLoading(false);
          return;
        }

        // /api/auth/me 엔드포인트 호출하여 사용자 정보 가져오기
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // 토큰이 유효하지 않으면 제거
          localStorage.removeItem('token');
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // 로그인 함수
  const login = (token: string, userData: User) => {
    // 토큰을 localStorage에 저장
    localStorage.setItem('token', token);
    
    // 사용자 상태 업데이트
    setUser(userData);
    
    // 홈으로 리다이렉트
    router.push('/');
  };

  // 로그아웃 함수
  const logout = () => {
    // 토큰 제거
    localStorage.removeItem('token');
    
    // 사용자 상태 초기화
    setUser(null);
    
    // 대시보드로 리다이렉트 (게스트도 볼 수 있음)
    router.push('/');
  };

  // Context 값 제공
  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth 커스텀 훅
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

