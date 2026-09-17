/**
 * 프로필 필드 추가 마이그레이션 실행 스크립트
 * 사용법: node scripts/run-migration.js
 * 
 * 이 스크립트는 user_profiles 테이블에 다음 컬럼을 추가합니다:
 * - current_job (VARCHAR)
 * - career_summary (TEXT)
 * - certifications (TEXT)
 */

// .env 파일 로드
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigration() {
  // 환경 변수 확인
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL 또는 POSTGRES_URL 환경 변수가 설정되지 않았습니다.');
    console.error('💡 .env 파일에 다음 중 하나를 추가해주세요:');
    console.error('   DATABASE_URL=postgresql://user:password@host:5432/database');
    console.error('   또는');
    console.error('   POSTGRES_URL=postgresql://user:password@host:5432/database');
    process.exit(1);
  }

  console.log('🔗 데이터베이스 연결 시도 중...');
  
  // 민감한 정보를 제외한 호스트 정보만 표시
  try {
    const url = new URL(dbUrl);
    console.log('📍 HOST:', url.hostname);
    console.log('📍 DATABASE:', url.pathname.substring(1));
  } catch (e) {
    console.log('📍 DATABASE_URL 확인됨');
  }

  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 마이그레이션 파일 읽기
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add-profile-fields.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 실행할 마이그레이션:');
    console.log('─'.repeat(50));
    console.log(migrationSql);
    console.log('─'.repeat(50));
    console.log();

    // 기존 컬럼 확인
    console.log('🔍 현재 user_profiles 테이블 구조 확인 중...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);

    console.log('현재 컬럼 목록:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    console.log();

    // 마이그레이션 실행
    console.log('🚀 마이그레이션 실행 중...');
    await client.query(migrationSql);
    console.log('✅ 마이그레이션 완료\n');

    // 결과 확인
    console.log('🔍 업데이트된 user_profiles 테이블 구조:');
    const updatedColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);

    updatedColumnsResult.rows.forEach(col => {
      const isNew = ['current_job', 'career_summary', 'certifications'].includes(col.column_name);
      const marker = isNew ? '✨' : '  ';
      console.log(`${marker} ${col.column_name} (${col.data_type})`);
    });
    console.log();

    // 인덱스 확인
    console.log('🔍 인덱스 확인:');
    const indexResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'user_profiles'
        AND indexname = 'idx_user_profiles_current_job'
    `);

    if (indexResult.rows.length > 0) {
      console.log('✅ idx_user_profiles_current_job 인덱스 생성됨');
    } else {
      console.log('⚠️  idx_user_profiles_current_job 인덱스를 찾을 수 없습니다');
    }

    console.log('\n✨ 모든 작업이 성공적으로 완료되었습니다!');
    console.log('💡 이제 애플리케이션을 재시작하거나 재배포하세요.');

  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error.message);
    console.error('\n상세 에러:');
    console.error(error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 데이터베이스에 연결할 수 없습니다. DATABASE_URL을 확인해주세요.');
    } else if (error.code === '42P01') {
      console.error('\n💡 user_profiles 테이블이 존재하지 않습니다.');
      console.error('   먼저 "node scripts/migrate.js"를 실행하여 기본 스키마를 생성하세요.');
    } else if (error.code === '42701') {
      console.error('\n💡 컬럼이 이미 존재합니다. 마이그레이션이 이미 실행되었을 수 있습니다.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
runMigration();

