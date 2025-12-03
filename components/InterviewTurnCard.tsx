/**
 * 면접 질문/답변 카드 컴포넌트 (Accordion)
 */
'use client';

import React, { useState, useMemo } from 'react';
import AudioPlayer from './AudioPlayer';

interface InterviewTurnCardProps {
  turnNumber: number;
  questionText: string;
  userAnswerText: string;
  userAnswerAudioUrl: string;
  turnFeedbackText?: string;
}

interface ParsedFeedback {
  user_answer_summary: string;
  strengths: string[];
  improvements: string[];
  better_answer_example: string;
}

export default function InterviewTurnCard({
  turnNumber,
  questionText,
  userAnswerText,
  userAnswerAudioUrl,
  turnFeedbackText,
}: InterviewTurnCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 피드백 파싱
  const parsedFeedback = useMemo<ParsedFeedback | null>(() => {
    if (!turnFeedbackText) return null;
    
    try {
      const feedback = JSON.parse(turnFeedbackText);
      return {
        user_answer_summary: String(feedback.user_answer_summary || ''),
        strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
        improvements: Array.isArray(feedback.improvements) ? feedback.improvements : [],
        better_answer_example: String(feedback.better_answer_example || ''),
      };
    } catch (error) {
      // 구버전 피드백 (단순 텍스트)
      return null;
    }
  }, [turnFeedbackText]);

  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-blue-600">Q{turnNumber}</span>
          <span className="text-left text-zinc-900 line-clamp-1">{questionText}</span>
        </div>
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 text-zinc-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 py-4 space-y-4 border-t border-zinc-200 bg-zinc-50">
          <div>
            <h4 className="text-sm font-semibold text-zinc-700 uppercase mb-2">질문</h4>
            <p className="text-zinc-700">{questionText}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-700 uppercase mb-2">내 답변 (텍스트)</h4>
            <p className="text-zinc-700 whitespace-pre-wrap">{userAnswerText}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-700 uppercase mb-2">내 답변 (음성)</h4>
            <AudioPlayer audioUrl={userAnswerAudioUrl} />
          </div>

          {turnFeedbackText && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-blue-600 uppercase">📊 AI 피드백</h4>
              
              {parsedFeedback ? (
                <div className="space-y-4">
                  {/* 답변 요약 */}
                  {parsedFeedback.user_answer_summary && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-blue-700 mb-2">📝 답변 요약</h5>
                      <p className="text-zinc-700">{parsedFeedback.user_answer_summary}</p>
                    </div>
                  )}

                  {/* 강점 */}
                  {parsedFeedback.strengths.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-green-700 mb-3">✅ 잘한 점</h5>
                      <ul className="space-y-2">
                        {parsedFeedback.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-600 mt-1">●</span>
                            <span className="text-zinc-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 개선점 */}
                  {parsedFeedback.improvements.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-yellow-700 mb-3">💡 개선할 점</h5>
                      <ul className="space-y-2">
                        {parsedFeedback.improvements.map((improvement, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-yellow-600 mt-1">●</span>
                            <span className="text-zinc-700">{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 모범 답안 예시 */}
                  {parsedFeedback.better_answer_example && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-purple-700 mb-2">🎯 더 나은 답변 예시</h5>
                      <p className="text-zinc-700 italic leading-relaxed">{parsedFeedback.better_answer_example}</p>
                    </div>
                  )}
                </div>
              ) : (
                // 구버전 피드백 (단순 텍스트)
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-zinc-700 whitespace-pre-wrap">{turnFeedbackText}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

