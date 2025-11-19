/**
 * 면접 진행 페이지 컴포넌트 (리팩토링)
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import CountdownTimer from './CountdownTimer';
import AudioVisualizer from './AudioVisualizer';
import { apiClient } from '@/lib/api-client';

interface InterviewPageProps {
  sessionId: number;
  initialQuestionText: string;
  initialQuestionAudioUrl: string;
  onInterviewComplete: (sessionId: number) => void;
}

// 면접 상태 타입 정의
type InterviewState = 'listening' | 'recording' | 'processing' | 'waiting_next';

export default function InterviewPage({
  sessionId,
  initialQuestionText,
  initialQuestionAudioUrl,
  onInterviewComplete,
}: InterviewPageProps) {
  // 질문 정보
  const [questionText, setQuestionText] = useState(initialQuestionText);
  const [questionAudioUrl, setQuestionAudioUrl] = useState(initialQuestionAudioUrl);
  const [turnNumber, setTurnNumber] = useState(1);
  
  // 상태 관리 (명확한 상태 구분)
  const [interviewState, setInterviewState] = useState<InterviewState>('listening');
  
  // 녹음 관련
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioRef = useRef<Blob | null>(null);
  
  // 폴백(Fallback) 상태: 자동 재생 실패 시 수동 버튼 표시
  const [showPlayButton, setShowPlayButton] = useState(false);

  /**
   * 견고한 오디오 재생 로직
   * questionAudioUrl이 변경될 때만 실행
   */
  useEffect(() => {
    // 디버그 로깅 1: URL 확인
    console.log('🎵 [TTS DEBUG] Current Audio URL:', questionAudioUrl);
    console.log('🎵 [TTS DEBUG] URL Type:', typeof questionAudioUrl);
    console.log('🎵 [TTS DEBUG] URL Length:', questionAudioUrl?.length);
    console.log('📊 [TTS DEBUG] Interview State:', interviewState);

    // URL이 없거나 빈 문자열이면 종료
    if (!questionAudioUrl || questionAudioUrl.trim().length === 0) {
      console.warn('⚠️ [TTS DEBUG] 유효하지 않은 오디오 URL');
      return;
    }

    // 'listening' 상태가 아니면 재생하지 않음
    if (interviewState !== 'listening') {
      console.log('⏸️ [TTS DEBUG] Not in listening state, skipping playback');
      return;
    }

    // audioRef가 없으면 종료
    if (!audioRef.current) {
      console.error('❌ [TTS DEBUG] Audio element ref is null');
      return;
    }

    // 재생 시도 함수
    const attemptPlay = async () => {
      try {
        console.log('🔄 [TTS DEBUG] Loading audio...');
        audioRef.current!.load();

        console.log('▶️ [TTS DEBUG] Attempting to play audio...');
        await audioRef.current!.play();

        console.log('✅ [TTS DEBUG] Audio playback successful!');
        setShowPlayButton(false); // 성공 시 버튼 숨김
      } catch (error: any) {
        console.error('❌ [TTS DEBUG] Audio playback failed:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);

        // 브라우저 자동 재생 정책으로 차단된 경우
        if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
          console.warn('⚠️ [TTS DEBUG] Blocked by browser autoplay policy');
          setShowPlayButton(true); // 수동 재생 버튼 표시
        } else {
          console.error('⚠️ [TTS DEBUG] Other audio error');
          setShowPlayButton(true);
        }
      }
    };

    // 약간의 지연 후 재생 시도 (DOM 준비 대기)
    const timer = setTimeout(attemptPlay, 100);

    return () => clearTimeout(timer);
  }, [questionAudioUrl, interviewState]);


  /**
   * 수동 재생 버튼 클릭 (폴백)
   */
  const handleManualPlay = async () => {
    console.log('🖱️ [TTS DEBUG] User clicked manual play button');
    
    if (!audioRef.current) {
      console.error('❌ [TTS DEBUG] Audio ref is null on manual play');
      return;
    }

    try {
      console.log('▶️ [TTS DEBUG] Manual play attempt...');
      await audioRef.current.play();
      console.log('✅ [TTS DEBUG] Manual play successful!');
      setShowPlayButton(false); // 재생 성공 시 버튼 숨김
    } catch (error: any) {
      console.error('❌ [TTS DEBUG] Manual play failed:', error);
      alert('오디오 재생에 실패했습니다. 브라우저 설정을 확인해주세요.');
    }
  };

  /**
   * 질문 오디오 재생 완료 핸들러
   */
  const handleQuestionAudioEnded = () => {
    console.log('질문 오디오 재생 완료');
    startRecording();
  };

  /**
   * 녹음 시작
   */
  const startRecording = async () => {
    try {
      console.log('녹음 시작 시도...');
      
      // 기존 스트림 정리
      cleanupMediaStream();

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      mediaStreamRef.current = stream;
      
      // MediaRecorder 생성
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('녹음 정지됨, 오디오 생성 중...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        recordedAudioRef.current = audioBlob;
        
        // 스트림 정리
        cleanupMediaStream();
        
        // 다음 질문 대기 상태로 전환
        setInterviewState('waiting_next');
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder 에러:', event.error);
        cleanupMediaStream();
        alert('녹음 중 오류가 발생했습니다.');
      };

      // 녹음 시작
      mediaRecorder.start();
      setInterviewState('recording');
      console.log('녹음 시작됨');
      
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      alert('마이크 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요.');
      cleanupMediaStream();
    }
  };

  /**
   * 녹음 중지
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('녹음 중지 시도...');
      mediaRecorderRef.current.stop();
      setInterviewState('waiting_next');
    }
  };

  /**
   * MediaStream 정리 (포트 연결 해제 문제 해결)
   */
  const cleanupMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  /**
   * 타이머 완료 핸들러 (60초 경과)
   */
  const handleCountdownComplete = () => {
    console.log('타이머 종료, 녹음 중지');
    stopRecording();
  };

  /**
   * 다음 질문 버튼 클릭 (답변 제출)
   */
  const handleNextQuestion = async () => {
    if (!recordedAudioRef.current) {
      alert('녹음된 답변이 없습니다.');
      return;
    }

    setInterviewState('processing');

    try {
      const formData = new FormData();
      formData.append('sessionId', sessionId.toString());
      formData.append('turnNumber', turnNumber.toString());
      formData.append('audio', recordedAudioRef.current, `answer_${turnNumber}.webm`);

      const token = localStorage.getItem('token');

      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      // 녹음된 오디오 초기화
      recordedAudioRef.current = null;

      if (data.isCompleted) {
        // 면접 완료
        console.log('면접 완료, 결과 페이지로 이동');
        onInterviewComplete(sessionId);
      } else {
        // 다음 질문으로 이동
        console.log('다음 질문 로드:', data.turnNumber);
        setQuestionText(data.questionText);
        setQuestionAudioUrl(data.questionAudioUrl);
        setTurnNumber(data.turnNumber);
        setInterviewState('listening');
      }
    } catch (error) {
      console.error('답변 제출 실패:', error);
      alert('답변 제출에 실패했습니다.');
      setInterviewState('waiting_next');
    }
  };

  /**
   * 면접 종료 및 결과 보기 (언제든 가능)
   */
  const handleFinishAndViewResults = async () => {
    // 답변이 하나도 없으면 종료 불가
    if (turnNumber < 2) {
      alert('최소 1개 이상의 질문에 답변해야 결과를 볼 수 있습니다.');
      return;
    }

    const confirmed = confirm(
      `현재까지의 답변으로 평가를 진행하시겠습니까?\n\n` +
      `답변하신 ${turnNumber - 1}개의 질문에 대한 AI 피드백을 받으실 수 있습니다.`
    );

    if (!confirmed) return;

    try {
      setInterviewState('processing');
      console.log('🔚 면접 종료 및 평가 시작...');

      const response = await apiClient.finishInterview(sessionId);

      console.log('✅ 평가 완료:', response);

      // 정리 및 결과 페이지로 이동
      cleanupMediaStream();
      onInterviewComplete(sessionId);
    } catch (error) {
      console.error('❌ 평가 처리 실패:', error);
      alert('평가 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      setInterviewState('waiting_next');
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanupMediaStream();
    };
  }, []);

  // 상태별 UI 메시지
  const getStateMessage = () => {
    switch (interviewState) {
      case 'listening':
        return '🎧 질문을 듣고 있습니다...';
      case 'recording':
        return '🎤 답변을 녹음 중입니다 (60초)';
      case 'processing':
        return '⏳ AI가 답변을 분석하고 있습니다...';
      case 'waiting_next':
        return '✅ 녹음 완료! "다음 질문" 버튼을 클릭하세요';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 p-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">AI 모의 면접</h1>
          
          {/* 면접 종료 및 결과 보기 버튼 */}
          <button
            onClick={handleFinishAndViewResults}
            disabled={turnNumber < 2 || interviewState === 'processing'}
            className={`px-6 py-2.5 rounded-lg transition-all duration-200 text-sm font-bold flex items-center gap-2 shadow-lg ${
              turnNumber < 2 || interviewState === 'processing'
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white transform hover:scale-105'
            }`}
            title={
              turnNumber < 2 
                ? '최소 1개 이상의 질문에 답변해야 결과를 볼 수 있습니다' 
                : '현재까지의 답변으로 AI 평가를 받고 결과를 확인합니다'
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            면접 종료 및 결과 보기
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* 진행 상태 */}
          <div className="text-center space-y-2">
            <span className="text-2xl font-bold text-primary-500">질문 {turnNumber} / 5</span>
            <p className="text-gray-400 text-sm">{getStateMessage()}</p>
          </div>

          {/* 질문 영역 */}
          <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-gray-700 min-h-[200px] flex items-center justify-center shadow-2xl">
            <p className="text-2xl text-center leading-relaxed font-medium">{questionText}</p>
          </div>

          {/* 숨겨진 오디오 플레이어 (TTS 자동 재생) */}
          <audio
            ref={audioRef}
            playsInline // 모바일에서 전체화면 방지
            muted={false} // 볼륨 체크: 음소거 안 됨
            preload="auto" // 미리 로드
            crossOrigin="anonymous" // CORS 지원
            onEnded={() => {
              console.log('🏁 [TTS DEBUG] Audio playback ended');
              handleQuestionAudioEnded();
            }}
            onPlay={() => {
              console.log('✅ [TTS DEBUG] Audio started playing');
              setShowPlayButton(false);
            }}
            onPause={() => console.log('⏸️ [TTS DEBUG] Audio paused')}
            onError={(e) => {
              console.error('❌ [TTS DEBUG] Audio load error:', e);
              const audio = e.currentTarget;
              console.error('[TTS DEBUG] Error code:', audio.error?.code);
              console.error('[TTS DEBUG] Error message:', audio.error?.message);
              console.error('[TTS DEBUG] Audio src:', audio.src);
              console.error('[TTS DEBUG] Network state:', audio.networkState);
              console.error('[TTS DEBUG] Ready state:', audio.readyState);
              setShowPlayButton(true); // 에러 시 수동 버튼 표시
            }}
            onLoadedData={() => console.log('📥 [TTS DEBUG] Audio data loaded')}
            onCanPlay={() => console.log('✅ [TTS DEBUG] Audio can play now')}
            onLoadStart={() => console.log('🔄 [TTS DEBUG] Audio load started')}
            onSuspend={() => console.log('⏸️ [TTS DEBUG] Audio load suspended')}
            onStalled={() => console.log('⚠️ [TTS DEBUG] Audio load stalled')}
            className="hidden"
          >
            {/* source 태그로 명시적 MIME type 지정 */}
            <source src={questionAudioUrl} type="audio/mpeg" />
            {/* 폴백 메시지 */}
            Your browser does not support the audio element.
          </audio>

          {/* 녹음 상태 표시 */}
          {interviewState === 'recording' && (
            <div className="flex flex-col items-center gap-6">
              <CountdownTimer 
                duration={60} 
                isActive={true} 
                onComplete={handleCountdownComplete} 
              />
              <AudioVisualizer isRecording={true} />
              <button
                onClick={stopRecording}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold shadow-lg"
              >
                녹음 중지
              </button>
            </div>
          )}

          {/* 다음 질문 대기 상태 */}
          {interviewState === 'waiting_next' && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-600/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-green-400 mb-2">답변 녹음 완료!</p>
                <p className="text-gray-400 text-sm">다음 질문으로 넘어가시려면 버튼을 클릭하세요</p>
              </div>
              
              {turnNumber < 5 ? (
                <button
                  onClick={handleNextQuestion}
                  className="px-12 py-4 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-bold text-lg shadow-xl"
                >
                  다음 질문 →
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-12 py-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-bold text-lg shadow-xl"
                >
                  면접 결과 보기 ✓
                </button>
              )}
            </div>
          )}

          {/* 처리 중 표시 */}
          {interviewState === 'processing' && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mb-6" />
              <p className="text-2xl font-bold text-primary-400 mb-3">결과 분석 중...</p>
              <p className="text-lg text-gray-300 mb-2">AI가 답변을 분석하고 있습니다</p>
              <p className="text-sm text-gray-500">잠시만 기다려주세요. 곧 상세한 피드백을 확인하실 수 있습니다.</p>
            </div>
          )}

          {/* 청취 중 표시 */}
          {interviewState === 'listening' && (
            <div className="text-center">
              {showPlayButton ? (
                // 자동 재생 실패 시 수동 재생 버튼 표시 (폴백)
                <div>
                  <div className="mb-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-600/20 flex items-center justify-center">
                      <svg className="w-10 h-10 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-xl text-yellow-400 mb-2">🔊 질문 듣기</p>
                    <p className="text-sm text-gray-400 mb-6">
                      브라우저 설정으로 인해 자동 재생이 차단되었습니다.<br />
                      아래 버튼을 클릭하여 질문을 들어주세요.
                    </p>
                  </div>
                  <button
                    onClick={handleManualPlay}
                    className="px-12 py-4 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-bold text-lg shadow-xl flex items-center gap-3 mx-auto"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    🔊 질문 듣기
                  </button>
                </div>
              ) : (
                // 정상 재생 중
                <div>
                  <div className="inline-block mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                      <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                  <p className="text-gray-400">질문을 재생 중입니다...</p>
                  <p className="text-xs text-gray-500 mt-2">재생이 완료되면 자동으로 녹음이 시작됩니다</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


