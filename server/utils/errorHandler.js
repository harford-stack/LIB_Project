/**
 * 에러 핸들링 유틸리티
 */

/**
 * Oracle DB 에러를 사용자 친화적인 메시지로 변환
 * @param {Error} error - Oracle DB 에러 객체
 * @returns {Object} { message: string, statusCode: number }
 */
function handleDatabaseError(error) {
  // Oracle 에러 코드별 처리
  if (error.errorNum === 1) { // ORA-00001: unique constraint violated
    return {
      message: '이미 사용 중인 데이터입니다.',
      statusCode: 409
    };
  }
  
  if (error.errorNum === 1017) { // ORA-01017: invalid username/password
    return {
      message: '데이터베이스 인증 오류가 발생했습니다.',
      statusCode: 500
    };
  }

  // 기본 에러 메시지
  return {
    message: '데이터베이스 처리 중 오류가 발생했습니다.',
    statusCode: 500
  };
}

/**
 * 일반적인 에러 응답 생성
 * @param {Error} error - 에러 객체
 * @param {string} defaultMessage - 기본 에러 메시지
 * @returns {Object} { message: string, statusCode: number }
 */
function handleError(error, defaultMessage = '서버 오류가 발생했습니다.') {
  if (error.errorNum) {
    return handleDatabaseError(error);
  }

  return {
    message: error.message || defaultMessage,
    statusCode: 500
  };
}

module.exports = {
  handleDatabaseError,
  handleError
};

