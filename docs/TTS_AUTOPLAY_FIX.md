# TTS 오디오 자동 재생 문제 해결

## 📋 개요

면접 페이지의 TTS 오디오 자동 재생 문제를 해결하고 브라우저 autoplay policy를 우아하게 처리합니다.

---

## 🐛 문제점

### 1. 디버깅 부족
- 오디오 URL이 제대로 전달되는지 확인 불가
- 재생 실패 원인 파악 어려움

### 2. Autoplay Policy 미처리
- 브라우저 autoplay 정책으로 인한 차단
- 사용자에게 명확한 안내 없음
- 수동 재생 방법 제공 안 됨

### 3. 에러 처리 부족
- 오디오 로드 에러 세부 정보 없음
- 재생 상태 추적 부족

---

## ✨ 해결 방법

### 1. ✅ 디버그 로그 추가

**오디오 URL 검증:**
```tsx
// 초기 로드 시
useEffect(() => {
  console.log('🎵 초기 질문 오디오 URL:', questionAudioUrl);
  if (questionAudioUrl) {
    playQuestionAudio();
  }
}, []);

// URL 변경 시
useEffect(() => {
  console.log('🎵 질문 오디오 URL 변경됨:', questionAudioUrl);
  console.log('📊 현재 상태:', interviewState);
  
  if (interviewState === 'listening' && questionAudioUrl) {
    // URL이 유효한지 확인
    if (questionAudioUrl.trim().length === 0) {
      console.error('❌ 질문 오디오 URL이 비어있습니다!');
      return;
    }
    
    console.log('▶️ 질문 오디오 재생 시도...');
    playQuestionAudio();
  }
}, [questionAudioUrl, interviewState]);
```

**로그 아이콘:**
- 🎵 = 오디오 관련
- ✅ = 성공
- ❌ = 에러
- ⚠️ = 경고
- 📊 = 상태
- ▶️ = 재생
- ⏸️ = 일시정지
- 📥 = 로드

---

### 2. ✅ 강제 재생 (async/await)

**이전:**
```tsx
const playQuestionAudio = () => {
  if (audioRef.current) {
    audioRef.current.load();
    audioRef.current.play().catch((error) => {
      console.error('오디오 재생 실패:', error);
      alert('질문 음성을 재생하려면 화면을 클릭해주세요.');
    });
  }
};
```

**개선 후:**
```tsx
const playQuestionAudio = async () => {
  if (!audioRef.current) {
    console.error('❌ Audio ref가 없습니다!');
    return;
  }

  try {
    console.log('🔄 오디오 로드 중...');
    audioRef.current.load();
    
    console.log('▶️ 오디오 재생 시도 (play() 호출)...');
    await audioRef.current.play();
    
    console.log('✅ 오디오 재생 성공!');
    setAutoplayFailed(false);
  } catch (error: any) {
    console.error('❌ 오디오 자동 재생 실패:', error);
    console.error('에러 이름:', error.name);
    console.error('에러 메시지:', error.message);
    
    // 자동 재생 정책으로 인한 실패
    if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
      console.warn('⚠️ 브라우저 자동 재생 정책으로 인해 차단됨');
      setAutoplayFailed(true);
    } else {
      console.error('⚠️ 기타 오디오 재생 오류');
      setAutoplayFailed(true);
    }
  }
};
```

**개선사항:**
- ✅ `async/await` 사용으로 명확한 흐름
- ✅ 상세한 에러 로깅 (이름, 메시지)
- ✅ 에러 타입별 분기 처리
- ✅ 자동 재생 실패 상태 관리

---

### 3. ✅ Autoplay Policy 처리

**상태 추가:**
```tsx
// 자동 재생 실패 상태
const [autoplayFailed, setAutoplayFailed] = useState(false);
```

**에러 타입별 처리:**
```tsx
// NotAllowedError: 브라우저 자동 재생 정책
// NotSupportedError: 지원하지 않는 포맷
if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
  setAutoplayFailed(true);
}
```

**수동 재생 버튼:**
```tsx
const handleManualPlay = async () => {
  console.log('🖱️ 사용자가 수동 재생 버튼 클릭');
  await playQuestionAudio();
};
```

**조건부 UI 렌더링:**
```tsx
{interviewState === 'listening' && (
  <div className="text-center">
    {autoplayFailed ? (
      // 자동 재생 실패 시 수동 재생 버튼 표시
      <div>
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-600/20 flex items-center justify-center">
            {/* 경고 아이콘 */}
          </div>
          <p className="text-xl text-yellow-400 mb-2">자동 재생이 차단되었습니다</p>
          <p className="text-sm text-gray-400 mb-6">
            브라우저 설정으로 인해 자동 재생이 차단되었습니다.<br />
            버튼을 클릭하여 질문을 들어주세요.
          </p>
        </div>
        <button onClick={handleManualPlay}>
          질문 재생하기
        </button>
      </div>
    ) : (
      // 정상 재생 중
      <div>
        {/* 청취 중 애니메이션 */}
      </div>
    )}
  </div>
)}
```

---

### 4. ✅ 오디오 요소 개선

**이전:**
```tsx
<audio
  ref={audioRef}
  src={questionAudioUrl}
  onEnded={handleQuestionAudioEnded}
  onPlay={() => console.log('질문 오디오 재생 시작')}
  onError={(e) => console.error('오디오 로드 에러:', e)}
  style={{ display: 'none' }}
/>
```

**개선 후:**
```tsx
<audio
  ref={audioRef}
  src={questionAudioUrl}
  onEnded={handleQuestionAudioEnded}
  onPlay={() => {
    console.log('✅ 질문 오디오 재생 시작됨');
    setAutoplayFailed(false);  // 재생 성공 시 플래그 초기화
  }}
  onPause={() => console.log('⏸️ 질문 오디오 일시정지됨')}
  onError={(e) => {
    console.error('❌ 오디오 로드 에러:', e);
    const audio = e.currentTarget;
    console.error('오디오 에러 코드:', audio.error?.code);
    console.error('오디오 에러 메시지:', audio.error?.message);
  }}
  onLoadedData={() => console.log('📥 오디오 데이터 로드 완료')}
  onCanPlay={() => console.log('✅ 오디오 재생 가능 상태')}
  className="hidden"  // Tailwind CSS 클래스로 숨김
/>
```

**개선사항:**
- ✅ 모든 오디오 이벤트에 로그 추가
- ✅ 에러 코드 및 메시지 상세 로깅
- ✅ `className="hidden"` 사용 (Tailwind CSS)
- ✅ 재생 성공 시 `autoplayFailed` 초기화

---

## 🎨 UI 개선

### 자동 재생 실패 화면

```tsx
<div className="text-center">
  {/* 경고 아이콘 */}
  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-600/20 flex items-center justify-center">
    <svg className="w-10 h-10 text-yellow-500">
      {/* 경고 아이콘 SVG */}
    </svg>
  </div>
  
  {/* 메시지 */}
  <p className="text-xl text-yellow-400 mb-2">자동 재생이 차단되었습니다</p>
  <p className="text-sm text-gray-400 mb-6">
    브라우저 설정으로 인해 자동 재생이 차단되었습니다.<br />
    버튼을 클릭하여 질문을 들어주세요.
  </p>
  
  {/* 재생 버튼 */}
  <button
    onClick={handleManualPlay}
    className="px-12 py-4 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors font-bold text-lg shadow-xl flex items-center gap-3 mx-auto"
  >
    <svg className="w-6 h-6">
      {/* 재생 아이콘 */}
    </svg>
    질문 재생하기
  </button>
</div>
```

**디자인 특징:**
- 🟡 노란색 경고 아이콘
- 명확한 안내 메시지
- 큰 재생 버튼 (primary 색상)
- 아이콘 + 텍스트 조합

### 정상 재생 화면

```tsx
<div className="text-center">
  {/* 청취 중 애니메이션 */}
  <div className="inline-block mb-4">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
      <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
      <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
  
  {/* 메시지 */}
  <p className="text-gray-400">질문을 재생 중입니다...</p>
  <p className="text-xs text-gray-500 mt-2">재생이 완료되면 자동으로 녹음이 시작됩니다</p>
</div>
```

---

## 🔍 디버깅 가이드

### 콘솔 로그 예시

**정상 재생:**
```
🎵 초기 질문 오디오 URL: https://bucket.s3.region.amazonaws.com/...mp3
📊 현재 상태: listening
▶️ 질문 오디오 재생 시도...
🔄 오디오 로드 중...
📥 오디오 데이터 로드 완료
✅ 오디오 재생 가능 상태
▶️ 오디오 재생 시도 (play() 호출)...
✅ 질문 오디오 재생 시작됨
✅ 오디오 재생 성공!
```

**자동 재생 차단:**
```
🎵 초기 질문 오디오 URL: https://bucket.s3.region.amazonaws.com/...mp3
📊 현재 상태: listening
▶️ 질문 오디오 재생 시도...
🔄 오디오 로드 중...
▶️ 오디오 재생 시도 (play() 호출)...
❌ 오디오 자동 재생 실패: NotAllowedError: play() failed because the user didn't interact with the document first.
에러 이름: NotAllowedError
에러 메시지: play() failed because the user didn't interact with the document first.
⚠️ 브라우저 자동 재생 정책으로 인해 차단됨
```

**URL 비어있음:**
```
🎵 질문 오디오 URL 변경됨: 
📊 현재 상태: listening
❌ 질문 오디오 URL이 비어있습니다!
```

**오디오 로드 실패:**
```
❌ 오디오 로드 에러: Event
오디오 에러 코드: 4
오디오 에러 메시지: MEDIA_ELEMENT_ERROR: Empty src attribute
```

---

## 📊 에러 코드 참조

### HTMLMediaElement.error.code

| 코드 | 상수 | 의미 |
|------|------|------|
| 1 | `MEDIA_ERR_ABORTED` | 사용자가 다운로드 중단 |
| 2 | `MEDIA_ERR_NETWORK` | 네트워크 오류 |
| 3 | `MEDIA_ERR_DECODE` | 디코딩 오류 |
| 4 | `MEDIA_ERR_SRC_NOT_SUPPORTED` | 지원하지 않는 포맷 또는 URL |

### DOMException.name (play() 실패)

| 이름 | 의미 |
|------|------|
| `NotAllowedError` | 자동 재생 정책으로 차단됨 |
| `NotSupportedError` | 지원하지 않는 포맷 |
| `AbortError` | 재생 중단됨 |

---

## 🧪 테스트 방법

### 1. 정상 재생 테스트

```bash
# Chrome에서 자동 재생 허용 모드로 실행
chrome --autoplay-policy=no-user-gesture-required http://localhost:3000/interview
```

**확인사항:**
- ✅ 질문 오디오가 자동으로 재생됨
- ✅ 청취 중 애니메이션 표시
- ✅ 재생 완료 후 자동으로 녹음 시작

### 2. 자동 재생 차단 테스트

**Chrome 설정:**
```
chrome://settings/content/sound
→ "사이트에서 사운드 재생 허용" 비활성화
```

**확인사항:**
- ✅ 자동 재생 실패 메시지 표시
- ✅ "질문 재생하기" 버튼 표시
- ✅ 버튼 클릭 시 재생 성공

### 3. 잘못된 URL 테스트

**백엔드 수정 (임시):**
```typescript
// pages/api/interview/start.ts
const questionAudioUrl = '';  // 빈 URL
```

**확인사항:**
- ✅ 콘솔에 에러 로그 표시
- ✅ "URL이 비어있습니다" 메시지

### 4. 네트워크 오류 테스트

**DevTools:**
```
Network 탭 → Offline 모드 활성화
```

**확인사항:**
- ✅ 오디오 로드 에러 표시
- ✅ 에러 코드 2 (MEDIA_ERR_NETWORK)

---

## 🌐 브라우저 호환성

### Autoplay Policy

| 브라우저 | Autoplay 정책 | 해결 방법 |
|---------|--------------|----------|
| Chrome 66+ | 제한적 허용 | ✅ 사용자 인터랙션 필요 |
| Firefox 66+ | 제한적 허용 | ✅ 사용자 인터랙션 필요 |
| Safari 11+ | 매우 제한적 | ✅ 사용자 인터랙션 필수 |
| Edge 88+ | 제한적 허용 | ✅ 사용자 인터랙션 필요 |

**자동 재생 조건:**
- 사용자가 페이지와 인터랙션 (클릭, 탭, 키보드 입력)
- 음소거된 오디오/비디오
- 사이트에 대한 사용자 신뢰도 (Media Engagement Index)

---

## 📚 관련 문서

- **[면접 UI 리팩토링](./INTERVIEW_UI_REFACTOR.md)** - 전체 UI 개선 사항
- **[컨텍스트 기반 질문 생성](./INTERVIEW_CONTEXT_AWARE_REFACTOR.md)** - AI 질문 생성 로직
- **[배포 가이드](../DEPLOYMENT.md)** - 프로덕션 배포 방법

---

## 🔧 추가 개선 사항

### 1. 자동 재생 사전 체크

```tsx
// 면접 시작 전에 자동 재생 가능 여부 체크
const checkAutoplaySupport = async () => {
  const audio = new Audio();
  audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  
  try {
    await audio.play();
    console.log('✅ 자동 재생 지원됨');
    return true;
  } catch {
    console.warn('⚠️ 자동 재생 차단됨');
    return false;
  }
};
```

### 2. 로컬 스토리지 저장

```tsx
// 사용자가 수동 재생을 한 번 하면 기록
const handleManualPlay = async () => {
  await playQuestionAudio();
  localStorage.setItem('audioInteractionDone', 'true');
};
```

### 3. 프리로드 최적화

```tsx
<audio
  ref={audioRef}
  src={questionAudioUrl}
  preload="auto"  // 미리 로드
  className="hidden"
/>
```

---

## ✅ 체크리스트

개선 사항 확인:

- [x] questionAudioUrl 디버그 로그 추가
- [x] async/await로 강제 재생
- [x] try-catch 블록으로 에러 처리
- [x] 에러 타입별 분기 (NotAllowedError)
- [x] autoplayFailed 상태 관리
- [x] 수동 재생 버튼 구현
- [x] 조건부 UI 렌더링
- [x] 오디오 요소에 상세 이벤트 핸들러
- [x] className="hidden"으로 숨김
- [x] 재생 성공 시 플래그 초기화

---

**작성일:** 2025-11-18  
**버전:** 2.1 (TTS Autoplay Fixed)  
**작성자:** AI Assistant


