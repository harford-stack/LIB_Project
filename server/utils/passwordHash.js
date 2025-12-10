/**
 * ============================================
 * 비밀번호 해싱 파일 (passwordHash.js)
 * ============================================
 * 
 * 이 파일은 비밀번호를 안전하게 저장하고 검증하는 역할을 합니다!
 * 
 * [이 파일이 하는 일]
 * 1. 평문 비밀번호를 해싱합니다 (암호화)
 * 2. 해싱된 비밀번호와 평문 비밀번호를 비교합니다
 * 
 * [해싱이란?]
 * - 비밀번호를 암호화해서 저장하는 것입니다
 * - 예: "1234" → "$argon2id$v=19$m=65536,t=3,p=4$..." (긴 문자열)
 * - 한 번 해싱하면 원래 비밀번호로 되돌릴 수 없습니다 (단방향)
 * 
 * [왜 해싱하나요?]
 * - 데이터베이스에 비밀번호를 그대로 저장하면 해커가 훔쳐볼 수 있습니다
 * - 해싱하면 해커가 훔쳐봐도 원래 비밀번호를 알 수 없습니다
 * - 로그인할 때는 해싱된 비밀번호와 입력한 비밀번호를 비교합니다
 * 
 * [비유로 설명하면]
 * - 이 파일은 금고와 같습니다
 * - 비밀번호를 금고에 넣으면 (해싱) 특별한 열쇠 없이는 열 수 없습니다
 * - 로그인할 때는 열쇠(비밀번호)가 맞는지 확인합니다
 * 
 * [Argon2란?]
 * - 최신 비밀번호 해싱 알고리즘입니다
 * - 매우 안전하고 느리게 작동합니다 (해커가 무차별 대입 공격을 하기 어렵게)
 */

// argon2: 비밀번호 해싱 도구
const argon2 = require('argon2');

/**
 * 비밀번호를 해싱하는 함수
 * 
 * 평문 비밀번호를 받아서 해싱된 비밀번호를 반환합니다.
 * 
 * [작동 방식]
 * 1. 평문 비밀번호를 받습니다 (예: "1234")
 * 2. Argon2 알고리즘으로 해싱합니다
 * 3. 해싱된 비밀번호를 반환합니다 (예: "$argon2id$v=19$...")
 * 
 * [예시]
 * hashPassword("1234")
 * → "$argon2id$v=19$m=65536,t=3,p=4$abcdefghijklmnopqrstuvwxyz..."
 * 
 * @param {string} password - 평문 비밀번호 (예: "1234")
 * @returns {Promise<string>} 해싱된 비밀번호 (긴 문자열)
 */
async function hashPassword(password) {
  try {
    // argon2.hash(): 비밀번호를 해싱하는 함수
    // password: 해싱할 비밀번호
    // { type, memoryCost, timeCost, parallelism }: 해싱 옵션
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,  // Argon2id 알고리즘 사용 (가장 안전함)
      memoryCost: 65536,      // 메모리 비용 (64 MB) - 높을수록 안전하지만 느림
      timeCost: 3,            // 시간 비용 (3번 반복) - 높을수록 안전하지만 느림
      parallelism: 4          // 병렬 처리 (4개 스레드) - CPU 코어 수에 맞게 조정
    });
    return hashedPassword;
  } catch (error) {
    // 에러가 발생하면 콘솔에 출력하고 에러를 던집니다
    console.error('Error hashing password:', error);
    throw new Error('비밀번호 해싱 중 오류가 발생했습니다.');
  }
}

/**
 * 비밀번호를 검증하는 함수
 * 
 * 해싱된 비밀번호와 평문 비밀번호를 비교해서 일치하는지 확인합니다.
 * 
 * [작동 방식]
 * 1. 해싱된 비밀번호와 평문 비밀번호를 받습니다
 * 2. 평문 비밀번호를 해싱합니다
 * 3. 두 해싱 결과를 비교합니다
 * 4. 일치하면 true, 일치하지 않으면 false를 반환합니다
 * 
 * [예시]
 * verifyPassword("$argon2id$v=19$...", "1234")
 * → true (비밀번호가 맞으면)
 * 
 * verifyPassword("$argon2id$v=19$...", "5678")
 * → false (비밀번호가 틀리면)
 * 
 * @param {string} hashedPassword - 해싱된 비밀번호 (데이터베이스에 저장된 것)
 * @param {string} plainPassword - 평문 비밀번호 (사용자가 입력한 것)
 * @returns {Promise<boolean>} 비밀번호 일치 여부 (true 또는 false)
 */
async function verifyPassword(hashedPassword, plainPassword) {
  try {
    // argon2.verify(): 비밀번호를 검증하는 함수
    // hashedPassword: 해싱된 비밀번호 (데이터베이스에 저장된 것)
    // plainPassword: 평문 비밀번호 (사용자가 입력한 것)
    // 반환값: 일치하면 true, 일치하지 않으면 false
    return await argon2.verify(hashedPassword, plainPassword);
  } catch (error) {
    // 에러가 발생하면 (예: 해싱된 비밀번호 형식이 잘못됨)
    console.error('Error verifying password:', error);
    return false; // 안전하게 false를 반환합니다
  }
}

// 이 파일에서 사용할 수 있도록 함수들을 내보냅니다 (export)
module.exports = {
  hashPassword,    // 비밀번호 해싱 함수
  verifyPassword   // 비밀번호 검증 함수
};
