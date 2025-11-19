/**
 * 면접 결과 페이지 컴포넌트
 */
'use client';

import React from 'react';
import InterviewTurnCard from './InterviewTurnCard';

interface InterviewResultPageProps {
  session: {
    id: number;
    startedAt: string;
    completedAt: string;
    finalFeedback: {
      overall_feedback: string;
      per_turn_feedback: Array<{
        turn_number: number;
        question: string;
        answer: string;
        user_answer_summary: string;
        strengths: string[];
        improvements: string[];
        better_answer_example: string;
      }>;
    };
  };
  turns: Array<{
    turn_number: number;
    question_text: string;
    user_answer_text: string;
    user_answer_audio_s3_url: string;
    feedback_text: any;
  }>;
}

export default function InterviewResultPage({ session, turns }: InterviewResultPageProps) {
  const { finalFeedback } = session;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 text-slate-900">면접 결과</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Overall Feedback (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-slate-900">종합 평가</h2>

                {/* 종합 피드백 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">종합 피드백</h3>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {finalFeedback.overall_feedback}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 px-4 py-3 bg-white hover:bg-gray-50 text-slate-900 border border-gray-300 rounded-lg transition-colors"
                >
                  홈으로
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  결과 출력
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Per Turn Feedback (Scrollable) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">질문별 상세 피드백</h2>

            {turns.map((turn) => {
              // feedback_text는 JSONB 형태로 저장되어 있으므로 문자열로 변환
              const feedbackText = turn.feedback_text 
                ? (typeof turn.feedback_text === 'string' 
                    ? turn.feedback_text 
                    : JSON.stringify(turn.feedback_text))
                : undefined;

              return (
                <InterviewTurnCard
                  key={turn.turn_number}
                  turnNumber={turn.turn_number}
                  questionText={turn.question_text}
                  userAnswerText={turn.user_answer_text}
                  userAnswerAudioUrl={turn.user_answer_audio_s3_url}
                  turnFeedbackText={feedbackText}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

