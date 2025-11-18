/**
 * Frontend API 클라이언트 유틸리티
 */

// 항상 상대 경로 사용 (같은 도메인의 API 호출)
// Preview 배포와 Production 모두 자동으로 올바른 도메인 사용
const API_URL = '';

export class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    // Headers 클래스 사용으로 리팩터링
    const headers = new Headers(options.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(data: { email: string; password: string; name?: string }) {
    return this.request<{ user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Profile
  async getProfile() {
    return this.request<{ profile: any }>('/api/profile');
  }

  async updateProfile(data: any) {
    return this.request<{ message: string }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Job Postings
  async uploadJobPosting(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<{ jobPostingId: number; extractedText: string }>(
      '/api/job-postings/upload',
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  async submitJobPostingText(text: string) {
    return this.request<{ jobPostingId: number; extractedText: string }>(
      '/api/job-postings/submit-text',
      {
        method: 'POST',
        body: JSON.stringify({ text }),
      }
    );
  }

  async analyzeJobPosting(jobPostingId: number) {
    return this.request<{ analysis: any }>('/api/job-postings/analyze', {
      method: 'POST',
      body: JSON.stringify({ jobPostingId }),
    });
  }

  // Cover Letters
  async createCoverLetter(data: { jobPostingId: number; contentText: string }) {
    return this.request<{ coverLetterId: number; feedback: any }>(
      '/api/cover-letters/create',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getCoverLetter(id: number) {
    return this.request<{ coverLetter: any }>(`/api/cover-letters/${id}`);
  }

  async listCoverLetters() {
    return this.request<{ 
      coverLetters: Array<{
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
      }>;
      total: number;
    }>('/api/cover-letters/list');
  }

  // Interview
  async startInterview(coverLetterId: number) {
    return this.request<{
      sessionId: number;
      turnNumber: number;
      questionText: string;
      questionAudioUrl: string;
    }>('/api/interview/start', {
      method: 'POST',
      body: JSON.stringify({ coverLetterId }),
    });
  }

  async submitAnswer(data: { sessionId: number; turnNumber: number; audio: Blob }) {
    const formData = new FormData();
    formData.append('sessionId', data.sessionId.toString());
    formData.append('turnNumber', data.turnNumber.toString());
    formData.append('audio', data.audio);

    return this.request<{
      isCompleted: boolean;
      sessionId: number;
      turnNumber?: number;
      questionText?: string;
      questionAudioUrl?: string;
    }>('/api/interview/answer', {
      method: 'POST',
      body: formData,
    });
  }

  async getInterviewResult(sessionId: number) {
    return this.request<{ session: any; turns: any[] }>(
      `/api/interview/result/${sessionId}`
    );
  }

  // History
  async getCoverLetterHistory() {
    return this.request<{
      coverLetters: Array<{
        id: number;
        contentPreview: string;
        createdAt: string;
        updatedAt: string;
        jobPosting: {
          id: number;
          title: string;
          companyName: string;
        } | null;
        feedbackCount: number;
        lastFeedbackDate: string | null;
        status: string;
      }>;
      total: number;
    }>('/api/history/cover-letters');
  }

  async getInterviewHistory() {
    return this.request<{
      interviews: Array<{
        id: number;
        status: string;
        totalQuestions: number;
        answeredQuestions: number;
        startedAt: string;
        completedAt: string | null;
        createdAt: string;
        jobPosting: {
          id: number;
          title: string;
          companyName: string;
        } | null;
        coverLetterId: number | null;
        statusLabel: string;
      }>;
      total: number;
    }>('/api/history/interviews');
  }
}

export const apiClient = new ApiClient();

