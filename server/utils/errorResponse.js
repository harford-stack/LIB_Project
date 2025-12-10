/**
 * ============================================
 * 에러 응답 파일 (errorResponse.js)
 * ============================================
 * 
 * 이 파일은 에러를 예쁘게 처리하고 사용자에게 보여주는 역할을 합니다!
 * 
 * [이 파일이 하는 일]
 * 1. 에러를 구조화된 형식으로 만듭니다
 * 2. 404 에러 (페이지를 찾을 수 없음)를 처리합니다
 * 3. 모든 에러를 일관된 형식으로 응답합니다
 * 
 * [에러 처리란?]
 * - 프로그램에서 문제가 발생했을 때 사용자에게 알려주는 것입니다
 * - 예: 데이터베이스 연결 실패, 잘못된 요청 등
 * - 사용자에게 친화적인 메시지를 보여줍니다
 * 
 * [비유로 설명하면]
 * - 이 파일은 병원의 응급실과 같습니다
 * - 문제가 발생하면 적절한 처리를 합니다
 * - 사용자에게 이해하기 쉬운 설명을 제공합니다
 */

// config: 설정 파일 (환경 정보 등)
const config = require('../config');

/**
 * 커스텀 에러 클래스
 * 
 * 일반 Error 클래스를 확장해서 상태 코드와 에러 코드를 추가했습니다.
 * 
 * [작동 방식]
 * 1. 에러 메시지를 받습니다
 * 2. 상태 코드를 받습니다 (예: 400, 404, 500)
 * 3. 에러 코드를 받습니다 (예: 'NOT_FOUND', 'VALIDATION_ERROR')
 * 4. 에러 객체를 만듭니다
 * 
 * [예시]
 * throw new AppError('사용자를 찾을 수 없습니다', 404, 'NOT_FOUND');
 */
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);  // 부모 클래스(Error)의 생성자 호출
    this.statusCode = statusCode;  // HTTP 상태 코드 (예: 404)
    this.code = code;              // 에러 코드 (예: 'NOT_FOUND')
    this.isOperational = true;      // 이 에러는 예상 가능한 에러입니다
    Error.captureStackTrace(this, this.constructor);  // 스택 트레이스 저장
  }
}

/**
 * 에러 응답 포맷
 * 
 * 에러를 받아서 사용자에게 보낼 형식으로 변환합니다.
 * 
 * [작동 방식]
 * 1. 에러 객체를 받습니다
 * 2. 상태 코드와 메시지를 추출합니다
 * 3. 개발 환경이면 스택 트레이스도 포함합니다
 * 4. JSON 형식으로 응답을 보냅니다
 * 
 * [응답 형식]
 * {
 *   success: false,
 *   error: {
 *     message: "에러 메시지",
 *     code: "에러 코드",
 *     stack: "스택 트레이스" (개발 환경에서만)
 *   }
 * }
 * 
 * @param {Error} error - 에러 객체
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express next 함수
 */
function errorHandler(error, req, res, next) {
  // 에러에서 상태 코드를 가져옵니다 (없으면 500)
  let statusCode = error.statusCode || 500;
  
  // 에러에서 메시지를 가져옵니다 (없으면 기본 메시지)
  let message = error.message || '서버 오류가 발생했습니다.';
  
  // 에러에서 코드를 가져옵니다 (없으면 기본 코드)
  let code = error.code || 'INTERNAL_ERROR';

  // 응답 객체를 만듭니다
  const response = {
    success: false,
    error: {
      message: message,  // 에러 메시지
      code: code         // 에러 코드
    }
  };

  // 개발 환경에서는 스택 트레이스도 포함합니다
  // 스택 트레이스란? 에러가 발생한 위치를 추적하는 정보입니다
  // 프로덕션에서는 보안상 스택 트레이스를 보여주지 않습니다
  if (config.server.env === 'development') {
    response.error.stack = error.stack;
  }

  // 상태 코드와 함께 JSON 응답을 보냅니다
  res.status(statusCode).json(response);
}

/**
 * 404 에러 핸들러
 * 
 * 존재하지 않는 경로로 요청이 왔을 때 실행됩니다.
 * 
 * [작동 방식]
 * 1. 요청 경로를 확인합니다
 * 2. AppError를 만들어서 다음 미들웨어로 전달합니다
 * 3. errorHandler가 이 에러를 처리합니다
 * 
 * [예시]
 * 사용자가 /api/존재하지않는경로 로 요청
 * → 404 에러 발생
 * → "경로를 찾을 수 없습니다: /api/존재하지않는경로" 메시지 반환
 * 
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - Express next 함수
 */
function notFoundHandler(req, res, next) {
  // AppError를 만들어서 다음 미들웨어로 전달합니다
  // req.originalUrl: 원래 요청한 경로
  const error = new AppError(`경로를 찾을 수 없습니다: ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(error);  // errorHandler로 에러를 전달합니다
}

// 이 파일에서 사용할 수 있도록 함수들을 내보냅니다 (export)
module.exports = {
  AppError,           // 커스텀 에러 클래스
  errorHandler,       // 에러 응답 핸들러
  notFoundHandler     // 404 에러 핸들러
};
