/**
 * ============================================
 * 데이터베이스 헬퍼 파일 (dbHelper.js)
 * ============================================
 * 
 * 이 파일은 데이터베이스 결과를 쉽게 사용할 수 있게 변환해주는 도우미입니다!
 * 
 * [이 파일이 하는 일]
 * 1. 데이터베이스 결과를 JSON 형식으로 변환합니다
 * 2. 단일 행 결과를 객체로 변환합니다
 * 
 * [왜 필요한가요?]
 * - Oracle 데이터베이스는 결과를 배열 형식으로 반환합니다
 * - 예: [[값1, 값2, 값3], [값4, 값5, 값6]]
 * - 이 형식은 사용하기 불편합니다
 * - JSON 형식으로 변환하면 사용하기 편합니다
 * - 예: [{컬럼1: 값1, 컬럼2: 값2}, {컬럼1: 값4, 컬럼2: 값5}]
 * 
 * [비유로 설명하면]
 * - 이 파일은 번역기와 같습니다
 * - 데이터베이스의 언어(배열)를 JavaScript의 언어(객체)로 번역합니다
 */

/**
 * 데이터베이스 쿼리 결과를 JSON 객체로 변환하는 함수
 * 
 * Oracle 데이터베이스는 결과를 배열 형식으로 반환합니다.
 * 이 함수는 그 배열을 JSON 객체 배열로 변환합니다.
 * 
 * [변환 예시]
 * 입력 (Oracle 형식):
 * {
 *   rows: [["hong", "홍길동", "hong@example.com"], ["kim", "김철수", "kim@example.com"]],
 *   metaData: [{name: "USERID"}, {name: "NAME"}, {name: "EMAIL"}]
 * }
 * 
 * 출력 (JSON 형식):
 * [
 *   { USERID: "hong", NAME: "홍길동", EMAIL: "hong@example.com" },
 *   { USERID: "kim", NAME: "김철수", EMAIL: "kim@example.com" }
 * ]
 * 
 * @param {Object} result - Oracle DB 쿼리 결과
 *                         result.rows: 데이터 행들 (배열의 배열)
 *                         result.metaData: 컬럼 정보 (컬럼 이름 등)
 * @returns {Array} 변환된 JSON 객체 배열
 */
function convertRowsToJson(result) {
  // 결과가 없거나 형식이 잘못되었으면 빈 배열을 반환합니다
  if (!result || !result.rows || !result.metaData) {
    return [];
  }

  // 컬럼 이름들을 배열로 만듭니다
  // metaData: [{name: "USERID"}, {name: "NAME"}, ...]
  // → columnNames: ["USERID", "NAME", ...]
  const columnNames = result.metaData.map(column => column.name);
  
  // 각 행을 JSON 객체로 변환합니다
  // map: 배열의 각 항목을 변환하는 함수
  return result.rows.map(row => {
    // 빈 객체를 만듭니다
    const obj = {};
    
    // 각 컬럼에 대해
    // columnNames.forEach: 컬럼 이름 배열을 하나씩 순회합니다
    // (columnName, index): 컬럼 이름과 인덱스 (0, 1, 2, ...)
    columnNames.forEach((columnName, index) => {
      // obj[columnName] = row[index]
      // 예: obj["USERID"] = row[0] (첫 번째 값)
      // 예: obj["NAME"] = row[1] (두 번째 값)
      obj[columnName] = row[index];
    });
    
    // 변환된 객체를 반환합니다
    return obj;
  });
}

/**
 * 단일 행 결과를 JSON 객체로 변환
 * 
 * 여러 행이 있어도 첫 번째 행만 반환합니다.
 * 행이 없으면 null을 반환합니다.
 * 
 * [사용 예시]
 * - 사용자 정보 조회 (한 명의 정보만 필요할 때)
 * - 로그인 (한 명의 사용자 정보만 필요할 때)
 * 
 * @param {Object} result - Oracle DB 쿼리 결과
 * @returns {Object|null} 변환된 JSON 객체 또는 null (행이 없으면)
 */
function convertSingleRowToJson(result) {
  // convertRowsToJson으로 모든 행을 변환합니다
  const rows = convertRowsToJson(result);
  
  // 첫 번째 행만 반환합니다 (없으면 null)
  return rows.length > 0 ? rows[0] : null;
}

// 이 파일에서 사용할 수 있도록 함수들을 내보냅니다 (export)
module.exports = {
  convertRowsToJson,        // 여러 행을 JSON 배열로 변환
  convertSingleRowToJson    // 단일 행을 JSON 객체로 변환
};
