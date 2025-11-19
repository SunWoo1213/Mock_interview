/**
 * 면접 피드백 구조 마이그레이션 스크립트
 * interview_turns.feedback_text를 TEXT에서 JSONB로 변경
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 환경 변수에서 DATABASE_URL 가져오기
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 또는 POSTGRES_URL 환경 변수가 설정되지 않았습니다.');
  console.error('💡 .env.local 파일을 확인하거나 환경 변수를 설정해주세요.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 면접 피드백 구조 마이그레이션 시작...\n');

    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'update-interview-feedback-structure.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 마이그레이션 SQL:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log();

    // 트랜잭션 시작
    await client.query('BEGIN');
    console.log('✅ 트랜잭션 시작');

    // SQL 실행 (각 문장을 개별적으로 실행)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`\n📝 실행 중 (${i + 1}/${statements.length})...`);
      
      try {
        const result = await client.query(statement);
        
        // 검증 쿼리 결과 출력
        if (statement.toLowerCase().includes('select') && result.rows) {
          console.log('📊 결과:');
          console.table(result.rows);
        } else {
          console.log(`✅ 성공`);
        }
      } catch (error) {
        // 이미 존재하는 인덱스나 타입 변경 등의 무해한 에러는 무시
        if (
          error.message.includes('already exists') ||
          error.message.includes('does not exist')
        ) {
          console.log(`⚠️  경고 (무시됨): ${error.message}`);
        } else {
          throw error;
        }
      }
    }

    // 커밋
    await client.query('COMMIT');
    console.log('\n✅ 트랜잭션 커밋 완료');

    // 최종 검증
    console.log('\n🔍 최종 검증 중...');
    const verifyResult = await client.query(`
      SELECT 
          table_name,
          column_name, 
          data_type,
          is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('interview_turns', 'interview_sessions')
        AND column_name IN ('feedback_text', 'final_feedback_json')
      ORDER BY table_name, ordinal_position;
    `);

    console.log('\n📊 컬럼 정보:');
    console.table(verifyResult.rows);

    // 인덱스 확인
    const indexResult = await client.query(`
      SELECT 
          tablename,
          indexname,
          indexdef
      FROM pg_indexes 
      WHERE tablename IN ('interview_turns', 'interview_sessions')
        AND indexname LIKE '%feedback%'
      ORDER BY tablename, indexname;
    `);

    console.log('\n📊 인덱스 정보:');
    console.table(indexResult.rows);

    console.log('\n🎉 마이그레이션이 성공적으로 완료되었습니다!');
    console.log('\n📌 변경 사항:');
    console.log('   1. interview_turns.feedback_text: TEXT → JSONB');
    console.log('   2. GIN 인덱스 추가 (JSONB 쿼리 성능 향상)');
    console.log('   3. 컬럼 주석 추가 (스키마 문서화)');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 마이그레이션 실패:', error.message);
    console.error('🔄 롤백이 수행되었습니다.');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 실행
runMigration()
  .then(() => {
    console.log('\n✅ 모든 작업 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 오류 발생:', error);
    process.exit(1);
  });

