/**
 * ============================================
 * 클라이언트 인증 관리 파일 (auth.js)
 * ============================================
 * 
 * 이 파일은 브라우저(클라이언트)에서 로그인 정보를 관리하는 역할을 합니다!
 * 
 * [이 파일이 하는 일]
 * 1. JWT 토큰을 저장하고 가져옵니다
 * 2. 사용자 정보를 저장하고 가져옵니다
 * 3. 로그인 상태를 확인합니다
 * 4. API 요청에 토큰을 자동으로 추가합니다
 * 
 * [sessionStorage란?]
 * - 브라우저에 정보를 저장하는 곳입니다
 * - 브라우저 탭을 닫으면 자동으로 삭제됩니다
 * - 다른 탭과는 공유되지 않습니다
 * - 보안이 중요한 정보(토큰)를 저장하는데 적합합니다
 * 
 * [비유로 설명하면]
 * - 이 파일은 지갑과 같습니다
 * - 로그인 증명서(토큰)를 지갑에 넣어둡니다
 * - 필요할 때마다 지갑에서 꺼내서 사용합니다
 */

// JWT 토큰 저장 및 관리
// 상수: 변하지 않는 값 (대문자로 작성)
const TOKEN_KEY = 'authToken';  // 토큰을 저장할 때 사용하는 키
const USER_KEY = 'userInfo';    // 사용자 정보를 저장할 때 사용하는 키

/**
 * 로그인 정보 저장 함수
 * 
 * 사용자가 로그인에 성공하면 토큰과 사용자 정보를 저장합니다.
 * 
 * [작동 방식]
 * 1. JWT 토큰을 받습니다
 * 2. 사용자 정보를 받습니다
 * 3. sessionStorage에 저장합니다
 * 
 * [예시]
 * saveAuth("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", { USERID: "hong", NAME: "홍길동" })
 * → sessionStorage에 저장됨
 * 
 * @param {string} token - JWT 토큰 (로그인 성공 증명서)
 * @param {Object} user - 사용자 정보 (아이디, 이름 등)
 */
function saveAuth(token, user) {
  // sessionStorage.setItem(키, 값): 정보를 저장합니다
  sessionStorage.setItem(TOKEN_KEY, token);  // 토큰 저장
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));  // 사용자 정보 저장 (JSON 문자열로 변환)
  sessionStorage.setItem('sessionId', user.USERID);  // 사용자 아이디 저장 (기존 코드 호환성)
  sessionStorage.setItem('sessionName', user.NAME);  // 사용자 이름 저장 (기존 코드 호환성)
}

/**
 * 로그인 정보 가져오기 함수
 * 
 * 저장된 토큰과 사용자 정보를 가져옵니다.
 * 
 * [작동 방식]
 * 1. sessionStorage에서 토큰을 가져옵니다
 * 2. sessionStorage에서 사용자 정보를 가져옵니다
 * 3. 둘 다 있으면 객체로 반환합니다
 * 4. 없으면 null을 반환합니다
 * 
 * [예시]
 * getAuth()
 * → { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", user: { USERID: "hong", NAME: "홍길동" } }
 * 또는 null (로그인하지 않았으면)
 * 
 * @returns {Object|null} { token, user } 또는 null
 */
function getAuth() {
  // sessionStorage.getItem(키): 저장된 정보를 가져옵니다
  const token = sessionStorage.getItem(TOKEN_KEY);
  const userStr = sessionStorage.getItem(USER_KEY);
  
  // 토큰이나 사용자 정보가 없으면 null 반환
  if (!token || !userStr) {
    return null;
  }
  
  try {
    // JSON.parse(): JSON 문자열을 객체로 변환합니다
    // 예: '{"USERID":"hong"}' → { USERID: "hong" }
    return {
      token: token,
      user: JSON.parse(userStr)
    };
  } catch (e) {
    // 변환 실패하면 null 반환 (데이터가 손상되었을 수 있음)
    return null;
  }
}

/**
 * 로그아웃 처리 함수
 * 
 * 저장된 모든 로그인 정보를 삭제합니다.
 * 
 * [작동 방식]
 * 1. sessionStorage에서 모든 로그인 관련 정보를 삭제합니다
 * 2. 사용자는 로그아웃 상태가 됩니다
 * 
 * [예시]
 * clearAuth()
 * → sessionStorage에서 모든 정보 삭제됨
 */
function clearAuth() {
  // sessionStorage.removeItem(키): 저장된 정보를 삭제합니다
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem('sessionId');
  sessionStorage.removeItem('sessionName');
}

/**
 * 인증 토큰 가져오기 함수
 * 
 * 저장된 JWT 토큰만 가져옵니다.
 * 
 * [작동 방식]
 * 1. sessionStorage에서 토큰을 가져옵니다
 * 2. 토큰을 반환합니다 (없으면 null)
 * 
 * [예시]
 * getToken()
 * → "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 또는 null
 * 
 * @returns {string|null} JWT 토큰 또는 null
 */
function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * 로그인 여부 확인 함수
 * 
 * 사용자가 로그인했는지 확인합니다.
 * 
 * [작동 방식]
 * 1. 토큰이 있는지 확인합니다
 * 2. 있으면 true (로그인함), 없으면 false (로그인 안 함)
 * 
 * [예시]
 * isAuthenticated()
 * → true (로그인함) 또는 false (로그인 안 함)
 * 
 * @returns {boolean} 로그인 여부
 */
function isAuthenticated() {
  return getToken() !== null;
}

/**
 * API 요청에 토큰 추가 함수
 * 
 * AJAX 요청을 보낼 때 자동으로 토큰을 추가합니다.
 * 
 * [작동 방식]
 * 1. 저장된 토큰을 가져옵니다
 * 2. 토큰이 있으면 요청 헤더에 추가합니다
 * 3. GET 요청이면 쿼리 파라미터에도 추가합니다 (기존 코드 호환성)
 * 
 * [예시]
 * addAuthToRequest({ url: '/api/user', type: 'GET' })
 * → { url: '/api/user', type: 'GET', headers: { Authorization: 'Bearer 토큰' }, data: { token: '토큰' } }
 * 
 * @param {Object} ajaxOptions - jQuery AJAX 옵션
 * @returns {Object} 토큰이 추가된 AJAX 옵션
 */
function addAuthToRequest(ajaxOptions) {
  const token = getToken();
  if (token) {
    // headers 객체가 없으면 만들어줍니다
    if (!ajaxOptions.headers) {
      ajaxOptions.headers = {};
    }
    // Authorization 헤더에 토큰 추가
    // Bearer: 토큰의 종류를 나타내는 접두사
    ajaxOptions.headers['Authorization'] = `Bearer ${token}`;
    
    // GET 요청의 경우 query에도 추가 (기존 코드와의 호환성)
    // 일부 서버는 헤더가 아닌 쿼리 파라미터로 토큰을 받을 수 있습니다
    if (ajaxOptions.type === 'GET' && ajaxOptions.data) {
      ajaxOptions.data.token = token;
    }
  }
  return ajaxOptions;
}

/**
 * 인증이 필요한 페이지로 리다이렉트 함수
 * 
 * 로그인이 필요한 페이지에 로그인하지 않은 사용자가 접근하면
 * 로그인 페이지로 보냅니다.
 * 
 * [작동 방식]
 * 1. 알림을 표시합니다
 * 2. 로그인 페이지로 이동합니다
 * 
 * [예시]
 * redirectToLogin()
 * → "로그인이 필요합니다." 알림 표시 → 로그인 페이지로 이동
 */
function redirectToLogin() {
  alert('로그인이 필요합니다.');
  location.href = 'LIB_Login.html';  // 로그인 페이지로 이동
}

// 브라우저 환경에서 전역 함수로 사용
// window 객체에 함수를 추가하면 HTML 파일에서 직접 사용할 수 있습니다
// 예: <script>window.saveAuth(token, user)</script>
if (typeof window !== 'undefined') {
  window.saveAuth = saveAuth;
  window.getAuth = getAuth;
  window.clearAuth = clearAuth;
  window.getToken = getToken;
  window.isAuthenticated = isAuthenticated;
  window.addAuthToRequest = addAuthToRequest;
  window.redirectToLogin = redirectToLogin;
}
