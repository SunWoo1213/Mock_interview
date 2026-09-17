# 환경 변수 가이드

## 📋 필수 환경 변수

프로젝트에서 실제로 사용하는 환경 변수는 **7개**입니다:

### 1. Database (PostgreSQL)

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
```

**사용처:**
- `lib/db.ts` - PostgreSQL 연결

**형식:**
```
postgresql://[username]:[password]@[host]:[port]/[database]?sslmode=require
```

---

### 2. AWS S3 (파일 저장소)

```bash
AWS_ACCESS_KEY_ID="AKIA****************"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_REGION="ap-southeast-2"  # Sydney (버킷 실제 위치)
S3_BUCKET_NAME="your-bucket-name"
```

**사용처:**
- `lib/s3.ts` - S3 클라이언트 초기화 및 파일 업로드

**주의사항:**
- ✅ `S3_BUCKET_NAME` (올바른 철자)
- ❌ `S3_BuCKET_NAME` (오타 - 제거 필요)
- 버킷 리전: `ap-southeast-2` (Sydney)
- IAM 권한: `s3:PutObject`, `s3:GetObject` 필요

---

### 3. OpenAI API

```bash
OPENAI_API_KEY="sk-proj-..."
```

**사용처:**
- `lib/openai.ts` - GPT-4 API 호출

---

### 4. JWT 인증

```bash
JWT_SECRET="your-long-random-secret-key"
```

**사용처:**
- `lib/auth.ts` - JWT 토큰 생성 및 검증

**보안:**
- 최소 32자 이상의 랜덤 문자열 사용
- 환경별로 다른 키 사용 권장

---

## ❌ 제거 대상 환경 변수

### 1. S3 버킷 이름 오타

```bash
S3_BuCKET_NAME  # ❌ 제거 (오타)
```

**이유:** 코드에서 `S3_BUCKET_NAME`을 사용하므로 오타 변수는 불필요

---

### 2. storage_ prefix 변수들 (19개)

Vercel Storage integration으로 자동 생성되었지만, **직접 DATABASE_URL을 사용**하므로 불필요:

```bash
# PostgreSQL 중복 URL (6개)
storage_DATABASE_URL                 # ❌ DATABASE_URL 사용
storage_DATABASE_URL_UNPOOLED        # ❌ 불필요
storage_POSTGRES_URL                 # ❌ 불필요
storage_POSTGRES_URL_NO_SSL          # ❌ 불필요
storage_POSTGRES_URL_NON_POOLING     # ❌ 불필요
storage_POSTGRES_PRISMA_URL          # ❌ 불필요

# PostgreSQL 개별 연결 정보 (8개)
storage_POSTGRES_HOST                # ❌ 불필요
storage_POSTGRES_USER                # ❌ 불필요
storage_POSTGRES_PASSWORD            # ❌ 불필요
storage_POSTGRES_DATABASE            # ❌ 불필요
storage_PGHOST                       # ❌ 불필요
storage_PGHOST_UNPOOLED              # ❌ 불필요
storage_PGUSER                       # ❌ 불필요
storage_PGPASSWORD                   # ❌ 불필요
storage_PGDATABASE                   # ❌ 불필요

# Neon/Stack 관련 (5개)
storage_NEON_PROJECT_ID              # ❌ 사용하지 않음
NEXT_PUBLIC_storage_STACK_PROJECT_ID # ❌ 사용하지 않음
NEXT_PUBLIC_storage_STACK_PUBLISHABLE_CLIENT_KEY # ❌ 사용하지 않음
storage_STACK_SECRET_SERVER_KEY      # ❌ 사용하지 않음
```

**이유:**
- `DATABASE_URL` 하나로 모든 DB 연결 처리
- 코드에서 `storage_` prefix 변수들을 사용하지 않음
- 불필요한 변수로 인한 혼란 방지

---

## 🔧 환경 변수 정리 방법

### 자동 스크립트 사용

> ℹ️ 이 스크립트는 일회성 작업 후 레포지토리 정리 과정에서 삭제되었습니다. 아래 내용은 당시 작업 기록입니다.

```powershell
# PowerShell에서 실행
.\fix-env-variables.ps1
```

**스크립트 작업:**
1. ✅ `S3_BUCKET_NAME` 추가 (올바른 철자)
2. ❌ `S3_BuCKET_NAME` 제거 (오타)
3. ❌ `storage_` prefix 변수들 제거 (선택)

---

### 수동으로 정리

#### 1. S3_BUCKET_NAME 추가

```bash
# Production
echo "your-bucket-name" | vercel env add S3_BUCKET_NAME production

# Preview
echo "your-bucket-name" | vercel env add S3_BUCKET_NAME preview

# Development
echo "your-bucket-name" | vercel env add S3_BUCKET_NAME development
```

#### 2. S3_BuCKET_NAME 제거 (오타)

```bash
vercel env rm S3_BuCKET_NAME production --yes
vercel env rm S3_BuCKET_NAME preview --yes
vercel env rm S3_BuCKET_NAME development --yes
```

#### 3. storage_ 변수들 제거 (선택)

```bash
# 예시: storage_DATABASE_URL 제거
vercel env rm storage_DATABASE_URL production --yes
vercel env rm storage_DATABASE_URL preview --yes
vercel env rm storage_DATABASE_URL development --yes

# 나머지 storage_ 변수들도 동일하게 반복
```

---

## ✅ 최종 환경 변수 목록 확인

```bash
vercel env ls production
```

**예상 결과 (7개):**

```
name                    environments
DATABASE_URL            Production, Preview, Development
AWS_ACCESS_KEY_ID       Production, Preview, Development
AWS_SECRET_ACCESS_KEY   Production, Preview, Development
AWS_REGION              Production, Preview, Development
S3_BUCKET_NAME          Production, Preview, Development
OPENAI_API_KEY          Production, Preview, Development
JWT_SECRET              Production, Preview, Development
```

---

## 🚀 재배포

환경 변수 수정 후 반드시 재배포:

```bash
vercel --prod --force
```

---

## 📚 참고 문서

### 코드에서 환경 변수 사용 위치

| 환경 변수 | 파일 | 라인 |
|----------|------|------|
| `DATABASE_URL` | `lib/db.ts` | 11 |
| `AWS_ACCESS_KEY_ID` | `lib/s3.ts` | 15 |
| `AWS_SECRET_ACCESS_KEY` | `lib/s3.ts` | 16 |
| `AWS_REGION` | `lib/s3.ts` | 9 |
| `S3_BUCKET_NAME` | `lib/s3.ts` | 10 |
| `OPENAI_API_KEY` | `lib/openai.ts` | 10 |
| `JWT_SECRET` | `lib/auth.ts` | 8 |

---

## 🔒 보안 권장사항

### 1. JWT_SECRET

```bash
# 강력한 랜덤 키 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. AWS IAM 최소 권한

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

### 3. 환경별 분리

- **Production**: 프로덕션 전용 키
- **Preview**: 테스트 전용 키 (선택)
- **Development**: 로컬 개발 전용 키

---

## 🆘 트러블슈팅

### S3 AccessDenied 에러

**원인:** IAM 사용자에게 S3 권한 없음

**해결:**
1. AWS IAM Console → Users
2. 해당 사용자 선택
3. Permissions → Add permissions
4. `AmazonS3FullAccess` 추가

참고: [docs/S3_ACCESS_DENIED_FIX.md](../troubleshooting/S3_ACCESS_DENIED_FIX.md)

---

### JWT 인증 실패 (401 Unauthorized)

**원인:** 로컬/다른 환경의 토큰 사용

**해결:**
1. 브라우저 콘솔: `localStorage.clear()`
2. 프로덕션 사이트에서 재로그인

---

### S3 PermanentRedirect 에러

**원인:** 버킷 리전 불일치

**해결:**
```bash
# AWS Console에서 버킷 리전 확인 후
vercel env add AWS_REGION production
# ap-southeast-2 입력
```

참고: 
- [S3_REGION_FIX.md](../troubleshooting/S3_REGION_FIX.md) - 이전 리전 수정 기록
- [S3_REGION_UPDATE.md](../troubleshooting/S3_REGION_UPDATE.md) - 최신 리전 업데이트

---

## 📝 체크리스트

정리 후 확인:

- [ ] S3_BUCKET_NAME 추가됨 (올바른 철자)
- [ ] S3_BuCKET_NAME 제거됨 (오타)
- [ ] storage_ 변수들 정리됨 (선택)
- [ ] `vercel env ls`로 최종 확인
- [ ] `vercel --prod --force` 재배포
- [ ] 프로덕션 사이트에서 PDF 업로드 테스트
- [ ] 로그에 에러 없는지 확인

---

**문서 작성일:** 2025-11-18  
**마지막 업데이트:** 2025-11-18

