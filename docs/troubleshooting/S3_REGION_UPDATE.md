# S3 리전 업데이트 가이드 (ap-southeast-2)

## 🌏 변경 사항

### PermanentRedirect 오류 해결

**문제:**
```
PermanentRedirect: The bucket you are attempting to access must be addressed 
using the specified endpoint: s3-ap-southeast-2.amazonaws.com
```

**원인:**
- S3 클라이언트가 `eu-west-2` (런던)로 설정됨
- 실제 버킷은 `ap-southeast-2` (시드니)에 위치

**해결:**
- 리전을 `ap-southeast-2`로 변경

---

## ✅ 수정된 파일

### 1. `lib/s3.ts`

**변경 전:**
```typescript
// S3 버킷 리전 (에러 메시지에서 확인: eu-west-2)
const BUCKET_REGION = process.env.AWS_REGION || 'eu-west-2';
```

**변경 후:**
```typescript
// S3 버킷 리전 (실제 버킷 위치: ap-southeast-2 시드니)
const BUCKET_REGION = process.env.AWS_REGION || 'ap-southeast-2';
```

### 2. Vercel 환경 변수

**업데이트된 환경:**
- ✅ Production: `AWS_REGION=ap-southeast-2`
- ✅ Preview: `AWS_REGION=ap-southeast-2`
- ✅ Development: `AWS_REGION=ap-southeast-2`

---

## 🚀 배포 단계

### 1. 코드 변경사항 커밋

```bash
git add lib/s3.ts docs/S3_REGION_UPDATE.md
git commit -m "Fix S3 region to ap-southeast-2 (Sydney)"
git push origin main
```

### 2. Vercel 재배포

```bash
vercel --prod --force
```

### 3. 테스트

1. 프로덕션 사이트 접속
2. 로그인
3. PDF 업로드 테스트
4. 오류 로그 확인

---

## 📊 리전 정보

### ap-southeast-2 (Sydney, Australia)

**엔드포인트:**
```
s3-ap-southeast-2.amazonaws.com
s3.ap-southeast-2.amazonaws.com
```

**URL 형식:**
```
https://bucket-name.s3.ap-southeast-2.amazonaws.com/key
```

**특징:**
- 아시아-태평양 지역 서비스
- 한국에서의 레이턴시: ~100-150ms
- 북미에서의 레이턴시: ~200-250ms

---

## 🔍 확인 방법

### AWS Console에서 버킷 리전 확인

1. **S3 Console 접속**: https://s3.console.aws.amazon.com/s3/buckets
2. 버킷 선택 (`your-bucket-name`)
3. **Properties** 탭 확인
4. **AWS Region** 항목 확인

### CLI로 버킷 리전 확인

```bash
aws s3api get-bucket-location --bucket your-bucket-name
```

**출력:**
```json
{
    "LocationConstraint": "ap-southeast-2"
}
```

---

## 🆘 트러블슈팅

### PermanentRedirect 오류가 계속 발생

**원인 1: 환경 변수 미적용**
```bash
# 환경 변수 확인
vercel env ls production | grep AWS_REGION

# 재배포
vercel --prod --force
```

**원인 2: 캐시 문제**
```bash
# 브라우저 캐시 삭제
localStorage.clear();
location.reload();
```

**원인 3: 코드 변경 미반영**
```bash
# Git 상태 확인
git status
git log -1

# 강제 재배포
vercel --prod --force
```

### AccessDenied 오류

**해결:** IAM 사용자에 S3 권한 추가
- **가이드**: [S3_ACCESS_DENIED_FIX.md](S3_ACCESS_DENIED_FIX.md)

---

## 📝 체크리스트

배포 후 확인:

- [x] `lib/s3.ts` 리전 변경 (`ap-southeast-2`)
- [x] Vercel 환경 변수 업데이트 (Production/Preview/Development)
- [ ] Git 커밋 및 푸시
- [ ] Vercel 재배포 (`vercel --prod --force`)
- [ ] 프로덕션 사이트 테스트
- [ ] PDF 업로드 성공 확인
- [ ] 로그에 PermanentRedirect 오류 없는지 확인

---

## 📚 관련 문서

- **[환경 변수 가이드](../guides/ENVIRONMENT_VARIABLES.md)** - 전체 환경 변수 설명
- **[S3 Access Denied 해결](S3_ACCESS_DENIED_FIX.md)** - IAM 권한 설정
- **[이전 리전 수정 문서](S3_REGION_FIX.md)** - eu-west-2 수정 기록

---

**업데이트 날짜:** 2025-11-18  
**변경 사항:** eu-west-2 (London) → ap-southeast-2 (Sydney)  
**버킷 이름:** your-bucket-name






