/**
 * 프로필 폼 컴포넌트
 * 사용자 프로필 정보를 입력하거나 수정하는 폼
 */
'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function ProfileForm() {
  // 폼 필드 상태 관리
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [currentJob, setCurrentJob] = useState('');
  const [careerSummary, setCareerSummary] = useState('');
  const [certifications, setCertifications] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 프로필 데이터 로딩
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await apiClient.getProfile();
        const profile = result.profile;

        // 기존 데이터로 폼 필드 업데이트
        setAge(profile.age ? String(profile.age) : '');
        setGender(profile.gender || '');
        setCurrentJob(profile.current_job || '');
        setCareerSummary(profile.career_summary || '');
        setCertifications(profile.certifications || '');
      } catch (err: any) {
        console.error('프로필 로드 에러:', err);
        setError(err.message || '프로필을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.updateProfile({
        age: age ? parseInt(age) : null,
        gender: gender || null,
        current_job: currentJob || null,
        career_summary: careerSummary || null,
        certifications: certifications || null,
      });

      alert('프로필이 성공적으로 저장되었습니다!');
    } catch (err: any) {
      console.error('프로필 저장 에러:', err);
      setError(err.message || '프로필 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중 표시
  if (isLoading && !age && !gender) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-400">프로필 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* 나이 */}
        <div>
          <label htmlFor="age" className="block text-sm font-medium mb-2 text-gray-700">
            나이
          </label>
          <input
            id="age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder:text-gray-400"
            placeholder="예: 28"
            min="0"
            max="150"
          />
        </div>

        {/* 성별 */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium mb-2 text-gray-700">
            성별
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
          >
            <option value="">선택하세요</option>
            <option value="male">남자</option>
            <option value="female">여자</option>
          </select>
        </div>

        {/* 현재 직업 */}
        <div>
          <label htmlFor="currentJob" className="block text-sm font-medium mb-2 text-gray-700">
            현재 직업
          </label>
          <input
            id="currentJob"
            type="text"
            value={currentJob}
            onChange={(e) => setCurrentJob(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder:text-gray-400"
            placeholder="예: 소프트웨어 엔지니어"
          />
        </div>

        {/* 경력 */}
        <div>
          <label htmlFor="careerSummary" className="block text-sm font-medium mb-2 text-gray-700">
            경력
          </label>
          <textarea
            id="careerSummary"
            value={careerSummary}
            onChange={(e) => setCareerSummary(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder:text-gray-400 resize-none"
            placeholder="요약된 경력을 입력하세요...&#10;&#10;예:&#10;- ABC 회사 개발팀 (2020-2023)&#10;- XYZ 스타트업 백엔드 개발자 (2018-2020)"
          />
        </div>

        {/* 소유한 자격증 */}
        <div>
          <label htmlFor="certifications" className="block text-sm font-medium mb-2 text-gray-700">
            소유한 자격증
          </label>
          <textarea
            id="certifications"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder:text-gray-400 resize-none"
            placeholder="자격증을 쉼표로 구분하여 입력...&#10;&#10;예: 정보처리기사, AWS Solutions Architect, TOEIC 900점"
          />
        </div>

        {/* 제출 버튼 */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold text-white"
          >
            {isLoading ? '저장 중...' : '프로필 저장'}
          </button>
        </div>

        {/* 도움말 */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-slate-700">
            💡 <strong>팁:</strong> 자세한 프로필 정보를 입력할수록 AI가 더 정확한 면접 질문과 피드백을 제공할 수 있습니다.
          </p>
        </div>
      </form>
    </div>
  );
}

