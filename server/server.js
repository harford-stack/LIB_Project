/**
 * ============================================
 * 메인 서버 파일 (server.js)
 * ============================================
 * 
 * 이 파일은 우리 웹사이트의 심장과 같은 역할을 합니다!
 * 
 * [이 파일이 하는 일]
 * 1. 웹 서버를 시작합니다 (컴퓨터가 인터넷에서 요청을 받을 수 있게 해줍니다)
 * 2. 사용자가 로그인하거나 예약하는 등의 요청을 처리합니다
 * 3. 데이터베이스에서 정보를 가져오거나 저장합니다
 * 
 * [비유로 설명하면]
 * - 이 파일은 식당의 주방장과 웨이터를 모두 하는 역할입니다
 * - 손님(사용자)의 주문(요청)을 받아서
 * - 주방(데이터베이스)에서 음식을 만들고(정보를 가져오고)
 * - 손님에게 서빙(응답)합니다
 */

// 필요한 도구들을 가져옵니다 (import)
// express: 웹 서버를 만드는 도구 (레고 블록처럼 서버를 조립할 수 있게 해줍니다)
const express = require('express');
// cors: 다른 웹사이트에서 우리 서버에 접근할 수 있게 해주는 도구
const cors = require('cors');
// path: 파일 경로를 다루는 도구
const path = require('path');
// db: 데이터베이스와 대화하는 도구 (우리 서버가 데이터베이스와 말할 수 있게 해줍니다)
const db = require('./db');
// config: 설정 파일 (데이터베이스 주소, 비밀번호 등을 저장한 곳)
const config = require('./config');
// dbHelper: 데이터베이스 결과를 쉽게 사용할 수 있게 바꿔주는 도우미
const { convertRowsToJson, convertSingleRowToJson } = require('./utils/dbHelper');
// errorHandler: 에러를 예쁘게 처리해주는 도우미
const { handleError } = require('./utils/errorHandler');
// passwordGenerator: 임시 비밀번호를 만들어주는 도우미
const { generateHashedTempPassword } = require('./utils/passwordGenerator');
// passwordHash: 비밀번호를 암호화하고 검증하는 도우미
const { hashPassword, verifyPassword } = require('./utils/passwordHash');
// auth: 사용자가 로그인했는지 확인하는 도우미
const { generateToken, authenticateToken } = require('./middleware/auth');
// validators: 사용자가 입력한 정보가 올바른지 확인하는 도우미
const { validateEmailQuery, validatePhoneQuery, handleValidationErrors } = require('./utils/validators');

// Express 앱을 만듭니다 (웹 서버의 뼈대를 만드는 것)
const app = express();

// CORS 설정: 다른 웹사이트에서 우리 서버에 접근할 수 있게 허용합니다
app.use(cors());

// JSON 형식의 데이터를 받을 수 있게 설정합니다
// (예: {"name": "홍길동", "age": 20} 같은 형식)
app.use(express.json());

// URL 인코딩된 데이터를 받을 수 있게 설정합니다
// (예: name=홍길동&age=20 같은 형식)
app.use(express.urlencoded({ extended: true }));

// 세션 설정 (소셜 로그인용)
// 세션이란? 사용자가 로그인한 상태를 기억하는 방법입니다
// 예를 들어, 네이버 로그인할 때 보안을 위해 사용하는 것입니다
const session = require('express-session');
app.use(session({
  secret: config.jwt.secret, // 세션을 암호화하는 비밀키 (열쇠 같은 것)
  resave: false, // 세션을 자동으로 다시 저장하지 않음
  saveUninitialized: false, // 빈 세션을 저장하지 않음
  cookie: { secure: false } // HTTPS 사용 시 true로 변경 (보안을 강화하려면)
}));

// EJS 설정: HTML 템플릿을 사용할 수 있게 설정합니다
// (나중에 필요하면 사용할 수 있도록 준비해둔 것입니다)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.'));

// 데이터베이스 연결 풀 초기화
// 연결 풀이란? 데이터베이스와의 연결을 미리 만들어두는 것입니다
// 마치 전화를 걸기 전에 미리 전화선을 준비해두는 것과 같습니다
db.init().catch(err => {
  console.error('Failed to initialize database pool:', err);
  process.exit(1); // 데이터베이스 연결 실패 시 서버를 종료합니다
});

// 소셜 로그인 라우트 (카카오, 네이버, 구글 로그인)
// 라우트란? 특정 주소로 요청이 오면 어떤 일을 할지 정해놓은 것입니다
// 예: /auth/kakao 주소로 요청이 오면 카카오 로그인을 시작합니다
try {
  const authRoutes = require('./routes/auth');
  app.use('/auth', authRoutes); // /auth로 시작하는 모든 요청을 authRoutes로 보냅니다
} catch (error) {
  console.warn('소셜 로그인 라우트를 로드할 수 없습니다:', error.message);
}

// Swagger API 문서
// Swagger란? 우리 API를 설명하는 문서를 자동으로 만들어주는 도구입니다
// 개발자들이 우리 API를 어떻게 사용하는지 쉽게 알 수 있게 해줍니다
try {
  const { swaggerUi, specs } = require('./swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }' // Swagger 화면에서 상단 바를 숨깁니다
  }));
  console.log('API 문서: http://localhost:' + config.server.port + '/api-docs');
} catch (error) {
  console.warn('Swagger를 로드할 수 없습니다:', error.message);
}

// ============================================
// API 엔드포인트 (사용자가 요청할 수 있는 주소들)
// ============================================

// 루트 경로 (/) - 서버가 살아있는지 확인하는 용도
// 예: http://localhost:3009/ 로 접속하면 "Hello World"를 보여줍니다
app.get('/', (req, res) => {
  res.send('Hello World');
});

// 로그인 API
// 사용자가 아이디와 비밀번호를 입력하면 로그인을 처리합니다
// GET /lib/login?userId=아이디&pwd=비밀번호
app.get('/lib/login', async (req, res) => {
  // req.query: URL의 ? 뒤에 오는 값들을 가져옵니다
  // 예: /lib/login?userId=hong&pwd=1234
  //     req.query.userId = "hong"
  //     req.query.pwd = "1234"
  const { userId, pwd } = req.query;
  
  // 아이디나 비밀번호가 없으면 에러를 보냅니다
  if (!userId || !pwd) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
  }

  try {
    // 데이터베이스에서 사용자 정보를 찾습니다
    // SELECT: 데이터베이스에서 정보를 가져오는 명령어 (읽기)
    const query = `SELECT USERID, NAME, EMAIL, PHONE, ADDRESS, PASSWORD FROM LIB_USERS WHERE USERID = :userId`;
    const result = await db.executeQuery(query, { userId });
    const rows = convertRowsToJson(result); // 데이터베이스 결과를 JSON 형식으로 변환합니다
    
    // 사용자가 없으면 (아이디가 틀렸으면)
    if (rows.length === 0) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = rows[0]; // 첫 번째 사용자 정보를 가져옵니다
    
    // 비밀번호 검증 (해싱된 비밀번호와 평문 비밀번호 비교)
    // 해싱이란? 비밀번호를 암호화해서 저장하는 것입니다
    // 예: "1234" → "$argon2id$v=19$m=65536,t=3,p=4$..." (이런 식으로 변환됨)
    const isValidPassword = await verifyPassword(user.PASSWORD, pwd);
    
    // 비밀번호가 틀렸으면
    if (!isValidPassword) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    // JWT 토큰 생성 (로그인 성공 증명서를 만드는 것)
    // 토큰이란? 사용자가 로그인했다는 증명서입니다
    // 나중에 다른 페이지에 접근할 때 이 토큰을 보여주면 "아, 이 사람은 로그인했구나"라고 인식합니다
    const token = generateToken({ 
      userId: user.USERID, 
      name: user.NAME 
    });

    // 비밀번호는 보안상 사용자에게 보내지 않습니다 (삭제)
    delete user.PASSWORD;
    
    // 로그인 성공! 사용자 정보와 토큰을 보냅니다
    res.json({
      success: true,
      user: user,
      token: token
    });
  } catch (error) {
    console.error('Error executing login query:', error);
    const errorResponse = handleError(error, '로그인 처리 중 오류가 발생했습니다.');
    res.status(errorResponse.statusCode).json({ error: errorResponse.message });
  }
});

// 아이디 중복 확인 API
// 회원가입할 때 아이디가 이미 사용 중인지 확인합니다
// GET /lib/checkId?userId=아이디
app.get('/lib/checkId', async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: '아이디를 입력해주세요.' });
  }

  try {
    // COUNT(*): 데이터베이스에서 몇 개의 행(레코드)이 있는지 세는 명령어
    // 이 아이디를 가진 사용자가 몇 명인지 확인합니다
    const query = `SELECT COUNT(*) AS COUNT FROM LIB_USERS WHERE USERID = :userId`;
    const result = await db.executeQuery(query, { userId });
    const rows = convertRowsToJson(result);
    
    // COUNT가 0보다 크면 중복입니다 (이미 사용 중인 아이디)
    const isDuplicate = rows[0] && rows[0].COUNT > 0;
    res.json({ duplicate: isDuplicate });
  } catch (error) {
    console.error('Error checking ID:', error);
    const errorResponse = handleError(error, '아이디 확인 중 오류가 발생했습니다.');
    res.status(errorResponse.statusCode).json({ error: errorResponse.message });
  }
});

// 회원가입 API
// 새로운 사용자를 데이터베이스에 등록합니다
// GET /lib/join?userId=아이디&password=비밀번호&name=이름&email=이메일&phone=전화번호&address=주소
app.get('/lib/join', 
  validateEmailQuery('email'), // 이메일 형식이 올바른지 확인
  validatePhoneQuery('phone'), // 전화번호 형식이 올바른지 확인
  handleValidationErrors, // 검증 결과를 처리
  async (req, res) => {
    const { userId, password, name, email, phone, address } = req.query;
    
    // 필수 정보가 없으면 에러
    if (!userId || !password || !name || !email) {
      return res.status(400).json({ success: false, message: '필수 정보가 누락되었습니다.' });
    }

    try {
      // 비밀번호 해싱 (평문 비밀번호를 암호화해서 저장)
      // 왜 해싱하나요? 데이터베이스에 그대로 저장하면 해커가 훔쳐볼 수 있기 때문입니다
      const hashedPassword = await hashPassword(password);
      
      // INSERT: 데이터베이스에 새로운 정보를 추가하는 명령어 (쓰기)
      const query = `INSERT INTO LIB_USERS (USERID, PASSWORD, NAME, EMAIL, PHONE, ADDRESS)
        VALUES (:1, :2, :3, :4, :5, :6)`;
      
      // autoCommit: true → 즉시 저장 (트랜잭션을 자동으로 커밋)
      await db.executeQuery(
        query, 
        [userId, hashedPassword, name, email || '', phone || '', address || ''],
        { autoCommit: true }
      );
      
      res.json({ success: true, message: "회원가입이 완료되었습니다." });
    } catch (error) {
      console.error('Error during registration:', error);
      // error.errorNum === 1: 중복된 아이디 에러 (Oracle 에러 코드)
      if (error.errorNum === 1) {
        res.json({ success: false, message: "이미 사용 중인 아이디입니다." });
      } else {
        const errorResponse = handleError(error, "회원가입 중 오류가 발생했습니다.");
        res.status(errorResponse.statusCode).json({ success: false, message: errorResponse.message });
      }
    }
  }
);

// 아이디 찾기 API
// 이름과 이메일로 아이디를 찾습니다
// GET /lib/findId?name=이름&email=이메일
app.get('/lib/findId', async (req, res) => {
  const { name, email } = req.query;
  
  if (!name || !email) {
    return res.status(400).json({ error: '이름과 이메일을 입력해주세요.' });
  }

  try {
    const query = `SELECT USERID FROM LIB_USERS WHERE NAME = :name AND EMAIL = :email`;
    const result = await db.executeQuery(query, { name, email });
    
    // 사용자를 찾았으면 아이디를 보내고, 없으면 null을 보냅니다
    if (result.rows && result.rows.length > 0) {
      res.json({ userId: result.rows[0][0] }); // result.rows[0][0] = 첫 번째 행의 첫 번째 열 (USERID)
    } else {
      res.json({ userId: null });
    }
  } catch (error) {
    console.error('Error finding ID:', error);
    const errorResponse = handleError(error, '서버 오류가 발생했습니다.');
    res.status(errorResponse.statusCode).json({ error: errorResponse.message });
  }
});

// 비밀번호 재설정 API
// 아이디, 이름, 이메일이 맞으면 임시 비밀번호를 발급합니다
// GET /lib/resetPwd?userId=아이디&name=이름&email=이메일
app.get('/lib/resetPwd', 
  validateEmailQuery('email'), // 이메일 형식 검증
  handleValidationErrors,
  async (req, res) => {
    const { userId, name, email } = req.query;

    if (!userId || !name || !email) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }

    try {
      // 사용자 정보가 맞는지 확인
      const query = `SELECT COUNT(*) AS COUNT FROM LIB_USERS WHERE USERID = :userId AND NAME = :name AND EMAIL = :email`;
      const result = await db.executeQuery(query, { userId, name, email });
      
      // 정보가 맞으면 (COUNT > 0)
      if (result.rows[0][0] > 0) {
        // 임시 비밀번호 생성 및 해싱
        // 임시 비밀번호란? 사용자가 비밀번호를 잊어버렸을 때 임시로 사용할 수 있는 비밀번호입니다
        const { tempPassword, hashedPassword } = await generateHashedTempPassword();
        
        // UPDATE: 데이터베이스의 정보를 수정하는 명령어
        const updateQuery = `UPDATE LIB_USERS SET PASSWORD = :hashedPassword WHERE USERID = :userId`;
        
        await db.executeQuery(updateQuery, { hashedPassword, userId }, { autoCommit: true });
        
        // 임시 비밀번호를 사용자에게 보여줍니다 (평문으로)
        res.json({ tempPassword: tempPassword });
      } else {
        // 정보가 맞지 않으면
        res.json({ tempPassword: null });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      const errorResponse = handleError(error, '서버 오류가 발생했습니다.');
      res.status(errorResponse.statusCode).json({ error: errorResponse.message });
    }
  }
);

// 사용자 정보 조회 API
// 로그인한 사용자의 정보를 가져옵니다
// authenticateToken: 로그인했는지 확인하는 미들웨어 (문지기 같은 역할)
// GET /lib/userInfo (토큰 필요)
app.get('/lib/userInfo', authenticateToken, async (req, res) => {
  // req.user: authenticateToken 미들웨어가 토큰에서 추출한 사용자 정보
  const userId = req.user.userId;

  try {
    const query = `SELECT USERID, NAME, EMAIL, PHONE, ADDRESS FROM LIB_USERS WHERE USERID = :1`;
    const result = await db.executeQuery(query, [userId]);
    const userData = convertSingleRowToJson(result);
    
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user info:', error);
    const errorResponse = handleError(error, '사용자 정보 조회 중 오류가 발생했습니다.');
    res.status(errorResponse.statusCode).json({ error: errorResponse.message });
  }
});

// 사용자 정보 업데이트 API
// 사용자가 자신의 정보를 수정합니다
// GET /lib/updateUserInfo?userId=아이디&name=이름&email=이메일&phone=전화번호&address=주소&currentPassword=현재비밀번호&newPassword=새비밀번호
app.get('/lib/updateUserInfo',
  authenticateToken, // 로그인 확인
  validateEmailQuery('email'), // 이메일 형식 확인
  validatePhoneQuery('phone'), // 전화번호 형식 확인
  handleValidationErrors,
  async (req, res) => {
    const { userId, name, email, phone, address, currentPassword, newPassword } = req.query;

    if (!userId || !name || !email) {
      return res.status(400).json({ success: false, message: '필수 정보가 누락되었습니다.' });
    }

    // 토큰에서 가져온 userId와 요청 userId 일치 확인
    // 왜 확인하나요? 다른 사람의 정보를 수정하는 것을 막기 위해서입니다
    if (req.user.userId !== userId) {
      return res.status(403).json({ success: false, message: '본인의 정보만 수정할 수 있습니다.' });
    }

    try {
      // 기존 비밀번호 일치 여부 확인
      const checkPwdQuery = `SELECT PASSWORD FROM LIB_USERS WHERE USERID = :1`;
      const checkPwdResult = await db.executeQuery(checkPwdQuery, [userId]);

      if (checkPwdResult.rows.length === 0) {
        return res.json({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      const storedHashedPassword = checkPwdResult.rows[0][0];
      const isValidPassword = await verifyPassword(storedHashedPassword, currentPassword);

      if (!isValidPassword) {
        return res.json({ success: false, message: '기존 비밀번호가 일치하지 않습니다.' });
      }

      // 업데이트할 쿼리 준비
      let updateQuery;
      let bindParams;

      // 새 비밀번호가 입력되었으면 비밀번호도 함께 업데이트
      if (newPassword && newPassword.trim() !== '') {
        const hashedNewPassword = await hashPassword(newPassword);
        updateQuery = `
          UPDATE LIB_USERS
          SET NAME = :1, EMAIL = :2, PHONE = :3, ADDRESS = :4, PASSWORD = :5
          WHERE USERID = :6
        `;
        bindParams = [name, email, phone || '', address || '', hashedNewPassword, userId];
      } else {
        // 새 비밀번호가 없으면 비밀번호는 그대로 두고 다른 정보만 업데이트
        updateQuery = `
          UPDATE LIB_USERS
          SET NAME = :1, EMAIL = :2, PHONE = :3, ADDRESS = :4
          WHERE USERID = :5
        `;
        bindParams = [name, email, phone || '', address || '', userId];
      }
      
      const result = await db.executeQuery(updateQuery, bindParams, { autoCommit: true });

      if (result.rowsAffected && result.rowsAffected > 0) {
        res.json({ success: true, message: '회원 정보가 성공적으로 수정되었습니다.' });
      } else {
        res.json({ success: false, message: '회원 정보 수정에 실패했습니다. 사용자 정보를 확인해주세요.' });
      }
    } catch (error) {
      console.error('Error updating user info:', error);
      const errorResponse = handleError(error, '회원 정보 수정 중 오류가 발생했습니다.');
      res.status(errorResponse.statusCode).json({ success: false, message: errorResponse.message });
    }
  }
);

// 회원 탈퇴 API
// 사용자가 계정을 삭제합니다
// GET /lib/withdraw?userId=아이디&password=비밀번호
app.get('/lib/withdraw', authenticateToken, async (req, res) => {
  const { userId, password } = req.query;
  
  if (!userId || !password) {
    return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });
  }

  // 본인만 탈퇴할 수 있도록 확인
  if (req.user.userId !== userId) {
    return res.status(403).json({ success: false, message: '본인만 탈퇴할 수 있습니다.' });
  }

  try {
    // 비밀번호 확인
    const checkPwdQuery = `SELECT PASSWORD FROM LIB_USERS WHERE USERID = :1`;
    const checkResult = await db.executeQuery(checkPwdQuery, [userId]);
    
    if (checkResult.rows.length === 0) {
      return res.json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    const storedHashedPassword = checkResult.rows[0][0];
    const isValidPassword = await verifyPassword(storedHashedPassword, password);
    
    if (!isValidPassword) {
      return res.json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }
    
    // DELETE: 데이터베이스에서 정보를 삭제하는 명령어
    const deleteQuery = `DELETE FROM LIB_USERS WHERE USERID = :1`;
    const result = await db.executeQuery(deleteQuery, [userId], { autoCommit: true });
    
    if (result.rowsAffected && result.rowsAffected > 0) {
      res.json({ success: true, message: '회원 탈퇴가 완료되었습니다.' });
    } else {
      res.json({ success: false, message: '회원 탈퇴 처리에 실패했습니다.' });
    }
  } catch (error) {
    console.error('Error during user withdrawal:', error);
    const errorResponse = handleError(error, '회원 탈퇴 중 오류가 발생했습니다.');
    res.status(errorResponse.statusCode).json({ success: false, message: errorResponse.message });
  }
});

// 좌석 유형 정보 조회 API
// 스터디카페에 있는 좌석 종류를 가져옵니다 (예: 일반석, 프리미엄석 등)
// GET /seattypes
app.get('/seattypes', async (req, res) => {
  try {
    const query = `SELECT TYPENO, TYPENAME, PRICE, DESCRIPTION FROM LIB_SEAT_TYPES ORDER BY TYPENO`;
    const result = await db.executeQuery(query);
    res.json(result.rows); 
  } catch (err) {
    console.error('Error fetching seat types:', err);
    const errorResponse = handleError(err, '좌석 유형 정보를 불러오는데 실패했습니다.');
    res.status(errorResponse.statusCode).json({ success: false, message: errorResponse.message });
  }
});

// 좌석 정보 및 예약 상태 조회 API
// 특정 날짜와 시간에 어떤 좌석이 예약되어 있는지 확인합니다
// GET /seats?date=2024-01-01&startHour=9&endHour=12
app.get('/seats', async (req, res) => {
  try {
    const { date: selectedDate, startHour, endHour } = req.query;

    if (!selectedDate || !startHour || !endHour) {
      return res.status(400).json({ success: false, message: '날짜, 시작 시간, 종료 시간을 모두 지정해야 합니다.' });
    }

    // 모든 좌석 정보 가져오기
    const allSeatsResult = await db.executeQuery(
      `SELECT 
          s.SEATNO, 
          s.TYPENO, 
          s.CAPACITY, 
          s.SEATSTATUS, 
          s.LOCATION, 
          s.SEAT_NOTES
       FROM LIB_SEATS s
       ORDER BY s.SEATNO`
    );

    let allSeats = allSeatsResult.rows;

    // 해당 날짜/시간에 예약된 좌석 정보 가져오기
    // DISTINCT: 중복 제거 (같은 좌석이 여러 번 나오지 않게)
    const reservedSeatsResult = await db.executeQuery(
      `SELECT DISTINCT SEATNO
       FROM LIB_RESERVATIONS
       WHERE RESVDATE = TO_DATE(:selectedDate, 'YYYY-MM-DD')
         AND RESVSTATUS = 'CONFIRMED'
         AND (
              (START_HOUR < :endHour AND END_HOUR > :startHour)
              OR
              (START_HOUR = :startHour AND END_HOUR = :endHour)
         )`,
      {
        selectedDate: selectedDate,
        startHour: parseInt(startHour),
        endHour: parseInt(endHour)
      }
    );

    // 예약된 좌석 번호들을 배열로 만듭니다
    const reservedSeatNumbers = reservedSeatsResult.rows.map(row => row[0]);

    // 모든 좌석 정보에 예약 상태 반영
    // map: 배열의 각 항목을 변환하는 함수 (예: [1, 2, 3] → [2, 4, 6])
    const finalSeats = allSeats.map(seat => {
      const seatno = seat[0];
      // 예약된 좌석이면 상태를 'OCCUPIED' (점유됨)로 변경
      if (reservedSeatNumbers.includes(seatno)) {
        return [seat[0], seat[1], seat[2], 'OCCUPIED', seat[4], seat[5]];
      } else {
        return seat; // 예약되지 않은 좌석은 그대로
      }
    });

    res.json(finalSeats);
  } catch (err) {
    console.error('Error fetching seats:', err);
    const errorResponse = handleError(err, '좌석 정보를 불러오는데 실패했습니다.');
    res.status(errorResponse.statusCode).json({ success: false, message: errorResponse.message });
  }
});

// 좌석 예약 처리 API
// 사용자가 좌석을 예약합니다
// GET /reservation?seatNo=1&resvDate=2024-01-01&startHour=9&endHour=12&totalPrice=5000
app.get('/reservation', authenticateToken, async (req, res) => {
  try {
    const { seatNo, resvDate, startHour, endHour, totalPrice } = req.query;
    const userId = req.user.userId; // 토큰에서 userId 가져오기

    if (!seatNo || !resvDate || startHour == null || endHour == null || totalPrice == null) {
      return res.status(400).json({ success: false, message: '필수 예약 정보가 누락되었습니다.' });
    }

    // 1인 1예약 체크 (스터디카페는 한 사람당 하나의 예약만 가능)
    // TRUNC: 날짜에서 시간 부분을 제거하는 함수 (예: 2024-01-01 14:30 → 2024-01-01)
    // SYSDATE: 현재 날짜와 시간
    const activeUserReservationCheck = await db.executeQuery(
      `SELECT COUNT(*) AS ACTIVE_COUNT
       FROM LIB_RESERVATIONS 
       WHERE USERID = :userId 
         AND RESVSTATUS = 'CONFIRMED'
         AND (
           TRUNC(RESVDATE) > TRUNC(SYSDATE) 
           OR (
             TRUNC(RESVDATE) = TRUNC(SYSDATE) 
             AND END_HOUR > TO_NUMBER(TO_CHAR(SYSDATE, 'HH24'))
           )
         )`,
      { userId: userId }
    );
    
    // 이미 활성화된 예약이 있으면
    if (activeUserReservationCheck.rows[0][0] > 0) {
      return res.status(409).json({ 
        success: false, 
        message: '이미 활성화된 예약이 있습니다. 스터디카페는 1인 1예약 원칙을 적용하고 있습니다.' 
      });
    }

    // 중복 예약 체크 (같은 좌석, 같은 날짜, 같은 시간에 이미 예약이 있는지 확인)
    const checkReservation = await db.executeQuery(
      `SELECT COUNT(*) AS CNT
       FROM LIB_RESERVATIONS
       WHERE SEATNO = :seatNo
        AND RESVDATE = TO_DATE(:resvDate, 'YYYY-MM-DD')
        AND (
          (START_HOUR <= :endHour AND END_HOUR >= :startHour)
          OR
          (START_HOUR >= :startHour AND START_HOUR < :endHour)
          OR
          (END_HOUR > :startHour AND END_HOUR <= :endHour)
        )
        AND RESVSTATUS = 'CONFIRMED'`,
      { 
        seatNo: parseInt(seatNo), 
        resvDate: resvDate,
        startHour: parseInt(startHour),
        endHour: parseInt(endHour)
      }
    );

    // 이미 예약이 있으면
    if (checkReservation.rows[0][0] > 0) {
      return res.status(409).json({ success: false, message: '해당 시간대에 이미 예약된 좌석입니다. 다시 선택해주세요.' });
    }

    // 예약 번호 생성 (시퀀스가 없으면 MAX+1 사용)
    // 시퀀스란? 자동으로 번호를 만들어주는 데이터베이스 기능입니다
    let resvNo;
    try {
      const seqResult = await db.executeQuery(`SELECT SEQ_RESERVATION.NEXTVAL FROM DUAL`);
      resvNo = seqResult.rows[0][0];
    } catch (seqError) {
      // 시퀀스가 없으면 MAX+1 사용 (가장 큰 번호에 1을 더함)
      const maxResult = await db.executeQuery(`SELECT NVL(MAX(RESVNO), 0) + 1 FROM LIB_RESERVATIONS`);
      resvNo = maxResult.rows[0][0];
    }

    // 예약 정보 삽입
    const result = await db.executeQuery(
      `INSERT INTO LIB_RESERVATIONS (RESVNO, USERID, SEATNO, RESVDATE, START_HOUR, END_HOUR, TOTALPRICE, RESVSTATUS)
       VALUES (:resvNo, :userId, :seatNo, TO_DATE(:resvDate, 'YYYY-MM-DD'), :startHour, :endHour, :totalPrice, 'CONFIRMED')`,
      { 
        resvNo: resvNo,
        userId: userId, 
        seatNo: parseInt(seatNo), 
        resvDate: resvDate,
        startHour: parseInt(startHour), 
        endHour: parseInt(endHour), 
        totalPrice: parseInt(totalPrice) 
      },
      { autoCommit: true }
    );

    if (result.rowsAffected && result.rowsAffected > 0) {
      res.json({ success: true, message: '예약이 성공적으로 완료되었습니다.' });
    } else {
      res.status(500).json({ success: false, message: '예약 처리에 실패했습니다.' });
    }
  } catch (err) {
    console.error('Error making reservation:', err);
    const errorResponse = handleError(err, '예약 처리 중 서버 오류가 발생했습니다.');
    res.status(errorResponse.statusCode).json({ success: false, message: errorResponse.message });
  }
});

// 사용자 예약 내역 조회 API
// 로그인한 사용자의 모든 예약 내역을 가져옵니다
// GET /myreservations (토큰 필요)
app.get('/myreservations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // JOIN: 여러 테이블을 연결해서 정보를 가져옵니다
    // 예: 예약 정보 + 좌석 정보 + 좌석 유형 정보를 함께 가져옵니다
    const result = await db.executeQuery(
      `SELECT 
          R.RESVNO, R.USERID, R.SEATNO, TO_CHAR(R.RESVDATE, 'YYYY-MM-DD') AS RESVDATE, R.START_HOUR, R.END_HOUR, 
          R.TOTALPRICE, R.RESVSTATUS, TO_CHAR(R.RESVTIME, 'YYYY-MM-DD HH24:MI:SS') AS RESVTIME, 
          S.LOCATION, S.SEAT_NOTES, T.TYPENAME
       FROM 
          LIB_RESERVATIONS R
       JOIN
          LIB_SEATS S ON R.SEATNO = S.SEATNO
       JOIN
          LIB_SEAT_TYPES T ON S.TYPENO = T.TYPENO
       WHERE
          R.USERID = :userId
       ORDER BY R.RESVDATE DESC, R.START_HOUR DESC`, // 최신순으로 정렬
      { userId: userId }
    );
    
    res.json({ success: true, reservations: result.rows });
  } catch (err) {
    console.error('Error fetching user reservations:', err);
    const errorResponse = handleError(err, '사용자 예약 내역을 불러오는데 실패했습니다.');
    res.status(errorResponse.statusCode).json({ success: false, message: errorResponse.message });
  }
});

// 예약 취소 처리 API
// 사용자가 예약을 취소합니다
// GET /cancel-reservation?resvNo=예약번호
app.get('/cancel-reservation', authenticateToken, async (req, res) => {
  try {
    const { resvNo } = req.query;
    const userId = req.user.userId;

    if (!resvNo) {
      return res.status(400).json({ success: false, message: '예약 번호가 필요합니다.' });
    }

    // 예약 정보 확인
    const checkResv = await db.executeQuery(
      `SELECT RESVDATE, START_HOUR, END_HOUR, RESVSTATUS, USERID FROM LIB_RESERVATIONS WHERE RESVNO = :resvNo`,
      { resvNo: resvNo }
    );

    if (checkResv.rows.length === 0) {
      return res.status(404).json({ success: false, message: '해당 예약 정보를 찾을 수 없습니다.' });
    }

    const reservation = checkResv.rows[0];
    const resvDate = reservation[0];
    const startHour = reservation[1];
    const endHour = reservation[2];
    const resvStatus = reservation[3];
    const resvUserId = reservation[4];

    // 본인의 예약만 취소할 수 있도록 확인
    if (resvUserId !== userId) {
      return res.status(403).json({ success: false, message: '본인의 예약만 취소할 수 있습니다.' });
    }

    // 이미 취소된 예약인지 확인
    if (resvStatus === 'CANCELED') {
      return res.status(409).json({ success: false, message: '이미 취소된 예약입니다.' });
    }

    // 예약 종료 시간이 지났는지 확인
    const now = new Date();
    const endDate = new Date(resvDate);
    endDate.setHours(endHour);

    // 이미 종료된 예약은 취소할 수 없음
    if (endDate <= now) {
      return res.status(409).json({ success: false, message: '이미 종료된 예약은 취소할 수 없습니다.' });
    }

    // 예약 상태를 'CANCELED'로 변경
    const result = await db.executeQuery(
      `UPDATE LIB_RESERVATIONS SET RESVSTATUS = 'CANCELED' WHERE RESVNO = :resvNo`,
      { resvNo: resvNo },
      { autoCommit: true }
    );

    if (result.rowsAffected && result.rowsAffected > 0) {
      res.json({ success: true, message: '예약이 성공적으로 취소되었습니다.' });
    } else {
      res.status(500).json({ success: false, message: '예약 취소 처리에 실패했습니다.' });
    }
  } catch (err) {
    console.error('Error canceling reservation:', err);
    const errorResponse = handleError(err, '예약 취소 중 서버 오류가 발생했습니다.');
    res.status(errorResponse.statusCode).json({ success: false, message: errorResponse.message });
  }
});

// 사용자의 활성 예약 조회 API
// 사용자가 현재 활성화된 예약이 있는지 확인합니다
// GET /user/active-reservations (토큰 필요)
app.get('/user/active-reservations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 활성 예약이란? 아직 시작하지 않았거나 진행 중인 예약입니다
    const result = await db.executeQuery(
      `SELECT COUNT(*) AS ACTIVE_COUNT
       FROM LIB_RESERVATIONS 
       WHERE USERID = :userId 
         AND RESVSTATUS = 'CONFIRMED'
         AND (
           TRUNC(RESVDATE) > TRUNC(SYSDATE) 
           OR (
             TRUNC(RESVDATE) = TRUNC(SYSDATE) 
             AND END_HOUR > TO_NUMBER(TO_CHAR(SYSDATE, 'HH24'))
           )
         )`,
      { userId: userId }
    );
    
    const activeCount = result.rows[0][0];
    
    res.json({ 
      success: true, 
      hasActiveReservation: activeCount > 0, // 활성 예약이 있으면 true
      activeCount: activeCount
    });
  } catch (err) {
    console.error('활성 예약 확인 중 오류:', err);
    const errorResponse = handleError(err, '활성 예약 확인 중 오류가 발생했습니다.');
    res.status(errorResponse.statusCode).json({ success: false, message: errorResponse.message });
  }
});

// 게시판 목록 조회 API
// 게시판에 있는 글 목록을 가져옵니다 (페이지네이션 지원)
// GET /board/list?pageSize=10&offset=0
app.get('/board/list', async (req, res) => {
  const { pageSize, offset } = req.query;
  
  if (!pageSize || !offset) {
    return res.status(400).json({ error: '페이지 크기와 오프셋이 필요합니다.' });
  }

  // SQL 인젝션 방지를 위해 숫자로 변환 및 검증
  // SQL 인젝션이란? 해커가 악의적인 SQL 코드를 입력해서 데이터베이스를 공격하는 것입니다
  const pageSizeNum = parseInt(pageSize);
  const offsetNum = parseInt(offset);
  
  if (isNaN(pageSizeNum) || isNaN(offsetNum) || pageSizeNum < 1 || offsetNum < 0) {
    return res.status(400).json({ error: '유효하지 않은 페이지 파라미터입니다.' });
  }

  try {
    // OFFSET ... ROWS FETCH NEXT ... ROWS ONLY: 페이지네이션 (일부만 가져오기)
    // 예: OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY → 처음부터 10개만 가져오기
    const result = await db.executeQuery(
      `SELECT B.*, TO_CHAR(CDATETIME, 'YYYY-MM-DD') AS CDATE FROM TBL_BOARD B 
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset: offsetNum, pageSize: pageSizeNum }
    );
    
    const rows = convertRowsToJson(result);

    // 전체 게시글 개수 가져오기
    const count = await db.executeQuery(`SELECT COUNT(*) FROM TBL_BOARD`);
    const totalCount = count.rows[0][0];

    res.json({
      result: "success",
      boardList: rows,
      count: totalCount
    });
  } catch (error) {
    console.error('Error executing query', error);
    const errorResponse = handleError(error, '게시판 목록 조회 중 오류가 발생했습니다.');
    res.status(errorResponse.statusCode).json({ error: errorResponse.message });
  }
});

// 게시판 글 작성 API
// 새로운 게시글을 작성합니다
// GET /board/add?title=제목&contents=내용&userId=아이디&kind=종류
app.get('/board/add', async (req, res) => {
  const { title, contents, userId, kind } = req.query;

  if (!title || !contents || !userId) {
    return res.status(400).json({ error: '제목, 내용, 사용자 ID가 필요합니다.' });
  }

  try {
    // B_SEQ.NEXTVAL: 게시글 번호를 자동으로 생성하는 시퀀스
    // SYSDATE: 현재 날짜와 시간
    await db.executeQuery(
      `INSERT INTO TBL_BOARD VALUES(B_SEQ.NEXTVAL, :title, :contents, :userId, 0, 0, :kind, SYSDATE, SYSDATE)`,
      [title, contents, userId, kind || ''],
      { autoCommit: true }
    );
    res.json({ result: "success" });
  } catch (error) {
    console.error('데이터 삽입 오류 발생:', error);
    const errorResponse = handleError(error, '게시글 작성 중 오류가 발생했습니다.');
    res.status(errorResponse.statusCode).json({ error: errorResponse.message });
  }
});

// 게시판 글 조회 API
// 특정 게시글의 내용을 가져옵니다
// GET /board/view?boardNo=게시글번호
app.get('/board/view', async (req, res) => {
  const { boardNo } = req.query;
  
  if (!boardNo) {
    return res.status(400).json({ error: '게시글 번호가 필요합니다.' });
  }

  // SQL 인젝션 방지: 숫자로 변환 및 검증
  const boardNoNum = parseInt(boardNo);
  if (isNaN(boardNoNum) || boardNoNum < 1) {
    return res.status(400).json({ error: '유효하지 않은 게시글 번호입니다.' });
  }

  try {
    const result = await db.executeQuery(
      `SELECT B.*, TO_CHAR(CDATETIME, 'YYYY-MM-DD') AS CDATE FROM TBL_BOARD B 
       WHERE BOARDNO = :boardNo`,
      { boardNo: boardNoNum }
    );
    
    const rows = convertRowsToJson(result);
    
    res.json({
      result: "success",
      info: rows[0] || null // 첫 번째 게시글 정보 또는 null
    });
  } catch (error) {
    console.error('Error executing query', error);
    const errorResponse = handleError(error, '게시글 조회 중 오류가 발생했습니다.');
    res.status(errorResponse.statusCode).json({ error: errorResponse.message });
  }
});

// ============================================
// 에러 핸들러 (에러를 처리하는 마지막 단계)
// ============================================

// 404 에러 핸들러: 존재하지 않는 경로로 요청이 오면 실행됩니다
const { notFoundHandler, errorHandler } = require('./utils/errorResponse');
app.use(notFoundHandler);

// 전역 에러 핸들러: 모든 에러를 처리하는 마지막 안전망입니다
app.use(errorHandler);

// ============================================
// 서버 시작
// ============================================

// 서버를 시작합니다 (포트 번호에서 요청을 받기 시작합니다)
app.listen(config.server.port, () => {
  console.log(`✅ Server is running on port ${config.server.port}`);
  console.log(`📚 API 문서: http://localhost:${config.server.port}/api-docs`);
  console.log(`🌍 Environment: ${config.server.env}`);
});

// 프로세스 종료 시 연결 풀 정리
// SIGINT: Ctrl+C를 눌렀을 때 발생하는 신호
// SIGTERM: 프로세스를 종료하라는 신호
// 서버가 종료될 때 데이터베이스 연결을 깔끔하게 정리합니다
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  await db.closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down server...');
  await db.closePool();
  process.exit(0);
});
