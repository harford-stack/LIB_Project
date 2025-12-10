/**
 * ============================================
 * 입력 검증 파일 (validators.js)
 * ============================================
 * 
 * 이 파일은 사용자가 입력한 정보가 올바른지 확인하는 역할을 합니다!
 * 
 * [이 파일이 하는 일]
 * 1. 이메일 형식이 올바른지 확인합니다
 * 2. 전화번호 형식이 올바른지 확인합니다
 * 3. 검증 결과를 처리합니다
 * 
 * [검증이란?]
 * - 사용자가 입력한 정보가 규칙에 맞는지 확인하는 것입니다
 * - 예: 이메일은 "@" 기호가 있어야 합니다
 * - 예: 전화번호는 숫자로만 이루어져야 합니다
 * 
 * [왜 검증하나요?]
 * - 잘못된 정보를 데이터베이스에 저장하는 것을 막기 위해서입니다
 * - 예: "abc"는 이메일이 아닙니다 (올바른 이메일: "abc@example.com")
 * - 예: "123"은 전화번호가 아닙니다 (올바른 전화번호: "010-1234-5678")
 * 
 * [비유로 설명하면]
 * - 이 파일은 학교의 입학 심사관과 같습니다
 * - 학생이 제출한 서류가 올바른지 확인합니다
 * - 서류가 올바르지 않으면 입학을 거부합니다
 */

// express-validator: Express에서 입력 검증을 쉽게 할 수 있게 해주는 도구
const { body, query, validationResult } = require('express-validator');

/**
 * 이메일 형식 검증 (POST 요청용)
 * 
 * 사용자가 입력한 이메일이 올바른 형식인지 확인합니다.
 * 
 * [올바른 이메일 형식]
 * - "@" 기호가 있어야 합니다
 * - "@" 앞에 이름이 있어야 합니다
 * - "@" 뒤에 도메인이 있어야 합니다
 * - 예: "hong@example.com" ✅
 * - 예: "hong" ❌ (올바르지 않음)
 * 
 * @param {string} field - 검증할 필드 이름 (기본값: 'email')
 * @returns {Function} 검증 미들웨어 함수
 */
const validateEmail = (field = 'email') => {
  // body(field): POST 요청의 body에서 해당 필드를 검증합니다
  return body(field)
    .optional()              // 필드가 없어도 됩니다 (선택적)
    .isEmail()              // 이메일 형식인지 확인합니다
    .withMessage('올바른 이메일 형식이 아닙니다.')  // 에러 메시지
    .normalizeEmail();      // 이메일을 정규화합니다 (대소문자 통일 등)
};

/**
 * 전화번호 형식 검증 (POST 요청용)
 * 
 * 사용자가 입력한 전화번호가 올바른 형식인지 확인합니다.
 * 
 * [올바른 전화번호 형식 (한국)]
 * - 010으로 시작해야 합니다
 * - 총 11자리여야 합니다
 * - 예: "010-1234-5678" ✅
 * - 예: "01012345678" ✅ (하이픈 없어도 됨)
 * - 예: "123-456-7890" ❌ (올바르지 않음)
 * 
 * [정규식 설명]
 * /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
 * - ^: 시작
 * - 01[0-9]: 010~019로 시작
 * - -?: 하이픈이 있거나 없거나
 * - [0-9]{3,4}: 숫자 3개 또는 4개
 * - -?: 하이픈이 있거나 없거나
 * - [0-9]{4}: 숫자 4개
 * - $: 끝
 * 
 * @param {string} field - 검증할 필드 이름 (기본값: 'phone')
 * @returns {Function} 검증 미들웨어 함수
 */
const validatePhone = (field = 'phone') => {
  // body(field): POST 요청의 body에서 해당 필드를 검증합니다
  return body(field)
    .optional()              // 필드가 없어도 됩니다 (선택적)
    .matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/)  // 정규식으로 전화번호 형식 확인
    .withMessage('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
};

/**
 * GET 요청용 이메일 검증
 * 
 * GET 요청은 URL의 쿼리 파라미터로 데이터를 받습니다.
 * 예: /api/user?email=hong@example.com
 * 
 * @param {string} field - 검증할 필드 이름 (기본값: 'email')
 * @returns {Function} 검증 미들웨어 함수
 */
const validateEmailQuery = (field = 'email') => {
  // query(field): GET 요청의 query에서 해당 필드를 검증합니다
  return query(field)
    .optional()              // 필드가 없어도 됩니다
    .isEmail()              // 이메일 형식인지 확인합니다
    .withMessage('올바른 이메일 형식이 아닙니다.')
    .normalizeEmail();      // 이메일을 정규화합니다
};

/**
 * GET 요청용 전화번호 검증
 * 
 * GET 요청은 URL의 쿼리 파라미터로 데이터를 받습니다.
 * 예: /api/user?phone=010-1234-5678
 * 
 * @param {string} field - 검증할 필드 이름 (기본값: 'phone')
 * @returns {Function} 검증 미들웨어 함수
 */
const validatePhoneQuery = (field = 'phone') => {
  // query(field): GET 요청의 query에서 해당 필드를 검증합니다
  return query(field)
    .optional()              // 필드가 없어도 됩니다
    .matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/)  // 정규식으로 전화번호 형식 확인
    .withMessage('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
};

/**
 * 검증 결과 처리 미들웨어
 * 
 * 검증 결과를 확인하고, 에러가 있으면 에러 응답을 보냅니다.
 * 
 * [작동 방식]
 * 1. 검증 결과를 가져옵니다
 * 2. 에러가 있으면 (검증 실패)
 *    - 400 상태 코드와 함께 에러 메시지를 보냅니다
 * 3. 에러가 없으면 (검증 성공)
 *    - next()를 호출해서 다음 단계로 넘어갑니다
 * 
 * [사용 예시]
 * app.get('/api/user',
 *   validateEmailQuery('email'),  // 이메일 검증
 *   handleValidationErrors,       // 검증 결과 처리
 *   (req, res) => {               // 검증 통과 후 실행
 *     // 여기서 실제 작업을 수행합니다
 *   }
 * );
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어로 넘어가는 함수
 */
const handleValidationErrors = (req, res, next) => {
  // validationResult(req): 검증 결과를 가져옵니다
  const errors = validationResult(req);
  
  // errors.isEmpty(): 에러가 없으면 true, 있으면 false
  if (!errors.isEmpty()) {
    // 에러가 있으면 400 상태 코드와 함께 에러 메시지를 보냅니다
    return res.status(400).json({
      success: false,
      errors: errors.array()  // 모든 에러 메시지를 배열로 반환
    });
  }
  
  // 에러가 없으면 다음 단계로 넘어갑니다
  next();
};

// 이 파일에서 사용할 수 있도록 함수들을 내보냅니다 (export)
module.exports = {
  validateEmail,           // POST 요청용 이메일 검증
  validatePhone,           // POST 요청용 전화번호 검증
  validateEmailQuery,      // GET 요청용 이메일 검증
  validatePhoneQuery,      // GET 요청용 전화번호 검증
  handleValidationErrors   // 검증 결과 처리 미들웨어
};
