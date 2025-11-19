# 환경 변수 정리 요약

## 🔍 발견된 문제

### 1. S3 버킷 이름 오타 ❌

```bash
S3_BuCKET_NAME   # ❌ 오타 (현재 Vercel에 설정됨)
S3_BUCKET_NAME   # ✅ 올바른 철자 (코드에서 사용)
```

**영향:**
- 코드는 `S3_BUCKET_NAME`을 참조하지만 Vercel에는 `S3_BuCKET_NAME`으로 설정됨
- 환경 변수를 찾지 못해 기본값(`ai-interview-bucket`) 사용 중
- 현재는 작동하지만, 버킷 이름 변경 시 문제 발생 가능

---

### 2. 중복 환경 변수 (19개) 🗑️

Vercel Storage integration으로 자동 생성된 `storage_` prefix 변수들:

```bash
# Database URL 중복 (6개)
storage_DATABASE_URL
storage_DATABASE_URL_UNPOOLED
storage_POSTGRES_URL
storage_POSTGRES_URL_NO_SSL
storage_POSTGRES_URL_NON_POOLING
storage_POSTGRES_PRISMA_URL

# PostgreSQL 개별 연결 정보 (9개)
storage_POSTGRES_HOST
storage_POSTGRES_USER
storage_POSTGRES_PASSWORD
storage_POSTGRES_DATABASE
storage_PGHOST
storage_PGHOST_UNPOOLED
storage_PGUSER
storage_PGPASSWORD
storage_PGDATABASE

# Neon/Stack 관련 (4개)
storage_NEON_PROJECT_ID
NEXT_PUBLIC_storage_STACK_PROJECT_ID
NEXT_PUBLIC_storage_STACK_PUBLISHABLE_CLIENT_KEY
storage_STACK_SECRET_SERVER_KEY
```

**문제점:**
- 코드에서 사용하지 않음 (`DATABASE_URL`만 사용)
- 환경 변수 목록이 복잡해짐
- 관리 및 디버깅 어려움

---

## ✅ 필요한 환경 변수 (7개만!)

```bash
DATABASE_URL              # PostgreSQL 연결
AWS_ACCESS_KEY_ID         # S3 인증
AWS_SECRET_ACCESS_KEY     # S3 인증
AWS_REGION                # S3 리전 (eu-west-2)
S3_BUCKET_NAME            # S3 버킷 이름
OPENAI_API_KEY            # GPT-4 API
JWT_SECRET                # JWT 토큰 암호화
```

---

## 🔧 해결 방법

### 자동 스크립트 (권장) ⚡

```powershell
# PowerShell에서 실행
.\fix-env-variables.ps1
```

**스크립트가 수행하는 작업:**
1. ✅ `S3_BUCKET_NAME` 추가 (올바른 철자)
2. ❌ `S3_BuCKET_NAME` 제거 (오타)
3. ❌ `storage_` prefix 변수 19개 제거 (선택)

---

### 수동 정리 (단계별)

#### 1단계: S3_BUCKET_NAME 추가

```bash
echo "ai-interview-bucket" | vercel env add S3_BUCKET_NAME production
echo "ai-interview-bucket" | vercel env add S3_BUCKET_NAME preview
echo "ai-interview-bucket" | vercel env add S3_BUCKET_NAME development
```

#### 2단계: S3_BuCKET_NAME 제거

```bash
vercel env rm S3_BuCKET_NAME production --yes
vercel env rm S3_BuCKET_NAME preview --yes
vercel env rm S3_BuCKET_NAME development --yes
```

#### 3단계: storage_ 변수 제거 (선택)

```bash
# 예시 (19개 모두 반복)
vercel env rm storage_DATABASE_URL production --yes
vercel env rm storage_DATABASE_URL preview --yes
vercel env rm storage_DATABASE_URL development --yes
# ... 나머지 18개 변수도 동일하게
```

#### 4단계: 재배포

```bash
vercel --prod --force
```

---

## 📊 정리 전/후 비교

### 정리 전 (26개)
```
✅ DATABASE_URL
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY
✅ AWS_REGION
❌ S3_BuCKET_NAME (오타)
✅ OPENAI_API_KEY
✅ JWT_SECRET
❌ storage_DATABASE_URL (중복)
❌ storage_DATABASE_URL_UNPOOLED (중복)
❌ storage_POSTGRES_URL (중복)
❌ storage_POSTGRES_URL_NO_SSL (중복)
❌ storage_POSTGRES_URL_NON_POOLING (중복)
❌ storage_POSTGRES_PRISMA_URL (중복)
❌ storage_POSTGRES_HOST (불필요)
❌ storage_POSTGRES_USER (불필요)
❌ storage_POSTGRES_PASSWORD (불필요)
❌ storage_POSTGRES_DATABASE (불필요)
❌ storage_PGHOST (불필요)
❌ storage_PGHOST_UNPOOLED (불필요)
❌ storage_PGUSER (불필요)
❌ storage_PGPASSWORD (불필요)
❌ storage_PGDATABASE (불필요)
❌ storage_NEON_PROJECT_ID (불필요)
❌ NEXT_PUBLIC_storage_STACK_PROJECT_ID (불필요)
❌ NEXT_PUBLIC_storage_STACK_PUBLISHABLE_CLIENT_KEY (불필요)
❌ storage_STACK_SECRET_SERVER_KEY (불필요)
```

### 정리 후 (8개)
```
✅ DATABASE_URL
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY
✅ AWS_REGION
✅ S3_BUCKET_NAME (오타 수정!)
✅ OPENAI_API_KEY
✅ JWT_SECRET
```

**결과:**
- 26개 → 7개 (19개 제거)
- 깔끔하고 관리하기 쉬운 환경 변수
- 코드와 환경 변수 이름 일치

---

## 🎯 우선순위

### 🔴 긴급 (필수)

**S3_BUCKET_NAME 오타 수정**
- 현재는 기본값으로 작동하지만, 향후 문제 발생 가능
- 5분 소요

### 🟡 권장 (선택)

**storage_ 변수 정리**
- 현재 작동에 영향 없음 (사용하지 않으므로)
- 하지만 환경 변수 목록이 깔끔해짐
- 10분 소요

---

## 📋 체크리스트

### 정리 작업

- [ ] `fix-env-variables.ps1` 스크립트 실행
  - [ ] S3_BUCKET_NAME 추가됨
  - [ ] S3_BuCKET_NAME 제거됨
  - [ ] storage_ 변수들 제거됨 (선택)

### 확인 작업

- [ ] `vercel env ls production` 실행
- [ ] 환경 변수 7개만 남았는지 확인
- [ ] `vercel --prod --force` 재배포
- [ ] 프로덕션 사이트 정상 작동 확인
- [ ] PDF 업로드 테스트
- [ ] 로그에 에러 없는지 확인

---

## 📚 관련 문서

- **[환경 변수 가이드](./ENVIRONMENT_VARIABLES.md)** - 상세 설명
- **[S3 Access Denied 해결](./S3_ACCESS_DENIED_FIX.md)** - IAM 권한 설정
- **[S3 Region 수정](./S3_REGION_FIX.md)** - 리전 설정

---

## 🆘 문제 발생 시

### S3 에러가 계속 발생

1. **AccessDenied**: IAM 권한 확인
   - [S3_ACCESS_DENIED_FIX.md](./S3_ACCESS_DENIED_FIX.md) 참고

2. **PermanentRedirect**: 리전 불일치
   - [S3_REGION_FIX.md](./S3_REGION_FIX.md) 참고

### JWT 인증 실패 (401)

- 브라우저 콘솔: `localStorage.clear()`
- 프로덕션에서 재로그인

### 환경 변수가 적용되지 않음

```bash
# 강제 재배포
vercel --prod --force

# 환경 변수 다시 pull
vercel env pull .env.production
```

---

**작성일:** 2025-11-18  
**작성자:** AI Assistant  
**버전:** 1.0





