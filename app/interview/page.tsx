/**
 * 면접 시작 페이지
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InterviewPage from '@/components/InterviewPage';
import { apiClient } from '@/lib/api-client';

interface CoverLetter {
  id: number;
  contentText: string;
  contentPreview: string;
  createdAt: string;
  updatedAt: string;
  jobPosting: {
    id: number;
    title: string;
    companyName: string;
  } | null;
}

export default function InterviewStartPage() {
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [coverLetterId, setCoverLetterId] = useState<number | null>(null);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 자기소개서 목록 로드
  useEffect(() => {
    const loadCoverLetters = async () => {
      try {
        const result = await apiClient.listCoverLetters();
        setCoverLetters(result.coverLetters);
      } catch (err: any) {
        console.error('자기소개서 목록 로드 실패:', err);
        setError('자기소개서 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingList(false);
      }
    };

    loadCoverLetters();
  }, []);

  const handleStart = async () => {
    console.log('🎬 [Frontend] ========== 면접 시작 요청 ==========');
    console.log('🎬 [Frontend] coverLetterId:', coverLetterId);
    console.log('🎬 [Frontend] coverLetterId type:', typeof coverLetterId);

    if (!coverLetterId) {
      console.error('❌ [Frontend] coverLetterId가 선택되지 않음');
      setError('자기소개서를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('📤 [Frontend] API 호출 시작...');
      console.log('📤 [Frontend] 전송 데이터:', { coverLetterId });
      
      const result = await apiClient.startInterview(coverLetterId);
      
      console.log('✅ [Frontend] API 응답 수신:');
      console.log('   - sessionId:', result.sessionId);
      console.log('   - voice:', result.voice);
      console.log('   - turnNumber:', result.turnNumber);
      console.log('   - questionText:', result.questionText?.substring(0, 50) + '...');
      console.log('   - questionAudioUrl:', result.questionAudioUrl);
      
      setSessionData(result);
      setIsStarted(true);
      console.log('🎉 [Frontend] 면접 시작 성공!');
    } catch (err: any) {
      console.error('❌❌❌ [Frontend] 면접 시작 실패 ❌❌❌');
      console.error('Error:', err);
      console.error('Error Message:', err.message);
      console.error('Error Stack:', err.stack);
      setError(err.message || '면접 시작에 실패했습니다.');
    } finally {
      setIsLoading(false);
      console.log('🎬 [Frontend] ==========================================');
    }
  };

  const handleInterviewComplete = (sessionId: number) => {
    router.push(`/interview/result/${sessionId}`);
  };

  if (isStarted && sessionData) {
    return (
      <InterviewPage
        sessionId={sessionData.sessionId}
        initialQuestionText={sessionData.questionText}
        initialQuestionAudioUrl={sessionData.questionAudioUrl}
        onInterviewComplete={handleInterviewComplete}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-16">
      <div className="mb-8">
        <button
          onClick={() => router.push('/')}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← 홈으로 돌아가기
        </button>
      </div>

      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🎤</div>
        <h1 className="text-4xl font-bold mb-4">AI 모의 면접</h1>
        <p className="text-xl text-gray-600">
          실전처럼 AI 면접관과 음성으로 면접을 진행하세요
        </p>
      </div>

      <div className="p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">면접 시작하기</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-700">
              자기소개서 선택
            </label>

            {isLoadingList ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <span className="ml-3 text-gray-600">자기소개서 목록 불러오는 중...</span>
              </div>
            ) : coverLetters.length === 0 ? (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-600 mb-4">작성된 자기소개서가 없습니다.</p>
                <button
                  onClick={() => router.push('/cover-letters/create')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm shadow-sm"
                >
                  자기소개서 작성하러 가기
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {coverLetters.map((letter) => (
                  <div
                    key={letter.id}
                    onClick={() => setCoverLetterId(letter.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      coverLetterId === letter.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        {letter.jobPosting ? (
                          <div className="mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {letter.jobPosting.companyName} - {letter.jobPosting.title}
                            </h3>
                          </div>
                        ) : (
                          <h3 className="font-semibold text-gray-900 mb-2">자기소개서</h3>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {letter.contentPreview}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {coverLetterId === letter.id && (
                          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>ID: {letter.id}</span>
                      <span>작성일: {new Date(letter.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={isLoading || !coverLetterId || isLoadingList}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold shadow-sm"
          >
            {isLoading ? '면접 준비 중...' : '면접 시작'}
          </button>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold mb-2 text-gray-900">📌 안내사항</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 총 5개의 질문이 진행됩니다.</li>
              <li>• 각 질문당 60초의 답변 시간이 주어집니다.</li>
              <li>• 마이크 권한을 허용해주세요.</li>
              <li>• 조용한 환경에서 진행하는 것을 권장합니다.</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              아직 자기소개서를 작성하지 않으셨나요?{' '}
              <button
                onClick={() => router.push('/cover-letters')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                자소서 작성하기
              </button>
            </p>
          </div>
        </div>
      </div>
  );
}






