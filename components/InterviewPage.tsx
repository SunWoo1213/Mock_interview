/**
 * 면접 진행 페이지 컴포넌트 (리팩토링)
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import CountdownTimer from './CountdownTimer';
import AudioVisualizer from './AudioVisualizer';

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

  // 첫 질문 자동 재생
  useEffect(() => {
    playQuestionAudio();
  }, []);

  // 질문 오디오 URL이 변경될 때 자동 재생
  useEffect(() => {
    if (interviewState === 'listening' && questionAudioUrl) {
      playQuestionAudio();
    }
  }, [questionAudioUrl]);

  /**
   * 질문 오디오 자동 재생
   */
  const playQuestionAudio = () => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch((error) => {
        console.error('오디오 재생 실패:', error);
        // 자동 재생 실패 시 수동 재생 안내
        alert('질문 음성을 재생하려면 화면을 클릭해주세요.');
      });
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
   * 면접 종료 (중간에 나가기)
   */
  const handleEndInterview = () => {
    if (confirm('면접을 중단하고 나가시겠습니까? (진행 상황은 저장되지 않습니다)')) {
      cleanupMediaStream();
      window.location.href = '/';
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
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">AI 모의 면접</h1>
          <button
            onClick={handleEndInterview}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600 rounded-lg transition-colors text-sm"
          >
            면접 중단
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
            src={questionAudioUrl}
            onEnded={handleQuestionAudioEnded}
            onPlay={() => console.log('질문 오디오 재생 시작')}
            onError={(e) => console.error('오디오 로드 에러:', e)}
            style={{ display: 'none' }}
          />

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
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent" />
              <p className="mt-6 text-xl text-gray-300">AI가 답변을 분석하고 있습니다...</p>
              <p className="mt-2 text-sm text-gray-500">잠시만 기다려주세요</p>
            </div>
          )}

          {/* 청취 중 표시 */}
          {interviewState === 'listening' && (
            <div className="text-center">
              <div className="inline-block">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
              <p className="mt-4 text-gray-400">질문을 재생 중입니다...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

