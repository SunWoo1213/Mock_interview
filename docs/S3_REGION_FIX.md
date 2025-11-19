# S3 리전 불일치 문제 해결 가이드

## 🔴 문제 상황

```
PermanentRedirect: The bucket you are attempting to access must be addressed using the specified endpoint.
Endpoint: 'ai-interview-bucket.s3.eu-west-2.amazonaws.com'
```

S3 버킷이 **eu-west-2 (런던)** 리전에 있는데, 코드에서 **ap-northeast-2 (서울)** 리전으로 접근하여 발생한 에러입니다.

---

## ✅ 해결 방법

### 1. 코드 수정 (완료)

`lib/s3.ts` 파일에서 기본 리전을 `eu-west-2`로 변경했습니다:

```typescript
// Before
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  ...
});

// After
const BUCKET_REGION = process.env.AWS_REGION || 'eu-west-2';
const s3Client = new S3Client({
  region: BUCKET_REGION,
  ...
});
```

### 2. Vercel 환경 변수 확인 및 수정

#### 방법 A: Vercel Dashboard

1. **https://vercel.com/dashboard** 접속
2. 프로젝트 선택
3. **Settings → Environment Variables**
4. `AWS_REGION` 찾기
5. 값을 `eu-west-2`로 변경
6. 저장

#### 방법 B: Vercel CLI

```bash
# 현재 값 확인
vercel env ls

# 기존 값 제거
vercel env rm AWS_REGION production

# 새 값 추가
vercel env add AWS_REGION
# 입력: eu-west-2
# 환경: Production

# 재배포
vercel --prod
```

---

## 📊 S3 버킷 리전 확인 방법

### AWS Console에서 확인

1. **https://console.aws.amazon.com/s3** 접속
2. `ai-interview-bucket` 선택
3. **Properties** 탭
4. **AWS Region** 확인

### AWS CLI로 확인

```bash
aws s3api get-bucket-location --bucket ai-interview-bucket
```

출력 예시:
```json
{
    "LocationConstraint": "eu-west-2"
}
```

---

## 🌍 AWS 리전 코드 참고

| 리전 코드 | 리전 이름 | 위치 |
|-----------|----------|------|
| `us-east-1` | US East (N. Virginia) | 미국 버지니아 |
| `us-west-2` | US West (Oregon) | 미국 오레곤 |
| `ap-northeast-2` | Asia Pacific (Seoul) | 한국 서울 |
| `ap-northeast-1` | Asia Pacific (Tokyo) | 일본 도쿄 |
| `eu-west-2` | Europe (London) | 영국 런던 ✅ |
| `eu-central-1` | Europe (Frankfurt) | 독일 프랑크푸르트 |

---

## 🔍 환경별 설정 확인

### 로컬 개발 (.env)

```env
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=ai-interview-bucket
```

### Vercel 프로덕션

```bash
# 환경 변수 확인
vercel env ls

# 출력에서 AWS_REGION 확인
# ✅ AWS_REGION: eu-west-2
```

---

## 🚀 배포 후 확인

### 1. 로그 확인

```bash
vercel logs --prod
```

### 2. 테스트 업로드

채용공고 PDF 업로드 또는 면접 음성 녹음을 테스트합니다.

### 3. 성공 확인

- ✅ "S3 업로드 에러" 없음
- ✅ 파일 URL: `https://ai-interview-bucket.s3.eu-west-2.amazonaws.com/...`

---

## 💡 추가 팁

### 버킷을 다른 리전으로 이동하려면?

S3 버킷은 리전 간 직접 이동이 불가능합니다. 새 버킷을 만들고 데이터를 복사해야 합니다:

```bash
# 1. 새 버킷 생성 (원하는 리전)
aws s3 mb s3://ai-interview-bucket-new --region ap-northeast-2

# 2. 데이터 복사
aws s3 sync s3://ai-interview-bucket s3://ai-interview-bucket-new

# 3. 환경 변수 업데이트
# S3_BUCKET_NAME=ai-interview-bucket-new
# AWS_REGION=ap-northeast-2
```

### 멀티 리전 설정

여러 리전에서 서비스하려면 CloudFront + S3를 사용하는 것이 좋습니다.

---

## 📝 체크리스트

배포 전 확인:
- [ ] `lib/s3.ts`에서 BUCKET_REGION 확인
- [ ] Vercel 환경 변수 `AWS_REGION` 확인
- [ ] S3 버킷의 실제 리전 확인
- [ ] 로컬 `.env` 파일 업데이트
- [ ] 재배포: `vercel --prod`
- [ ] 로그 확인: `vercel logs --prod`
- [ ] 업로드 기능 테스트

---

**최종 업데이트:** 2025-11-18  
**수정 완료:** ✅ 기본 리전 `eu-west-2`로 변경





