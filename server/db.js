/**
 * ============================================
 * 데이터베이스 연결 관리 파일 (db.js)
 * ============================================
 * 
 * 이 파일은 우리 서버와 데이터베이스를 연결하는 역할을 합니다!
 * 
 * [이 파일이 하는 일]
 * 1. 데이터베이스와의 연결을 관리합니다 (연결 풀)
 * 2. SQL 쿼리를 실행합니다
 * 3. 연결을 안전하게 닫습니다
 * 
 * [비유로 설명하면]
 * - 이 파일은 전화 교환원과 같은 역할입니다
 * - 서버가 데이터베이스에 전화를 걸 때 연결을 도와줍니다
 * - 여러 사람이 동시에 전화를 걸어도 효율적으로 처리합니다
 */

// oracledb: Oracle 데이터베이스와 대화할 수 있게 해주는 도구
const oracledb = require('oracledb');
// config: 데이터베이스 설정 정보 (주소, 비밀번호 등)
const config = require('./config');

// pool: 연결 풀 (데이터베이스 연결을 미리 만들어두는 저장소)
// 연결 풀이란? 여러 개의 연결을 미리 만들어두고 필요할 때마다 빌려주는 것입니다
// 마치 도서관에서 책을 미리 준비해두고 빌려주는 것과 같습니다
let pool;

/**
 * 데이터베이스 연결 풀 초기화
 * 
 * 연결 풀을 만드는 함수입니다.
 * 서버가 시작될 때 한 번만 실행됩니다.
 * 
 * [작동 방식]
 * 1. 연결 풀이 없으면 새로 만듭니다
 * 2. 설정 파일에서 데이터베이스 정보를 가져옵니다
 * 3. 여러 개의 연결을 미리 만들어둡니다
 */
async function init() {
    // 연결 풀이 이미 있으면 새로 만들지 않습니다 (중복 방지)
    if (!pool) {
        try {
            // oracledb.createPool: 연결 풀을 만드는 함수
            // config.db: 데이터베이스 설정 정보 (주소, 아이디, 비밀번호 등)
            pool = await oracledb.createPool(config.db);
            console.log("✅ Oracle connection pool created");
        } catch (err) {
            // 에러가 발생하면 콘솔에 출력하고 다시 던집니다 (throw)
            console.error("❌ Error creating connection pool:", err);
            throw err;
        }
    }
    return pool;
}

/**
 * 데이터베이스 연결 가져오기
 * 
 * 연결 풀에서 하나의 연결을 빌려옵니다.
 * 
 * [작동 방식]
 * 1. 연결 풀이 없으면 먼저 만듭니다
 * 2. 연결 풀에서 사용 가능한 연결을 하나 가져옵니다
 * 3. 그 연결을 반환합니다
 * 
 * @returns {Promise<Object>} Oracle DB 연결 객체
 */
async function getConnection() {
    // 연결 풀이 없으면 먼저 초기화합니다
    if (!pool) {
        await init();
    }
    // pool.getConnection(): 연결 풀에서 사용 가능한 연결을 하나 가져옵니다
    return pool.getConnection();
}

/**
 * 쿼리 실행 헬퍼 함수
 * 
 * SQL 쿼리를 실행하고 결과를 반환하는 함수입니다.
 * 이 함수는 연결을 자동으로 관리합니다 (열고 닫기).
 * 
 * [작동 방식]
 * 1. 데이터베이스 연결을 가져옵니다
 * 2. SQL 쿼리를 실행합니다
 * 3. 결과를 반환합니다
 * 4. 연결을 닫습니다 (finally 블록에서)
 * 
 * [예시]
 * executeQuery("SELECT * FROM LIB_USERS WHERE USERID = :userId", { userId: "hong" })
 * → 사용자 정보를 가져옵니다
 * 
 * @param {string} query - SQL 쿼리 (예: "SELECT * FROM LIB_USERS")
 * @param {Object|Array} binds - 바인딩 변수 (쿼리에 넣을 값들)
 *                          예: { userId: "hong" } 또는 ["hong", "1234"]
 * @param {Object} options - 실행 옵션
 *                      autoCommit: true면 즉시 저장, false면 나중에 저장
 * @returns {Promise<Object>} 쿼리 결과
 */
async function executeQuery(query, binds = {}, options = {}) {
    let connection; // 연결 변수 (나중에 닫기 위해 저장)
    try {
        // 1단계: 데이터베이스 연결 가져오기
        connection = await getConnection();
        
        // 2단계: SQL 쿼리 실행
        // connection.execute(): SQL 쿼리를 실행하는 함수
        // query: 실행할 SQL 쿼리
        // binds: 쿼리에 넣을 값들 (SQL 인젝션 방지를 위해 사용)
        // options: 실행 옵션 (autoCommit 등)
        const result = await connection.execute(query, binds, {
            autoCommit: options.autoCommit || false, // 기본값은 false (자동 저장 안 함)
            ...options // 나머지 옵션들도 전달
        });
        
        // 3단계: 결과 반환
        return result;
    } finally {
        // finally: 에러가 발생해도 무조건 실행되는 블록
        // 연결을 반드시 닫아야 합니다 (메모리 누수 방지)
        if (connection) {
            try {
                // connection.close(): 연결을 닫는 함수
                // 연결을 닫으면 연결 풀로 다시 돌아갑니다
                await connection.close();
            } catch (err) {
                // 연결을 닫는 중 에러가 발생해도 서버가 멈추지 않도록 처리
                console.error("Error closing connection:", err);
            }
        }
    }
}

/**
 * 연결 풀 종료
 * 
 * 서버가 종료될 때 모든 연결을 닫는 함수입니다.
 * 
 * [작동 방식]
 * 1. 연결 풀이 있으면
 * 2. 모든 연결을 닫습니다
 * 3. 연결 풀을 정리합니다
 * 
 * [언제 사용하나요?]
 * - 서버를 종료할 때 (Ctrl+C를 눌렀을 때)
 * - 데이터베이스 연결을 완전히 끊어야 할 때
 */
async function closePool() {
    if (pool) {
        try {
            // pool.close(10): 연결 풀을 닫는 함수
            // 10: 10초 안에 모든 연결을 닫으라는 의미
            await pool.close(10);
            console.log("✅ Connection pool closed");
        } catch (err) {
            console.error("❌ Error closing connection pool:", err);
        }
    }
}

// 이 파일에서 사용할 수 있도록 함수들을 내보냅니다 (export)
module.exports = {
    init,              // 연결 풀 초기화 함수
    getConnection,     // 연결 가져오기 함수
    executeQuery,      // 쿼리 실행 함수
    closePool          // 연결 풀 종료 함수
};
