/**
 * ============================================
 * API 설정 파일 (config.js)
 * ============================================
 * 
 * 이 파일은 서버 API의 주소를 모아둔 곳입니다!
 * 
 * [이 파일이 하는 일]
 * 1. 서버의 기본 주소를 저장합니다
 * 2. 각 API 엔드포인트의 경로를 저장합니다
 * 3. API URL을 쉽게 만들 수 있게 해줍니다
 * 
 * [API란?]
 * - Application Programming Interface
 * - 서버와 클라이언트가 대화하는 방법입니다
 * - 예: 로그인 API, 예약 API 등
 * 
 * [엔드포인트란?]
 * - API의 주소입니다
 * - 예: /lib/login (로그인 API)
 * - 예: /reservation (예약 API)
 * 
 * [비유로 설명하면]
 * - 이 파일은 전화번호부와 같습니다
 * - 각 부서(API)의 전화번호(주소)를 모아둔 곳입니다
 * - 필요할 때 여기서 번호를 찾아서 전화(요청)합니다
 */

// API 서버 설정
// 상수 객체: 변하지 않는 설정 정보
const API_CONFIG = {
  // BASE_URL: 서버의 기본 주소
  // localhost:3009 → 개발 서버 주소
  // 실제 서비스에서는 실제 서버 주소로 변경해야 합니다
  BASE_URL: 'http://localhost:3009',
  
  // ENDPOINTS: 각 API의 경로를 모아둔 객체
  // 예: LOGIN: '/lib/login' → 로그인 API는 /lib/login 경로에 있습니다
  ENDPOINTS: {
    LOGIN: '/lib/login',                    // 로그인 API
    CHECK_ID: '/lib/checkId',               // 아이디 중복 확인 API
    JOIN: '/lib/join',                      // 회원가입 API
    FIND_ID: '/lib/findId',                 // 아이디 찾기 API
    RESET_PWD: '/lib/resetPwd',             // 비밀번호 재설정 API
    USER_INFO: '/lib/userInfo',             // 사용자 정보 조회 API
    UPDATE_USER_INFO: '/lib/updateUserInfo', // 사용자 정보 수정 API
    WITHDRAW: '/lib/withdraw',              // 회원 탈퇴 API
    SEAT_TYPES: '/seattypes',               // 좌석 유형 조회 API
    SEATS: '/seats',                        // 좌석 정보 조회 API
    RESERVATION: '/reservation',            // 좌석 예약 API
    MY_RESERVATIONS: '/myreservations',     // 내 예약 내역 조회 API
    CANCEL_RESERVATION: '/cancel-reservation', // 예약 취소 API
    ACTIVE_RESERVATIONS: '/user/active-reservations' // 활성 예약 확인 API
  }
};

/**
 * API URL 생성 헬퍼 함수
 * 
 * 엔드포인트 경로를 받아서 완전한 API URL을 만들어줍니다.
 * 
 * [작동 방식]
 * 1. 엔드포인트 경로를 받습니다 (예: '/lib/login')
 * 2. BASE_URL과 합칩니다
 * 3. 완전한 URL을 반환합니다 (예: 'http://localhost:3009/lib/login')
 * 
 * [예시]
 * getApiUrl(API_CONFIG.ENDPOINTS.LOGIN)
 * → "http://localhost:3009/lib/login"
 * 
 * getApiUrl('/lib/login')
 * → "http://localhost:3009/lib/login"
 * 
 * @param {string} endpoint - API 엔드포인트 경로 (예: '/lib/login')
 * @returns {string} 완전한 API URL (예: 'http://localhost:3009/lib/login')
 */
function getApiUrl(endpoint) {
  // BASE_URL과 endpoint를 합칩니다
  // 예: 'http://localhost:3009' + '/lib/login' = 'http://localhost:3009/lib/login'
  return API_CONFIG.BASE_URL + endpoint;
}
