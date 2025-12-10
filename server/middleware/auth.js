/**
 * ============================================
 * 인증 미들웨어 파일 (auth.js)
 * ============================================
 * 
 * 이 파일은 사용자가 로그인했는지 확인하는 문지기 역할을 합니다!
 * 
 * [이 파일이 하는 일]
 * 1. JWT 토큰을 만듭니다 (로그인 성공 증명서)
 * 2. JWT 토큰을 검증합니다 (증명서가 진짜인지 확인)
 * 3. 로그인하지 않은 사용자를 막습니다
 * 
 * [JWT 토큰이란?]
 * - JWT = JSON Web Token
 * - 사용자가 로그인했다는 증명서입니다
 * - 마치 영화관 입장권과 같습니다
 * - 입장권을 보여주면 영화를 볼 수 있습니다
 * - 토큰을 보여주면 로그인한 사용자로 인정받습니다
 * 
 * [비유로 설명하면]
 * - 이 파일은 학교의 경비실과 같습니다
 * - 학생증(토큰)을 보여주면 학교에 들어갈 수 있습니다
 * - 학생증이 없으면 학교에 들어갈 수 없습니다
 */

// jsonwebtoken: JWT 토큰을 만들고 검증하는 도구
const jwt = require('jsonwebtoken');
// config: 설정 파일 (토큰 비밀키 등)
const config = require('../config');

/**
 * JWT 토큰 생성 함수
 * 
 * 사용자가 로그인에 성공하면 이 함수로 토큰을 만듭니다.
 * 
 * [작동 방식]
 * 1. 사용자 정보(아이디, 이름 등)를 받습니다
 * 2. 비밀키로 암호화합니다
 * 3. 토큰을 만듭니다
 * 4. 토큰을 반환합니다
 * 
 * [예시]
 * generateToken({ userId: "hong", name: "홍길동" })
 * → "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (긴 문자열)
 * 
 * @param {Object} payload - 토큰에 포함할 데이터
 *                          예: { userId: "hong", name: "홍길동" }
 * @returns {string} JWT 토큰 (긴 문자열)
 */
function generateToken(payload) {
  // jwt.sign(): 토큰을 만드는 함수
  // payload: 토큰에 넣을 정보 (사용자 아이디, 이름 등)
  // config.jwt.secret: 토큰을 암호화할 때 사용하는 비밀키
  // expiresIn: 토큰이 언제까지 유효한지 (예: "24h" = 24시간)
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
}

/**
 * JWT 토큰 검증 미들웨어
 * 
 * 사용자가 요청을 보낼 때 토큰이 있는지, 그리고 진짜인지 확인합니다.
 * 
 * [작동 방식]
 * 1. 요청에서 토큰을 찾습니다 (헤더 또는 쿼리 파라미터에서)
 * 2. 토큰이 없으면 에러를 보냅니다
 * 3. 토큰이 있으면 검증합니다
 * 4. 검증 성공하면 다음 단계로 넘어갑니다
 * 5. 검증 실패하면 에러를 보냅니다
 * 
 * [미들웨어란?]
 * - 요청과 응답 사이에서 실행되는 함수입니다
 * - 마치 체크포인트와 같습니다
 * - 모든 요청이 이 체크포인트를 통과해야 합니다
 * 
 * [사용 예시]
 * app.get('/protected', authenticateToken, (req, res) => {
 *   // 이 코드는 로그인한 사용자만 실행할 수 있습니다
 * });
 * 
 * @param {Object} req - Express 요청 객체 (사용자가 보낸 요청)
 * @param {Object} res - Express 응답 객체 (사용자에게 보낼 응답)
 * @param {Function} next - 다음 미들웨어로 넘어가는 함수
 */
function authenticateToken(req, res, next) {
  // GET 요청의 경우 query에서, POST 요청의 경우 header에서 토큰 추출
  
  // Authorization 헤더에서 토큰 가져오기
  // Authorization 헤더 형식: "Bearer 토큰"
  // 예: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  const authHeader = req.headers['authorization'];
  
  // "Bearer 토큰" 형식에서 "토큰" 부분만 추출
  // split(' '): 공백으로 나눕니다 → ["Bearer", "토큰"]
  // [1]: 두 번째 요소 (토큰)를 가져옵니다
  const token = authHeader && authHeader.split(' ')[1];
  
  // GET 요청의 경우 query에서도 확인
  // 예: /api/user?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  const queryToken = req.query.token;

  // 헤더에 토큰이 있으면 그것을 사용하고, 없으면 쿼리에서 가져온 토큰을 사용
  const authToken = token || queryToken;

  // 토큰이 없으면 에러를 보냅니다
  if (!authToken) {
    console.error('인증 토큰이 없습니다. Authorization 헤더:', req.headers['authorization'], 'Query token:', queryToken);
    return res.status(401).json({ 
      success: false, 
      error: '인증 토큰이 필요합니다.' 
    });
  }

  // 토큰 검증
  // jwt.verify(): 토큰이 진짜인지 확인하는 함수
  // authToken: 검증할 토큰
  // config.jwt.secret: 토큰을 만들 때 사용한 비밀키
  // (err, user): 검증 결과
  //   - err: 에러가 발생하면 에러 객체
  //   - user: 검증 성공하면 토큰에 들어있던 정보 (payload)
  jwt.verify(authToken, config.jwt.secret, (err, user) => {
    // 에러가 발생하면 (토큰이 가짜이거나 만료되었으면)
    if (err) {
      console.error('토큰 검증 실패:', err.message);
      return res.status(403).json({ 
        success: false, 
        error: '유효하지 않은 토큰입니다.' 
      });
    }
    
    // 검증 성공!
    console.log('토큰 검증 성공, 사용자:', user);
    
    // req.user에 사용자 정보를 저장합니다
    // 이제 다른 곳에서 req.user로 사용자 정보를 사용할 수 있습니다
    req.user = user;
    
    // next(): 다음 미들웨어나 라우트 핸들러로 넘어갑니다
    // 이 함수를 호출하지 않으면 요청이 멈춥니다
    next();
  });
}

/**
 * 선택적 인증 미들웨어 (토큰이 있으면 검증, 없으면 통과)
 * 
 * 이 함수는 authenticateToken과 비슷하지만, 토큰이 없어도 통과시킵니다.
 * 
 * [언제 사용하나요?]
 * - 로그인한 사용자와 로그인하지 않은 사용자 모두 접근할 수 있는 페이지
 * - 예: 게시판 목록 (로그인 안 해도 볼 수 있지만, 로그인하면 추가 기능 사용 가능)
 * 
 * [작동 방식]
 * 1. 토큰이 없으면 그냥 통과시킵니다
 * 2. 토큰이 있으면 검증합니다
 * 3. 검증 성공하면 req.user에 사용자 정보를 저장합니다
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어로 넘어가는 함수
 */
function optionalAuth(req, res, next) {
  // 토큰 가져오기 (authenticateToken과 동일)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const queryToken = req.query.token;
  const authToken = token || queryToken;

  // 토큰이 없으면 그냥 통과시킵니다 (에러를 보내지 않음)
  if (!authToken) {
    return next();
  }

  // 토큰이 있으면 검증합니다
  jwt.verify(authToken, config.jwt.secret, (err, user) => {
    // 에러가 없으면 (검증 성공하면) 사용자 정보를 저장합니다
    if (!err) {
      req.user = user;
    }
    // 에러가 있어도 통과시킵니다 (토큰이 유효하지 않아도 페이지는 볼 수 있음)
    next();
  });
}

// 이 파일에서 사용할 수 있도록 함수들을 내보냅니다 (export)
module.exports = {
  generateToken,        // 토큰 생성 함수
  authenticateToken,    // 토큰 검증 미들웨어 (필수)
  optionalAuth          // 선택적 토큰 검증 미들웨어
};
