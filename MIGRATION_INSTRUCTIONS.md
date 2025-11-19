# 🚀 즉시 실행: Voice Column 마이그레이션

## ⚠️ 중요: 면접 기능이 작동하지 않는 문제 해결

**에러:** `column "voice" of relation "interview_sessions" does not exist`

**원인:** 데이터베이스에 `voice` 컬럼이 없음

**해결:** 아래 단계를 **순서대로** 진행하세요.

---

## 📋 실행 단계

### 1️⃣ Vercel 자동 배포 대기 (1-2분)

코드가 방금 푸시되었으므로 Vercel이 자동으로 배포합니다.

**확인 방법:**
- Vercel 대시보드 → 프로젝트 → Deployments 탭
- "Building" → "Ready" 상태가 되면 다음 단계로

---

### 2️⃣ 마이그레이션 API 호출

배포가 완료되면 **아래 중 하나의 방법**을 선택하여 마이그레이션을 실행하세요.

#### 방법 A: curl 사용 (터미널)

```bash
curl -X POST https://ai-service2-6.vercel.app/api/admin/migrate-voice-column \
  -H "Content-Type: application/json"
```

#### 방법 B: PowerShell 사용 (Windows)

```powershell
Invoke-WebRequest -Uri "https://ai-service2-6.vercel.app/api/admin/migrate-voice-column" `
  -Method POST `
  -ContentType "application/json"
```

#### 방법 C: 브라우저 개발자 도구 (가장 간단)

1. 사이트 접속: https://ai-service2-6.vercel.app
2. F12 눌러서 개발자 도구 열기
3. Console 탭으로 이동
4. 아래 코드 복사 & 붙여넣기 & Enter:

```javascript
fetch('/api/admin/migrate-voice-column', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(res => res.json())
.then(data => {
  console.log('✅ 마이그레이션 결과:', data);
  if (data.success) {
    alert('✅ 마이그레이션 성공! 이제 면접 기능을 사용할 수 있습니다.');
  } else {
    alert('❌ 마이그레이션 실패: ' + data.error);
  }
})
.catch(err => {
  console.error('❌ 에러:', err);
  alert('❌ 마이그레이션 실패');
});
```

#### 방법 D: Postman / Thunder Client

- Method: `POST`
- URL: `https://ai-service2-6.vercel.app/api/admin/migrate-voice-column`
- Headers: `Content-Type: application/json`
- Body: (비워두기)

---

### 3️⃣ 응답 확인

**성공 시 응답:**
```json
{
  "success": true,
  "message": "Voice column added successfully",
  "updatedRecords": 0,
  "columnDetails": {
    "column_name": "voice",
    "data_type": "character varying",
    "column_default": "'nova'::character varying",
    "is_nullable": "YES"
  }
}
```

**이미 존재하는 경우:**
```json
{
  "success": true,
  "message": "Column 'voice' already exists",
  "alreadyExists": true
}
```

---

### 4️⃣ 면접 기능 테스트

1. 사이트 접속: https://ai-service2-6.vercel.app
2. 로그인
3. "모의 면접" 카드 클릭
4. 자기소개서 선택
5. "면접 시작" 버튼 클릭

**예상 결과:** ✅ 에러 없이 면접 세션이 시작됨

---

### 5️⃣ 마이그레이션 엔드포인트 제거 (선택 사항)

보안을 위해 마이그레이션 완료 후 API 엔드포인트를 삭제할 수 있습니다:

```bash
rm pages/api/admin/migrate-voice-column.ts
git add -A
git commit -m "chore: remove migration endpoint after successful migration"
git push
```

---

## 📊 변경 사항

### Prisma Schema
```prisma
model InterviewSession {
  // ... 기존 필드들
  voice  String?  @default("nova") @map("voice") @db.VarChar(20)  // ✅ 새로 추가됨
  // ... 나머지 필드들
}
```

### 지원되는 목소리
- `alloy` - 중성적
- `echo` - 남성적
- `fable` - 영국식 여성 ⭐ (현재 선택됨)
- `onyx` - 깊은 남성
- `nova` - 활기찬 여성 (기본값)
- `shimmer` - 부드러운 여성

---

## 🐛 문제 해결

### "Method not allowed" 에러
→ POST 요청이 아닙니다. 위의 명령어를 정확히 복사하세요.

### "Cannot connect to database" 에러
→ Vercel 배포가 완료되지 않았습니다. 1-2분 더 기다리세요.

### "Column already exists" 에러
→ 이미 마이그레이션이 완료되었습니다. 바로 면접 테스트로 넘어가세요.

### 마이그레이션 후에도 같은 에러 발생
1. 브라우저 캐시 지우기 (Ctrl + Shift + Delete)
2. Vercel 프로젝트 재배포
3. 5분 정도 기다린 후 다시 시도

---

## 📞 지원

문제가 계속되면:
1. Vercel 로그 확인
2. `docs/ADD_VOICE_COLUMN_MIGRATION.md` 참고
3. GitHub Issues에 에러 메시지 전체 붙여넣기

---

## ✅ 완료 체크리스트

- [ ] Vercel 배포 완료 확인
- [ ] 마이그레이션 API 호출
- [ ] 성공 응답 확인
- [ ] 면접 시작 테스트
- [ ] 에러 없이 작동 확인
- [ ] (선택) 마이그레이션 엔드포인트 삭제

**모두 완료하면 이 파일을 삭제하세요.**

