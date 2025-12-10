/**
 * 비밀번호 해싱 마이그레이션 스크립트
 * 기존 평문 비밀번호를 argon2 해시로 변환
 */

const db = require('../db');
const { hashPassword } = require('../utils/passwordHash');
const config = require('../config');

async function migratePasswords() {
  console.log('🚀 비밀번호 마이그레이션 시작...\n');

  try {
    // 데이터베이스 연결 풀 초기화
    await db.init();
    console.log('✅ 데이터베이스 연결 완료\n');

    // 모든 사용자 조회
    const query = `SELECT USERID, PASSWORD FROM LIB_USERS`;
    const result = await db.executeQuery(query);
    
    if (result.rows.length === 0) {
      console.log('⚠️  마이그레이션할 사용자가 없습니다.');
      return;
    }

    console.log(`📊 총 ${result.rows.length}명의 사용자 발견\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of result.rows) {
      const userId = user[0];
      const currentPassword = user[1];

      // 이미 해싱된 비밀번호인지 확인 (argon2 해시는 $argon2로 시작)
      if (currentPassword && currentPassword.startsWith('$argon2')) {
        console.log(`⏭️  ${userId}: 이미 해싱된 비밀번호 (건너뜀)`);
        skippedCount++;
        continue;
      }

      // 평문 비밀번호 해싱
      try {
        const hashedPassword = await hashPassword(currentPassword);
        
        // 업데이트
        const updateQuery = `UPDATE LIB_USERS SET PASSWORD = :1 WHERE USERID = :2`;
        await db.executeQuery(
          updateQuery,
          [hashedPassword, userId],
          { autoCommit: true }
        );
        
        console.log(`✅ ${userId}: 비밀번호 해싱 완료`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ ${userId}: 해싱 실패 -`, error.message);
      }
    }

    console.log('\n📈 마이그레이션 결과:');
    console.log(`   - 해싱 완료: ${migratedCount}명`);
    console.log(`   - 건너뜀: ${skippedCount}명`);
    console.log(`   - 총: ${result.rows.length}명\n`);

    console.log('✅ 마이그레이션 완료!');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    // 연결 풀 종료
    await db.closePool();
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  migratePasswords()
    .then(() => {
      console.log('\n🎉 모든 작업이 완료되었습니다.');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n💥 오류 발생:', err);
      process.exit(1);
    });
}

module.exports = { migratePasswords };

