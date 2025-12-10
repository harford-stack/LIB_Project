/**
 * ============================================
 * 설정 파일 (config.js)
 * ============================================
 * 
 * 이 파일은 우리 서버의 모든 설정을 모아둔 곳입니다!
 * 
 * [이 파일이 하는 일]
 * 1. 데이터베이스 연결 정보를 저장합니다
 * 2. 서버 포트 번호를 저장합니다
 * 3. JWT 토큰 비밀키를 저장합니다
 * 4. 소셜 로그인 설정을 저장합니다
 * 
 * [비유로 설명하면]
 * - 이 파일은 학교의 안내판과 같습니다
 * - "교실은 3층에 있어요", "화장실은 1층에 있어요" 같은 정보를 알려줍니다
 * - 다른 파일들이 이 정보를 참고해서 올바른 곳으로 갈 수 있습니다
 * 
 * [환경 변수란?]
 * - .env 파일에 저장된 비밀 정보들입니다
 * - 예: 데이터베이스 비밀번호, API 키 등
 * - 보안을 위해 코드에 직접 쓰지 않고 파일로 관리합니다
 */

// dotenv: .env 파일에서 환경 변수를 읽어오는 도구
require('dotenv').config();

// 환경 변수 또는 기본값 사용
// process.env.변수명: 환경 변수를 읽어옵니다
// || '기본값': 환경 변수가 없으면 기본값을 사용합니다
module.exports = {
  // 데이터베이스 설정
  db: {
    // 사용자 이름 (데이터베이스에 로그인할 때 사용하는 아이디)
    user: process.env.DB_USER || 'SYSTEM',
    
    // 비밀번호 (데이터베이스에 로그인할 때 사용하는 비밀번호)
    password: process.env.DB_PASSWORD || 'test1234',
    
    // 연결 문자열 (데이터베이스가 어디에 있는지 알려주는 주소)
    // 형식: 호스트:포트/데이터베이스이름
    // 예: localhost:1521/xe → "localhost 컴퓨터의 1521번 포트에 있는 xe 데이터베이스"
    connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/xe',
    
    // 연결 풀 최소 개수 (항상 유지할 연결의 최소 개수)
    // 마치 도서관에서 항상 열어둘 책의 개수와 같습니다
    poolMin: parseInt(process.env.DB_POOL_MIN) || 1,
    
    // 연결 풀 최대 개수 (최대한 만들 수 있는 연결의 개수)
    // 너무 많은 사람이 동시에 접속해도 이 개수만큼만 연결을 만듭니다
    poolMax: parseInt(process.env.DB_POOL_MAX) || 5,
    
    // 연결 풀 증가량 (연결이 부족할 때 몇 개씩 추가로 만들지)
    poolIncrement: parseInt(process.env.DB_POOL_INCREMENT) || 1
  },
  
  // 서버 설정
  server: {
    // 포트 번호 (서버가 요청을 받을 포트)
    // 포트란? 컴퓨터의 문 번호와 같습니다
    // 예: 3009번 문으로 들어오는 요청을 처리합니다
    port: parseInt(process.env.PORT) || 3009,
    
    // 환경 (개발/스테이징/프로덕션)
    // development: 개발 중 (에러 메시지를 자세히 보여줌)
    // production: 실제 서비스 중 (에러 메시지를 간단히 보여줌)
    env: process.env.NODE_ENV || 'development'
  },
  
  // JWT 토큰 설정
  jwt: {
    // 비밀키 (토큰을 암호화할 때 사용하는 열쇠)
    // 이 키가 없으면 토큰을 만들거나 검증할 수 없습니다
    // 실제 서비스에서는 반드시 복잡한 비밀키를 사용해야 합니다!
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    
    // 토큰 만료 시간 (토큰이 언제까지 유효한지)
    // '24h': 24시간 후에 만료됩니다
    // 만료되면 다시 로그인해야 합니다
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // 소셜 로그인 설정 (카카오, 네이버, 구글)
  social: {
    // 카카오 로그인 설정
    kakao: {
      // 클라이언트 ID (카카오 개발자 센터에서 발급받은 아이디)
      clientId: process.env.KAKAO_CLIENT_ID || '',
      
      // 클라이언트 시크릿 (카카오 개발자 센터에서 발급받은 비밀번호)
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      
      // 리다이렉트 URI (카카오 로그인 후 돌아올 주소)
      // 예: http://localhost:8000/auth/kakao/callback
      redirectUri: process.env.KAKAO_REDIRECT_URI || '',
      
      // 카카오 로그인이 활성화되어 있는지 확인
      // clientId와 clientSecret이 모두 있으면 true
      enabled: !!(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET)
    },
    
    // 네이버 로그인 설정
    naver: {
      clientId: process.env.NAVER_CLIENT_ID || '',
      clientSecret: process.env.NAVER_CLIENT_SECRET || '',
      redirectUri: process.env.NAVER_REDIRECT_URI || '',
      enabled: !!(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET)
    },
    
    // 구글 로그인 설정
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    }
  }
};
