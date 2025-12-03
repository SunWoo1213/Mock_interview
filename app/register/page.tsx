/**
 * 회원가입 페이지
 */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiClient.register({ email, password, name });
      
      // 토큰 저장
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      alert('회원가입 성공! 프로필을 설정해주세요.');
      router.push('/profile');
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.');
      console.error('회원가입 에러:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full py-8 animate-fade-in">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-zinc-900">회원가입</h1>
          <p className="text-zinc-500">AI와 함께 취업 준비를 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-zinc-700">
              이름 (선택사항)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 rounded-lg border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 focus:outline-none transition-all text-zinc-900 border"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-zinc-700">
              이메일 *
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
              비밀번호 *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-10 rounded-lg border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 focus:outline-none transition-all text-zinc-900 border"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-zinc-500">최소 6자 이상</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-zinc-700">
              비밀번호 확인 *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? '회원가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-zinc-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-zinc-900 hover:text-zinc-700 font-semibold">
              로그인
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








