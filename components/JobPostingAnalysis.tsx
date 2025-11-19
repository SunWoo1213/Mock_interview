/**
 * 채용 공고 분석 결과 컴포넌트
 */
'use client';

import React from 'react';

interface JobPostingAnalysisProps {
  analysisJson: {
    keywords?: string[];
    must_have?: string[];
    nice_to_have?: string[];
    summary?: string;
    position?: string;
    company?: string;
  };
}

export default function JobPostingAnalysis({ analysisJson }: JobPostingAnalysisProps) {
  const { keywords = [], must_have = [], nice_to_have = [], summary, position, company } = analysisJson;

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-slate-900">{position || '직무명'}</h2>
        <p className="text-gray-600">{company || '회사명'}</p>
      </div>

      {summary && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">요약</h3>
          <p className="text-slate-700">{summary}</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">핵심 키워드</h3>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-3 py-1 text-sm bg-primary-50 text-primary-700 border border-primary-200 rounded-full"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">필수 요건</h3>
        <ul className="space-y-2">
          {must_have.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-red-600 mt-1">●</span>
              <span className="text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">우대 사항</h3>
        <ul className="space-y-2">
          {nice_to_have.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-green-600 mt-1">○</span>
              <span className="text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

