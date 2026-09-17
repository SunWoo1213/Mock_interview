/**
 * 로그인 페이지
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 [Login] Attempting login...');
      const result = await apiClient.login({ email, password });
      
      console.log('✅ [Login] Login successful, received token');
      
      // AuthContext의 login 함수를 호출
      // 자동으로 토큰 저장, 상태 업데이트, 리다이렉트 처리
      login(result.token, result.user);
      
      // 로그인 후 localStorage 확인
      console.log('💾 [Login] Token stored in localStorage:', localStorage.getItem('token') ? 'YES' : 'NO');
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
      console.error('❌ [Login] 로그인 에러:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-in">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-zinc-900">로그인</h1>
          <p className="text-zinc-500">AI 취업 준비 서비스에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-zinc-700">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 rounded-lg border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 focus:outline-none transition-all text-zinc-900 border"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-zinc-700">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-10 rounded-lg border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 focus:outline-none transition-all text-zinc-900 border"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed rounded-lg transition-all font-medium shadow-sm active:scale-95"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-zinc-600">
            계정이 없으신가요?{' '}
            <Link href="/register" className="text-zinc-900 hover:text-zinc-700 font-semibold">
              회원가입
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-zinc-500 hover:text-zinc-700 text-sm transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}





