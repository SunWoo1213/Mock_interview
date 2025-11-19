/**
 * 프로필 설정 페이지 (인증 필요)
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 프로필 데이터
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [currentJob, setCurrentJob] = useState('');
  const [careerSummary, setCareerSummary] = useState('');
  const [certifications, setCertifications] = useState('');
  const [career, setCareer] = useState<Array<{ company: string; position: string; period: string }>>([]);
  const [education, setEducation] = useState<Array<{ school: string; major: string; degree: string; graduation_year: number }>>([]);
  const [certificates, setCertificates] = useState<Array<{ name: string; issued_date: string }>>([]);
  const [skills, setSkills] = useState<string[]>([]);

  const loadProfile = useCallback(async () => {
    try {
      const result = await apiClient.getProfile();
      const profile = result.profile;

      setAge(profile.age ? String(profile.age) : '');
      setGender(profile.gender || '');
      setCurrentJob(profile.current_job || '');
      setCareerSummary(profile.career_summary || '');
      setCertifications(profile.certifications || '');
      setCareer(profile.career_json || []);
      setEducation(profile.education_json || []);
      setCertificates(profile.certificates_json || []);
      setSkills(profile.skills_json || []);
    } catch (err: any) {
      console.error('프로필 로드 실패:', err);
      setError(err.message || '프로필 로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.updateProfile({
        age: age ? parseInt(age) : null,
        gender: gender || null,
        current_job: currentJob || null,
        career_summary: careerSummary || null,
        certifications: certifications || null,
        career_json: career,
        education_json: education,
        certificates_json: certificates,
        skills_json: skills,
      });

      setSuccess('프로필이 성공적으로 저장되었습니다!');
      
      // 3초 후 성공 메시지 자동 제거
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || '저장에 실패했습니다.');
      console.error('프로필 저장 실패:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 md:h-16 w-12 md:w-16 border-b-2 border-blue-500 mb-4" />
          <p className="text-sm md:text-base text-gray-600">프로필 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">내 프로필</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm md:text-base bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            로그아웃
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* 기본 정보 */}
          <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">기본 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">나이</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                  placeholder="예: 28"
                  min="0"
                  max="150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">성별</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                >
                  <option value="">선택하세요</option>
                  <option value="male">남자</option>
                  <option value="female">여자</option>
                </select>
              </div>
            </div>
          </div>

          {/* 직업 및 경력 정보 */}
          <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-slate-900">직업 및 경력</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">현재 직업</label>
                <input
                  type="text"
                  value={currentJob}
                  onChange={(e) => setCurrentJob(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder:text-gray-400"
                  placeholder="예: 소프트웨어 엔지니어"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">경력 요약</label>
                <textarea
                  value={careerSummary}
                  onChange={(e) => setCareerSummary(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder:text-gray-400 resize-none"
                  placeholder="요약된 경력을 입력하세요...&#10;&#10;예:&#10;- ABC 회사 개발팀 (2020-2023)&#10;- XYZ 스타트업 백엔드 개발자 (2018-2020)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">소유한 자격증</label>
                <textarea
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder:text-gray-400 resize-none"
                  placeholder="자격증을 쉼표로 구분하여 입력...&#10;&#10;예: 정보처리기사, AWS Solutions Architect, TOEIC 900점"
                />
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold"
            >
              {isSaving ? '저장 중...' : '프로필 저장'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              홈으로
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            💡 <strong>팁:</strong> 자세한 프로필 정보를 입력할수록 AI가 더 정확한 피드백을 제공할 수 있습니다.
            경력, 학력, 자격증 등의 정보는 추후 업데이트 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

