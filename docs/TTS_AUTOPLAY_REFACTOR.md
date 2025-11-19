# TTS 자동 재생 리팩터링 가이드

## 📋 개요

면접 질문 음성(TTS)이 자동으로 재생되지 않는 문제를 해결하기 위해 `components/InterviewPage.tsx`를 리팩터링했습니다.

**날짜**: 2025-11-18  
**파일**: `components/InterviewPage.tsx`

---

## 🔧 주요 변경 사항

### 1. **디버그 로깅 강화**

모든 오디오 관련 이벤트에 `[TTS DEBUG]` 태그를 추가하여 문제 진단이 쉽도록 개선했습니다.

```typescript
console.log('🎵 [TTS DEBUG] Current Audio URL:', questionAudioUrl);
console.log('🎵 [TTS DEBUG] URL Type:', typeof questionAudioUrl);
console.log('🎵 [TTS DEBUG] URL Length:', questionAudioUrl?.length);
console.log('📊 [TTS DEBUG] Interview State:', interviewState);
```

**로그에서 확인할 사항:**
- ✅ URL이 유효한 문자열인지
- ✅ URL 길이가 0보다 큰지
- ✅ `interviewState`가 `'listening'`인지

---

### 2. **폴백(Fallback) 상태 추가**

```typescript
// Before: autoplayFailed
// After: showPlayButton
const [showPlayButton, setShowPlayButton] = useState(false);
```

**차이점:**
- **명확한 네이밍**: "Play 버튼을 보여줄 것인가?"라는 의미가 더 명확함
- **초기값**: `false` (자동 재생 시도부터 시작)
- **상태 전환**: 자동 재생 실패 시 `true`로 변경

---

### 3. **견고한 재생 효과 (useEffect 통합)**

**Before:**
- `useEffect` 2개 (중복 로직)
- `useCallback`로 `playQuestionAudio` 분리
- dependency 관리 복잡함

**After:**
- `useEffect` 1개로 통합
- `questionAudioUrl`과 `interviewState`만 의존
- 재생 로직이 effect 내부에 캡슐화됨

```typescript
useEffect(() => {
  // 1. URL 검증
  if (!questionAudioUrl || questionAudioUrl.trim().length === 0) {
    console.warn('⚠️ [TTS DEBUG] 유효하지 않은 오디오 URL');
    return;
  }

  // 2. 상태 검증
  if (interviewState !== 'listening') {
    console.log('⏸️ [TTS DEBUG] Not in listening state, skipping playback');
    return;
  }

  // 3. audioRef 검증
  if (!audioRef.current) {
    console.error('❌ [TTS DEBUG] Audio element ref is null');
    return;
  }

  // 4. 재생 시도 (비동기)
  const attemptPlay = async () => {
    try {
      audioRef.current!.load();
      await audioRef.current!.play();
      setShowPlayButton(false); // 성공 시 버튼 숨김
    } catch (error: any) {
      // 브라우저 자동 재생 정책 차단
      if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
        setShowPlayButton(true); // 수동 버튼 표시
      }
    }
  };

  // 5. 약간의 지연 (DOM 준비 대기)
  const timer = setTimeout(attemptPlay, 100);
  return () => clearTimeout(timer);
}, [questionAudioUrl, interviewState]);
```

**핵심 개선점:**
- ✅ **명확한 검증**: URL, 상태, ref를 단계별로 확인
- ✅ **에러 처리**: `.catch()` 체인 대신 `try-catch`로 명확히
- ✅ **폴백 자동 전환**: 실패 시 자동으로 수동 버튼 표시
- ✅ **타이머 정리**: cleanup function으로 메모리 누수 방지

---

### 4. **UI 구현 (수동 재생 버튼)**

```tsx
{showPlayButton ? (
  // 자동 재생 실패 시 수동 재생 버튼 표시
  <div>
    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-600/20 flex items-center justify-center">
      <svg className="w-10 h-10 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        {/* Warning Icon */}
      </svg>
    </div>
    <p className="text-xl text-yellow-400 mb-2">🔊 질문 듣기</p>
    <p className="text-sm text-gray-400 mb-6">
      브라우저 설정으로 인해 자동 재생이 차단되었습니다.<br />
      아래 버튼을 클릭하여 질문을 들어주세요.
    </p>
    <button
      onClick={handleManualPlay}
      className="px-12 py-4 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-bold text-lg shadow-xl flex items-center gap-3 mx-auto"
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        {/* Play Icon */}
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
```

**UX 개선:**
- ✅ 노란색 경고 아이콘으로 주의 환기
- ✅ "🔊 질문 듣기" 이모지로 직관적인 안내
- ✅ 큰 버튼으로 클릭 유도
- ✅ 재생 중에는 애니메이션으로 진행 상태 표시

---

### 5. **볼륨 체크 및 속성 추가**

```tsx
<audio
  ref={audioRef}
  src={questionAudioUrl}
  playsInline        // ✅ 모바일에서 전체화면 방지
  muted={false}      // ✅ 음소거 안 됨 (볼륨 체크)
  preload="auto"     // ✅ 미리 로드하여 재생 지연 최소화
  onEnded={...}
  onPlay={...}
  onError={...}
  // ... 다양한 이벤트 핸들러
  className="hidden" // ✅ UI에서 숨김 처리
/>
```

**핵심 속성:**
- ✅ **`playsInline`**: iOS에서 전체화면 모드 방지
- ✅ **`muted={false}`**: 명시적으로 음소거 해제
- ✅ **`preload="auto"`**: 미리 로드하여 재생 준비 완료

**추가된 이벤트 핸들러:**
```typescript
onLoadStart={() => console.log('🔄 [TTS DEBUG] Audio load started')}
onSuspend={() => console.log('⏸️ [TTS DEBUG] Audio load suspended')}
onStalled(() => console.log('⚠️ [TTS DEBUG] Audio load stalled')}
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 정상 자동 재생

1. 면접 시작
2. 콘솔 확인:
   ```
   🎵 [TTS DEBUG] Current Audio URL: https://...
   🔄 [TTS DEBUG] Loading audio...
   ▶️ [TTS DEBUG] Attempting to play audio...
   ✅ [TTS DEBUG] Audio playback successful!
   ✅ [TTS DEBUG] Audio started playing
   ```
3. 질문 자동 재생
4. 재생 완료 후 자동으로 녹음 시작

### 시나리오 2: 자동 재생 차단 (폴백)

1. 면접 시작 (브라우저 자동 재생 정책)
2. 콘솔 확인:
   ```
   🎵 [TTS DEBUG] Current Audio URL: https://...
   🔄 [TTS DEBUG] Loading audio...
   ▶️ [TTS DEBUG] Attempting to play audio...
   ❌ [TTS DEBUG] Audio playback failed: NotAllowedError
   ⚠️ [TTS DEBUG] Blocked by browser autoplay policy
   ```
3. "🔊 질문 듣기" 버튼 표시
4. 사용자가 버튼 클릭:
   ```
   🖱️ [TTS DEBUG] User clicked manual play button
   ▶️ [TTS DEBUG] Manual play attempt...
   ✅ [TTS DEBUG] Manual play successful!
   ```
5. 질문 재생 및 녹음 시작

### 시나리오 3: 네트워크 오류

1. 면접 시작 (잘못된 URL 또는 S3 접근 불가)
2. 콘솔 확인:
   ```
   🎵 [TTS DEBUG] Current Audio URL: https://...
   🔄 [TTS DEBUG] Audio load started
   ❌ [TTS DEBUG] Audio load error: Event
   [TTS DEBUG] Error code: 4
   [TTS DEBUG] Error message: MEDIA_ELEMENT_ERROR
   [TTS DEBUG] Audio src: https://...
   ```
3. "🔊 질문 듣기" 버튼 표시
4. 사용자가 버튼 클릭 (재시도)

---

## 🔍 디버깅 가이드

### 문제: URL이 비어있음

**콘솔 로그:**
```
⚠️ [TTS DEBUG] 유효하지 않은 오디오 URL
```

**해결:**
- 백엔드 API 응답 확인 (`/api/interview/start` 또는 `/api/interview/answer`)
- `questionAudioUrl` 필드가 제대로 전달되는지 확인
- S3 URL 생성 로직 확인 (`lib/s3.ts`)

### 문제: 자동 재생 차단

**콘솔 로그:**
```
❌ [TTS DEBUG] Audio playback failed: NotAllowedError
⚠️ [TTS DEBUG] Blocked by browser autoplay policy
```

**원인:**
- 브라우저의 자동 재생 정책 (사용자 인터랙션 없이 재생 시도)
- Chrome, Safari, Firefox 모두 기본적으로 차단

**해결:**
- ✅ 이미 구현됨: 폴백 버튼 자동 표시
- 사용자가 버튼을 클릭하면 정상 재생

**브라우저별 정책:**
- **Chrome**: 사용자가 페이지와 인터랙션한 후 허용
- **Safari**: 더 엄격 (자동 재생 거의 차단)
- **Firefox**: 사용자 설정에 따라 다름

### 문제: Audio ref가 null

**콘솔 로그:**
```
❌ [TTS DEBUG] Audio element ref is null
```

**원인:**
- 컴포넌트가 아직 마운트되지 않음
- `<audio>` 태그가 조건부 렌더링으로 제거됨

**해결:**
- 현재 코드: `<audio>` 태그는 항상 렌더링됨 (숨김 처리만)
- `useEffect` 내부에서 null 체크 수행

### 문제: 오디오 로드 실패 (네트워크)

**콘솔 로그:**
```
❌ [TTS DEBUG] Audio load error: Event
[TTS DEBUG] Error code: 4
[TTS DEBUG] Error message: MEDIA_ELEMENT_ERROR
```

**원인:**
- S3 URL이 잘못됨
- S3 버킷 권한 문제
- CORS 설정 누락
- 파일이 실제로 존재하지 않음

**해결:**
1. S3 URL 직접 접속하여 파일 존재 확인
2. S3 버킷 CORS 설정 확인:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
3. TTS 생성 로직 확인 (`lib/openai.ts` - `generateQuestionAudio`)

---

## 📊 브라우저 호환성

| 브라우저 | 자동 재생 | `playsInline` | 폴백 버튼 |
|---------|----------|--------------|----------|
| Chrome  | ⚠️ 제한적 | ✅ 지원      | ✅ 필요   |
| Safari  | ❌ 거의 차단 | ✅ 지원    | ✅ 필수   |
| Firefox | ⚠️ 제한적 | ✅ 지원      | ✅ 필요   |
| Edge    | ⚠️ 제한적 | ✅ 지원      | ✅ 필요   |

**권장 사항:**
- 모든 브라우저에서 폴백 버튼이 필수
- 사용자에게 "버튼을 클릭하여 시작" 안내 필요

---

## 🚀 배포 체크리스트

- [x] 디버그 로깅 추가
- [x] `showPlayButton` 상태 구현
- [x] `useEffect` 통합 및 견고한 재생 로직
- [x] 수동 재생 버튼 UI 구현
- [x] 오디오 태그 속성 추가 (`playsInline`, `muted={false}`, `preload`)
- [x] 다양한 이벤트 핸들러 추가
- [ ] 로컬 테스트 (자동 재생 / 차단 시나리오)
- [ ] 모바일 테스트 (iOS Safari, Android Chrome)
- [ ] 프로덕션 배포

---

## 💡 추가 개선 사항 (향후)

### 1. 사용자 환경 감지

```typescript
// 모바일 여부 감지
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// 자동 재생 지원 여부 감지
const canAutoplay = await audioRef.current.play()
  .then(() => true)
  .catch(() => false);
```

### 2. 재생 전 안내 모달

```tsx
// 면접 시작 전
<Modal>
  <p>면접이 시작되면 질문이 자동으로 재생됩니다.</p>
  <p>소리를 켜고 조용한 환경에서 진행해주세요.</p>
  <button>시작하기</button>
</Modal>
```

### 3. 오디오 캐싱

```typescript
// Service Worker로 오디오 캐싱
// 다음 질문 미리 로드
```

---

## 📚 관련 문서

- **[면접 UI 리팩터링](./INTERVIEW_UI_REFACTOR.md)** - 전체 면접 페이지 개선
- **[면접 조기 종료](./INTERVIEW_EARLY_FINISH.md)** - 조기 종료 기능
- **[OpenAI TTS](./INTERVIEW_CONTEXT_AWARE_REFACTOR.md)** - TTS 생성 로직

---

**작성일:** 2025-11-18  
**버전:** 2.0  
**작성자:** AI Assistant


