# 마이그레이션 빠른 시작 가이드 🚀

## 문제 상황
```
error: column p.current_job does not exist
```
이 에러는 `user_profiles` 테이블에 필요한 컬럼이 없어서 발생합니다.

---

## ⚡ 빠른 해결 방법

### 1️⃣ 로컬 환경에서 테스트

```bash
# 1) 마이그레이션 실행
npm run db:migrate:profile

# 2) 검증
npm run db:verify

# 3) 로컬 서버 실행
npm run dev
```

### 2️⃣ 프로덕션 환경 적용

#### Vercel Postgres 사용 시:

**방법 A: Vercel Dashboard (가장 쉬움)**
1. https://vercel.com/dashboard/stores 접속
2. 해당 Postgres 데이터베이스 선택
3. "Query" 탭 클릭
4. 다음 SQL 복사해서 실행:

```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_job VARCHAR(200),
ADD COLUMN IF NOT EXISTS career_summary TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_current_job 
ON user_profiles(current_job);
```

5. "Run Query" 클릭

**방법 B: 로컬에서 프로덕션 DB에 연결**

```bash
# 1) 프로덕션 DB URL 설정
export POSTGRES_URL="your_production_database_url"

# 2) 마이그레이션 실행
npm run db:migrate:profile

# 3) 검증
npm run db:verify
```

#### 다른 PostgreSQL 호스팅:

```bash
# 1) 데이터베이스 URL 설정
export DATABASE_URL="postgresql://user:pass@host:5432/db"

# 2) 마이그레이션 실행
npm run db:migrate:profile

# 3) 검증
npm run db:verify
```

### 3️⃣ 완료 확인

```bash
# API 테스트
curl https://your-app.vercel.app/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

에러 없이 응답이 오면 성공! ✅

---

## 📋 전체 명령어 요약

```bash
# 마이그레이션 실행
npm run db:migrate:profile

# 마이그레이션 검증
npm run db:verify

# 전체 스키마 재생성 (새 DB용)
npm run db:migrate
```

---

## ❓ 문제 해결

### "relation does not exist" 에러
```bash
# 기본 스키마부터 생성
npm run db:migrate
# 그 다음 프로필 필드 추가
npm run db:migrate:profile
```

### "already exists" 에러
→ 이미 마이그레이션 완료. 검증만 하면 됨:
```bash
npm run db:verify
```

### 여전히 에러 발생
→ 연결 풀 재시작 필요:
```bash
vercel --prod --force
```

---

## 📚 상세 가이드

더 자세한 내용은 다음 문서를 참고하세요:
- [상세 마이그레이션 가이드](MIGRATION_GUIDELINE.md)
- [마이그레이션 가이드](MIGRATION_GUIDE.md)

---

## ✅ 마이그레이션 체크리스트

- [ ] 로컬에서 테스트 완료
- [ ] 프로덕션 DB 백업 완료
- [ ] 프로덕션 마이그레이션 실행
- [ ] 검증 완료
- [ ] 애플리케이션 정상 작동 확인

---

**💡 Tip:** 마이그레이션은 안전합니다. `ADD COLUMN IF NOT EXISTS`를 사용하므로 여러 번 실행해도 문제없습니다.

