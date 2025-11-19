/**
 * 데이터베이스 스키마 검증 스크립트
 * 현재 코드에서 요구하는 DB 구조와 실제 DB가 일치하는지 확인
 */
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 또는 POSTGRES_URL 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function verifySchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 데이터베이스 스키마 검증 시작...\n');

    const results = {
      passed: [],
      failed: [],
      warnings: []
    };

    // 1. 테이블 존재 확인
    console.log('📋 1. 필수 테이블 존재 확인');
    const requiredTables = [
      'users',
      'user_profiles',
      'job_postings',
      'cover_letters',
      'cover_letter_feedbacks',
      'interview_sessions',
      'interview_turns'
    ];

    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = ANY($1)
    `, [requiredTables]);

    const existingTables = tablesResult.rows.map(r => r.tablename);
    requiredTables.forEach(table => {
      if (existingTables.includes(table)) {
        results.passed.push(`✅ 테이블 '${table}' 존재`);
      } else {
        results.failed.push(`❌ 테이블 '${table}' 없음`);
      }
    });

    // 2. interview_turns.feedback_text가 JSONB 타입인지 확인
    console.log('\n📋 2. interview_turns.feedback_text 타입 확인');
    const feedbackTextResult = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'interview_turns' 
        AND column_name = 'feedback_text'
    `);

    if (feedbackTextResult.rows.length === 0) {
      results.failed.push('❌ interview_turns.feedback_text 컬럼이 없음');
    } else if (feedbackTextResult.rows[0].data_type === 'jsonb') {
      results.passed.push('✅ interview_turns.feedback_text는 JSONB 타입');
    } else {
      results.failed.push(`❌ interview_turns.feedback_text가 ${feedbackTextResult.rows[0].data_type} 타입 (JSONB여야 함)`);
    }

    // 3. interview_sessions.final_feedback_json이 JSONB 타입인지 확인
    console.log('\n📋 3. interview_sessions.final_feedback_json 타입 확인');
    const finalFeedbackResult = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'interview_sessions' 
        AND column_name = 'final_feedback_json'
    `);

    if (finalFeedbackResult.rows.length === 0) {
      results.failed.push('❌ interview_sessions.final_feedback_json 컬럼이 없음');
    } else if (finalFeedbackResult.rows[0].data_type === 'jsonb') {
      results.passed.push('✅ interview_sessions.final_feedback_json은 JSONB 타입');
    } else {
      results.failed.push(`❌ interview_sessions.final_feedback_json이 ${finalFeedbackResult.rows[0].data_type} 타입 (JSONB여야 함)`);
    }

    // 4. job_postings 테이블의 필수 컬럼 확인
    console.log('\n📋 4. job_postings 테이블 컬럼 확인');
    const jobPostingsColumns = [
      'id', 'user_id', 'title', 'company_name', 
      'original_s3_url', 'extracted_text', 'analysis_json', 
      'status', 'created_at', 'updated_at'
    ];

    const jobPostingsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_postings'
    `);

    const existingColumns = jobPostingsResult.rows.map(r => r.column_name);
    jobPostingsColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        results.passed.push(`✅ job_postings.${col} 존재`);
      } else {
        results.failed.push(`❌ job_postings.${col} 없음`);
      }
    });

    // 5. CASCADE 설정 확인
    console.log('\n📋 5. CASCADE 설정 확인');
    const cascadeResult = await client.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('cover_letters', 'interview_sessions', 'interview_turns', 'cover_letter_feedbacks', 'user_profiles', 'job_postings')
    `);

    const criticalCascades = [
      { table: 'cover_letters', column: 'job_posting_id', should_be: 'CASCADE' },
      { table: 'interview_turns', column: 'session_id', should_be: 'CASCADE' },
      { table: 'cover_letter_feedbacks', column: 'cover_letter_id', should_be: 'CASCADE' },
      { table: 'user_profiles', column: 'user_id', should_be: 'CASCADE' }
    ];

    criticalCascades.forEach(check => {
      const found = cascadeResult.rows.find(
        r => r.table_name === check.table && r.column_name === check.column
      );
      if (found) {
        if (found.delete_rule === check.should_be) {
          results.passed.push(`✅ ${check.table}.${check.column} ON DELETE ${check.should_be}`);
        } else {
          results.failed.push(`❌ ${check.table}.${check.column} ON DELETE ${found.delete_rule} (${check.should_be}여야 함)`);
        }
      } else {
        results.warnings.push(`⚠️  ${check.table}.${check.column} 외래키 없음`);
      }
    });

    // 6. GIN 인덱스 확인
    console.log('\n📋 6. GIN 인덱스 확인');
    const indexResult = await client.query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
        AND indexname LIKE '%feedback%gin%'
    `);

    const requiredIndexes = [
      'idx_interview_turns_feedback_gin',
      'idx_interview_sessions_final_feedback_gin'
    ];

    const existingIndexes = indexResult.rows.map(r => r.indexname);
    requiredIndexes.forEach(idx => {
      if (existingIndexes.includes(idx)) {
        results.passed.push(`✅ GIN 인덱스 '${idx}' 존재`);
      } else {
        results.warnings.push(`⚠️  GIN 인덱스 '${idx}' 없음 (성능 최적화를 위해 추가 권장)`);
      }
    });

    // 7. user_profiles의 텍스트 필드 확인
    console.log('\n📋 7. user_profiles 텍스트 필드 확인');
    const profileFields = ['current_job', 'career_summary', 'certifications'];
    
    const profileResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
        AND column_name = ANY($1)
    `, [profileFields]);

    const existingProfileFields = profileResult.rows.map(r => r.column_name);
    profileFields.forEach(field => {
      if (existingProfileFields.includes(field)) {
        results.passed.push(`✅ user_profiles.${field} 존재`);
      } else {
        results.failed.push(`❌ user_profiles.${field} 없음`);
      }
    });

    // 결과 출력
    console.log('\n' + '='.repeat(60));
    console.log('📊 검증 결과 요약');
    console.log('='.repeat(60));
    
    console.log(`\n✅ 통과: ${results.passed.length}개`);
    console.log(`❌ 실패: ${results.failed.length}개`);
    console.log(`⚠️  경고: ${results.warnings.length}개`);

    if (results.failed.length > 0) {
      console.log('\n❌ 실패 항목:');
      results.failed.forEach(msg => console.log(`  ${msg}`));
    }

    if (results.warnings.length > 0) {
      console.log('\n⚠️  경고 항목:');
      results.warnings.forEach(msg => console.log(`  ${msg}`));
    }

    console.log('\n' + '='.repeat(60));

    if (results.failed.length > 0) {
      console.log('\n🔧 다음 마이그레이션을 실행하세요:');
      console.log('   npm run db:migrate:feedback');
      console.log('   npm run db:migrate:profile');
      return false;
    } else if (results.warnings.length > 0) {
      console.log('\n✅ 필수 항목은 모두 통과했지만 경고 사항이 있습니다.');
      console.log('   성능 최적화를 위해 마이그레이션 실행을 권장합니다.');
      return true;
    } else {
      console.log('\n🎉 모든 검증 통과! DB 스키마가 코드 요구사항과 일치합니다.');
      return true;
    }

  } catch (error) {
    console.error('\n❌ 검증 중 오류 발생:', error.message);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

// 실행
verifySchema()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('오류:', error);
    process.exit(1);
  });

