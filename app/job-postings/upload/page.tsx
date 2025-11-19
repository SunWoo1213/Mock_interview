/**
 * 채용 공고 업로드 페이지 (인증 필요)
 */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import JobPostingAnalysis from '@/components/JobPostingAnalysis';

type InputMode = 'pdf' | 'text';

export default function UploadJobPostingPage() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobPostingId, setJobPostingId] = useState<number | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('PDF 파일만 업로드 가능합니다.');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const result = await apiClient.uploadJobPosting(file);
      setJobPostingId(result.jobPostingId);
      setExtractedText(result.extractedText);
      alert('공고 업로드 성공! 이제 분석을 진행합니다.');

      // 자동으로 분석 시작
      await handleAnalyze(result.jobPostingId);
    } catch (err: any) {
      setError(err.message || '업로드에 실패했습니다.');
      console.error('업로드 에러:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!manualText.trim()) {
      setError('채용 공고 내용을 입력해주세요.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const result = await apiClient.submitJobPostingText(manualText);
      setJobPostingId(result.jobPostingId);
      setExtractedText(result.extractedText);
      alert('공고 등록 성공! 이제 분석을 진행합니다.');

      // 자동으로 분석 시작
      await handleAnalyze(result.jobPostingId);
    } catch (err: any) {
      setError(err.message || '등록에 실패했습니다.');
      console.error('등록 에러:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async (id?: number) => {
    const targetId = id || jobPostingId;
    if (!targetId) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const result = await apiClient.analyzeJobPosting(targetId);
      setAnalysis(result.analysis);
      alert('공고 분석 완료!');
    } catch (err: any) {
      setError(err.message || '분석에 실패했습니다.');
      console.error('분석 에러:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-16">
      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-white transition-colors"
          >
            ← 홈으로 돌아가기
          </button>
        </div>

        <h1 className="text-4xl font-bold mb-8">채용 공고 업로드 및 분석</h1>

        {/* 입력 방식 선택 탭 */}
        <div className="mb-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setInputMode('pdf');
                setError('');
              }}
              className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
                inputMode === 'pdf'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-700'
              }`}
            >
              📄 PDF 업로드
            </button>
            <button
              onClick={() => {
                setInputMode('text');
                setError('');
              }}
              className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
                inputMode === 'text'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-700'
              }`}
            >
              ✏️ 텍스트 입력
            </button>
          </div>

          {/* PDF 업로드 모드 */}
          {inputMode === 'pdf' && (
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h2 className="text-2xl font-bold mb-4">PDF 파일 업로드</h2>
              
              <div className="mb-4">
                <label className="block mb-2 text-gray-600">
                  채용 공고 PDF 파일을 선택하세요
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                  disabled={isUploading}
                />
              </div>

              {file && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">선택된 파일:</p>
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    크기: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold"
              >
                {isUploading ? '업로드 중...' : '업로드 및 분석 시작'}
              </button>
            </div>
          )}

          {/* 텍스트 입력 모드 */}
          {inputMode === 'text' && (
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h2 className="text-2xl font-bold mb-4">채용 공고 텍스트 입력</h2>
              
              <div className="mb-4">
                <label className="block mb-2 text-gray-600">
                  채용 공고 내용을 직접 입력하거나 복사해서 붙여넣으세요
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="예시:&#10;[채용공고]&#10;회사명: OO기업&#10;포지션: 백엔드 개발자&#10;주요 업무:&#10;- Node.js 기반 API 개발&#10;- 데이터베이스 설계 및 최적화&#10;&#10;자격 요건:&#10;- Node.js, TypeScript 경험 3년 이상&#10;- PostgreSQL, MongoDB 사용 경험&#10;..."
                  className="w-full h-96 px-4 py-3 bg-gray-50 border border-gray-700 rounded-lg text-white resize-none focus:border-primary-500 focus:outline-none"
                  disabled={isUploading}
                />
                <p className="mt-2 text-sm text-gray-500">
                  {manualText.length} 글자 입력됨
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleTextSubmit}
                disabled={!manualText.trim() || isUploading}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold"
              >
                {isUploading ? '등록 중...' : '등록 및 분석 시작'}
              </button>
            </div>
          )}
        </div>

        {/* 추출된 텍스트 */}
        {extractedText && (
          <div className="mb-8 p-8 bg-white rounded-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-4">2. 추출된 텍스트</h2>
            <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-300">
                {extractedText}
              </pre>
            </div>
          </div>
        )}

        {/* AI 분석 중 */}
        {isAnalyzing && (
          <div className="mb-8 p-8 bg-white rounded-lg border border-gray-200 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4" />
            <p className="text-gray-600">AI가 공고를 분석하는 중입니다...</p>
          </div>
        )}

        {/* 분석 결과 */}
        {analysis && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. AI 분석 결과</h2>
            <JobPostingAnalysis analysisJson={analysis} />
            
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => router.push(`/cover-letters/create?jobPostingId=${jobPostingId}`)}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold"
              >
                이 공고로 자소서 작성하기
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gray-50 hover:bg-gray-700 rounded-lg transition-colors"
              >
                다른 공고 업로드
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

