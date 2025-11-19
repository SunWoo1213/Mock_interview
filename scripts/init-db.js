/**
 * 데이터베이스 초기화 스크립트
 * Vercel Postgres에 테이블을 생성합니다
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  console.log('🚀 데이터베이스 초기화 시작...\n');

  // 환경 변수에서 데이터베이스 URL 가져오기
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ 오류: POSTGRES_URL 또는 DATABASE_URL 환경 변수가 설정되지 않았습니다.');
    console.log('\n다음 중 하나를 실행하세요:');
    console.log('1. vercel env pull .env.local');
    console.log('2. .env 파일에 POSTGRES_URL 추가\n');
    process.exit(1);
  }

  console.log('✅ 데이터베이스 연결 URL 확인됨');

  // PostgreSQL 연결
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // 연결 테스트
    console.log('🔌 데이터베이스 연결 중...');
    const client = await pool.connect();
    console.log('✅ 데이터베이스 연결 성공!\n');

    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, '..', 'database', 'schema.sql');
    console.log('📄 SQL 파일 읽는 중:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // SQL 실행
    console.log('⚙️  SQL 실행 중...\n');
    await client.query(sql);

    console.log('✅ 모든 테이블이 성공적으로 생성되었습니다!');
    console.log('\n생성된 테이블 목록:');
    
    // 생성된 테이블 확인
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });

    console.log('\n🎉 데이터베이스 초기화 완료!');

    client.release();
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('\n상세 오류:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 스크립트 실행
initDatabase();



