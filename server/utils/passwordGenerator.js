/**
 * ============================================
 * 임시 비밀번호 생성 파일 (passwordGenerator.js)
 * ============================================
 * 
 * 이 파일은 사용자가 비밀번호를 잊어버렸을 때 임시 비밀번호를 만들어주는 역할을 합니다!
 * 
 * [이 파일이 하는 일]
 * 1. 랜덤한 임시 비밀번호를 생성합니다
 * 2. 임시 비밀번호를 해싱합니다
 * 
 * [임시 비밀번호란?]
 * - 사용자가 비밀번호를 잊어버렸을 때 임시로 사용할 수 있는 비밀번호입니다
 * - 예: "a3b7c9d2e5f1" (랜덤으로 생성됨)
 * - 사용자는 이 비밀번호로 로그인한 후 새 비밀번호로 변경해야 합니다
 * 
 * [비유로 설명하면]
 * - 이 파일은 호텔의 임시 열쇠 제조기와 같습니다
 * - 손님이 열쇠를 잃어버렸을 때 임시 열쇠를 만들어줍니다
 * - 임시 열쇠는 한 번만 사용할 수 있습니다
 */

// passwordHash: 비밀번호 해싱 함수
const { hashPassword } = require('./passwordHash');

/**
 * 임시 비밀번호 생성 함수
 * 
 * 영문 소문자와 숫자 조합으로 8자리 임시 비밀번호를 만듭니다.
 * 
 * [작동 방식]
 * 1. 영문자 1개를 랜덤하게 선택합니다
 * 2. 숫자 1개를 랜덤하게 선택합니다
 * 3. 나머지 6자리를 랜덤하게 생성합니다
 * 4. 모든 문자를 섞습니다
 * 
 * [예시]
 * generateTempPassword()
 * → "a3b7c9d2" (랜덤하게 생성됨, 매번 다름)
 * 
 * @returns {string} 생성된 임시 비밀번호 (8자리)
 */
function generateTempPassword() {
  // 사용할 수 있는 문자들 (영문 소문자 + 숫자)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';

  // 영문자 최소 1개 포함 (보안을 위해)
  // Math.random(): 0과 1 사이의 랜덤한 숫자
  // Math.floor(): 소수점을 버립니다
  // 예: Math.random() * 26 = 0~25.999...
  //     Math.floor(...) = 0~25
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];

  // 숫자 최소 1개 포함 (보안을 위해)
  password += '0123456789'[Math.floor(Math.random() * 10)];

  // 나머지 6자리 랜덤 생성
  // for: 반복문 (6번 반복)
  for (let i = 0; i < 6; i++) {
    // chars 배열에서 랜덤하게 하나를 선택합니다
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // 문자열 섞기 (보안을 강화하기 위해)
  // split(''): 문자열을 배열로 변환합니다 (예: "abc" → ["a", "b", "c"])
  // sort(() => 0.5 - Math.random()): 배열을 랜덤하게 섞습니다
  // join(''): 배열을 문자열로 변환합니다 (예: ["a", "b", "c"] → "abc")
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * 임시 비밀번호를 해싱하여 반환
 * 
 * 평문 임시 비밀번호와 해싱된 임시 비밀번호를 모두 반환합니다.
 * 
 * [작동 방식]
 * 1. 평문 임시 비밀번호를 생성합니다
 * 2. 해싱된 비밀번호를 만듭니다
 * 3. 둘 다 반환합니다
 * 
 * [왜 둘 다 반환하나요?]
 * - 평문 비밀번호: 사용자에게 보여줍니다 (예: "임시 비밀번호는 a3b7c9d2입니다")
 * - 해싱된 비밀번호: 데이터베이스에 저장합니다 (보안)
 * 
 * [예시]
 * generateHashedTempPassword()
 * → {
 *      tempPassword: "a3b7c9d2",           // 사용자에게 보여줄 것
 *      hashedPassword: "$argon2id$v=19$..."  // 데이터베이스에 저장할 것
 *    }
 * 
 * @returns {Promise<Object>} { tempPassword, hashedPassword }
 */
async function generateHashedTempPassword() {
  // 1단계: 평문 임시 비밀번호 생성
  const tempPassword = generateTempPassword();
  
  // 2단계: 해싱된 비밀번호 생성
  const hashedPassword = await hashPassword(tempPassword);
  
  // 3단계: 둘 다 반환
  return { tempPassword, hashedPassword };
}

// 이 파일에서 사용할 수 있도록 함수들을 내보냅니다 (export)
module.exports = {
  generateTempPassword,        // 평문 임시 비밀번호 생성
  generateHashedTempPassword   // 해싱된 임시 비밀번호 생성
};
