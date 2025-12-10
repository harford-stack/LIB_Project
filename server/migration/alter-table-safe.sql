-- ============================================
-- LIB_USERS 테이블 구조 수정 스크립트 (안전 버전)
-- 소셜 로그인 및 비밀번호 해싱 지원을 위한 수정
-- ============================================

-- 1. PASSWORD 컬럼 크기 확장 (argon2 해시 지원)
--    현재: VARCHAR2(100 BYTE)
--    변경: VARCHAR2(300 BYTE)
ALTER TABLE SYSTEM.LIB_USERS 
MODIFY (PASSWORD VARCHAR2(300 BYTE));

-- 2. EMAIL NOT NULL 제약조건 제거 (소셜 로그인 사용자는 이메일이 없을 수 있음)
--    오류 발생 시: 이미 NULL이거나 제약조건이 다른 곳에 있을 수 있음
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE SYSTEM.LIB_USERS MODIFY (EMAIL NULL)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -1451 THEN
            DBMS_OUTPUT.PUT_LINE('EMAIL은 이미 NULL을 허용합니다.');
        ELSE
            RAISE;
        END IF;
END;
/

-- 3. PHONE NOT NULL 제약조건 제거 (소셜 로그인 사용자는 전화번호가 없을 수 있음)
--    오류 발생 시: 이미 NULL이거나 제약조건이 다른 곳에 있을 수 있음
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE SYSTEM.LIB_USERS MODIFY (PHONE NULL)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -1451 THEN
            DBMS_OUTPUT.PUT_LINE('PHONE은 이미 NULL을 허용합니다.');
        ELSE
            RAISE;
        END IF;
END;
/

-- ============================================
-- 변경 사항 확인
-- ============================================
SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'LIB_USERS'
ORDER BY COLUMN_ID;

