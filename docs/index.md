# AI Interview Service - 문서 목록

## 📚 문서 개요

이 디렉토리에는 프로젝트의 주요 문서들이 포함되어 있습니다.

---

## 🗂️ 문서 목록

### 1. 환경 설정 관련

#### [환경 변수 가이드](./ENVIRONMENT_VARIABLES.md) 🔐
- **대상:** 환경 변수 설정 및 관리가 필요한 개발자
- **내용:** 
  - 필수 환경 변수 목록 (7개)
  - 중복 변수 정리 방법
  - S3_BUCKET_NAME 오타 수정
  - 보안 권장사항
  - 트러블슈팅

#### [S3 Access Denied 해결](./S3_ACCESS_DENIED_FIX.md) ☁️
- **대상:** S3 AccessDenied 에러가 발생한 개발자
- **내용:**
  - IAM 권한 설정 방법
  - 최소 권한 정책 예제
  - 새 IAM 사용자 생성
  - 보안 권장사항

#### [S3 Region 수정](./S3_REGION_FIX.md) 🌍
- **대상:** S3 PermanentRedirect 에러가 발생한 개발자
- **내용:**
  - 버킷 리전 확인 방법
  - 리전 설정 수정
  - Vercel 환경 변수 업데이트

### 2. 마이그레이션 관련

#### [빠른 시작 가이드](./MIGRATION_QUICKSTART.md) ⚡
- **대상:** 빠르게 문제를 해결하고 싶은 개발자
- **내용:** 
  - 5분 안에 마이그레이션 완료
  - 최소한의 명령어로 해결
  - 자주 발생하는 에러 해결

#### [상세 마이그레이션 가이드](./MIGRATION_GUIDELINE.md) 📖
- **대상:** 마이그레이션을 완벽하게 이해하고 싶은 개발자
- **내용:**
  - 단계별 상세 설명
  - 로컬/프로덕션 환경별 가이드
  - 백업 및 롤백 전략
  - 트러블슈팅
  - CI/CD 통합 방법

---

## 📝 기타 프로젝트 문서

### 루트 디렉토리 문서

- **[README.md](../README.md)** - 프로젝트 소개 및 시작 가이드
- **[API.md](../API.md)** - API 엔드포인트 문서
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - 배포 가이드
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - 기여 가이드
- **[LICENSE](../LICENSE)** - 라이선스 정보

---

## 🔍 문서 선택 가이드

**문제가 발생했나요?**
1. 먼저 [빠른 시작 가이드](./MIGRATION_QUICKSTART.md) 확인
2. 해결되지 않으면 [상세 가이드](./MIGRATION_GUIDELINE.md) 참고
3. 여전히 문제가 있다면 Issue 생성

**새로운 기능을 개발하나요?**
1. [API 문서](../API.md)에서 기존 엔드포인트 확인
2. [기여 가이드](../CONTRIBUTING.md) 읽기
3. 개발 시작

**배포를 준비하나요?**
1. [배포 가이드](../DEPLOYMENT.md) 확인
2. [마이그레이션 가이드](./MIGRATION_GUIDELINE.md)의 프로덕션 섹션 읽기
3. 체크리스트 완료

---

## 💡 팁

### 문서 검색
프로젝트 전체에서 특정 내용을 찾고 싶다면:
```bash
# 모든 마크다운 파일에서 검색
grep -r "검색어" *.md docs/*.md

# 특정 주제 찾기
grep -r "migration" *.md docs/*.md
grep -r "API" *.md docs/*.md
```

### 문서 업데이트
문서가 오래되었거나 개선이 필요하다면:
1. Issue를 생성하거나
2. Pull Request를 제출해주세요

---

**최종 업데이트:** 2025-11-18

