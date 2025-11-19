# S3 Access Denied 에러 해결 가이드

## 🔴 문제 상황

```
S3 업로드 에러: AccessDenied: Access Denied
HTTP Status Code: 403
```

**원인:** AWS IAM 사용자에게 S3 버킷 접근 권한이 없습니다.

---

## 🔍 문제 진단

### 1. 현재 설정 확인

```powershell
# Vercel 환경 변수 확인
vercel env ls | findstr AWS
```

**확인 사항:**
- ✅ `AWS_ACCESS_KEY_ID` 존재?
- ✅ `AWS_SECRET_ACCESS_KEY` 존재?
- ✅ `AWS_REGION` = `eu-west-2`?
- ✅ `S3_BUCKET_NAME` = `ai-interview-bucket`?

---

## ✅ 해결 방법

### 방법 1: IAM 정책 추가 (권장)

#### Step 1: AWS Console 접속

1. **https://console.aws.amazon.com/iam** 접속
2. **Users** → 현재 사용 중인 IAM 사용자 선택

#### Step 2: 정책 추가

1. **Permissions** 탭 클릭
2. **Add permissions** → **Attach policies directly**
3. 다음 정책 중 하나 선택:

**옵션 A: 전체 S3 접근 (간단)**
- ✅ `AmazonS3FullAccess` (미리 정의된 정책)

**옵션 B: 특정 버킷만 접근 (보안 권장)**
- **Create policy** 클릭
- **JSON** 탭 선택
- 아래 정책 붙여넣기:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::ai-interview-bucket",
                "arn:aws:s3:::ai-interview-bucket/*"
            ]
        }
    ]
}
```

4. **Next** → 정책 이름 입력: `AIServiceS3Policy`
5. **Create policy**
6. 다시 사용자 페이지로 돌아가서 이 정책 연결

#### Step 3: 확인

IAM 사용자에 정책이 연결되었는지 확인

---

### 방법 2: 새 IAM 사용자 생성 (권장)

#### Step 1: 새 IAM 사용자 생성

1. **https://console.aws.amazon.com/iam** 접속
2. **Users** → **Create user**
3. User name: `ai-service-s3-user`
4. **Next**

#### Step 2: 권한 설정

1. **Attach policies directly** 선택
2. `AmazonS3FullAccess` 선택 (또는 위의 커스텀 정책)
3. **Next** → **Create user**

#### Step 3: Access Key 생성

1. 생성된 사용자 클릭
2. **Security credentials** 탭
3. **Create access key**
4. **Use case**: Application running outside AWS
5. **Next** → **Create access key**
6. **⚠️ 중요: Access Key ID와 Secret Access Key를 복사하여 안전하게 보관!**

#### Step 4: Vercel 환경 변수 업데이트

```powershell
# 기존 키 제거
vercel env rm AWS_ACCESS_KEY_ID production
vercel env rm AWS_SECRET_ACCESS_KEY production

# 새 키 추가
vercel env add AWS_ACCESS_KEY_ID
# 프롬프트에 새 Access Key ID 입력

vercel env add AWS_SECRET_ACCESS_KEY
# 프롬프트에 새 Secret Access Key 입력

# 재배포
vercel --prod --force
```

---

### 방법 3: S3 버킷 정책 확인

#### Step 1: S3 버킷 정책 확인

1. **https://console.aws.amazon.com/s3** 접속
2. `ai-interview-bucket` 클릭
3. **Permissions** 탭
4. **Bucket policy** 확인

#### Step 2: 버킷 정책 추가 (필요시)

버킷 정책이 비어있거나 접근을 차단하는 경우:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowIAMUserAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::ai-interview-bucket/*"
        }
    ]
}
```

**주의:** `YOUR_ACCOUNT_ID`와 `YOUR_IAM_USER`를 실제 값으로 변경!

#### Step 3: Block Public Access 확인

1. **Permissions** 탭
2. **Block public access** 확인
3. ✅ 모든 항목이 ON이어야 함 (보안)

---

## 🔍 IAM 사용자 ARN 찾기

### AWS Account ID

1. **https://console.aws.amazon.com/iam** 접속
2. 우측 상단 계정 이름 클릭
3. Account ID 확인

### IAM User Name

1. **IAM** → **Users**
2. 현재 사용 중인 사용자 클릭
3. **Summary** 탭에서 ARN 확인
   ```
   arn:aws:iam::123456789012:user/your-username
   ```

---

## 🧪 테스트

### 1. AWS CLI로 테스트 (선택사항)

```bash
# AWS CLI 설치 확인
aws --version

# S3 접근 테스트
aws s3 ls s3://ai-interview-bucket \
  --region eu-west-2 \
  --profile your-profile

# 파일 업로드 테스트
echo "test" > test.txt
aws s3 cp test.txt s3://ai-interview-bucket/test.txt \
  --region eu-west-2
```

### 2. 애플리케이션에서 테스트

1. Vercel 재배포 후
2. 채용공고 PDF 업로드 시도
3. ✅ 성공 확인

---

## 📋 체크리스트

IAM 사용자 확인:
- [ ] IAM 사용자에게 S3 정책 연결됨
- [ ] Access Key가 활성 상태
- [ ] Access Key가 Vercel에 올바르게 설정됨

S3 버킷 확인:
- [ ] 버킷이 `eu-west-2` 리전에 있음
- [ ] 버킷 정책이 IAM 사용자 접근 허용
- [ ] Block public access 활성화 (보안)

Vercel 환경 변수:
- [ ] `AWS_ACCESS_KEY_ID` 설정
- [ ] `AWS_SECRET_ACCESS_KEY` 설정
- [ ] `AWS_REGION=eu-west-2`
- [ ] `S3_BUCKET_NAME=ai-interview-bucket`
- [ ] 재배포 완료

---

## 🔐 보안 권장사항

### 1. 최소 권한 원칙

IAM 사용자에게 필요한 최소한의 권한만 부여:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::ai-interview-bucket/*"
        }
    ]
}
```

### 2. Access Key 로테이션

정기적으로 Access Key 갱신:
1. 새 Access Key 생성
2. Vercel 환경 변수 업데이트
3. 이전 Access Key 비활성화
4. 테스트 후 이전 Key 삭제

### 3. Secret 보안

- ❌ Git에 절대 커밋 금지
- ❌ 코드에 하드코딩 금지
- ✅ 환경 변수로만 관리
- ✅ `.env` 파일은 `.gitignore`에 추가

---

## 🚨 긴급 해결 (임시)

빠른 테스트를 위해 **임시로** 더 넓은 권한 부여:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::ai-interview-bucket",
                "arn:aws:s3:::ai-interview-bucket/*"
            ]
        }
    ]
}
```

**⚠️ 주의:** 프로덕션에서는 최소 권한 원칙 적용 필요!

---

## 💡 추가 정보

### IAM 정책 종류

1. **관리형 정책 (AWS Managed)**
   - `AmazonS3FullAccess`
   - `AmazonS3ReadOnlyAccess`

2. **고객 관리형 정책 (Customer Managed)**
   - 직접 JSON으로 작성
   - 세밀한 권한 제어

3. **인라인 정책 (Inline)**
   - 특정 사용자/역할에만 직접 연결

### S3 작업 권한

| 작업 | 필요한 권한 |
|------|-----------|
| 파일 업로드 | `s3:PutObject` |
| 파일 다운로드 | `s3:GetObject` |
| 파일 삭제 | `s3:DeleteObject` |
| 목록 조회 | `s3:ListBucket` |

---

## 📞 도움이 필요하면

### AWS Support

- **https://console.aws.amazon.com/support**
- IAM 및 S3 권한 관련 질문

### 문서

- [IAM 정책 예제](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_examples.html)
- [S3 버킷 정책](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)

---

**최종 업데이트:** 2025-11-18  
**해결 방법:** IAM 사용자에 S3 정책 추가 필요



