# DAY 1 개발일지 - 프로젝트 초기 설정 및 기본 구조

**날짜**: 2025년 9월 12일  
**목표**: 프로젝트 환경 구축 및 기본 인증 시스템 구현

---

## 📋 오늘의 목표

1. 프로젝트 초기 구조 설정
2. Node.js/Express 백엔드 서버 구축
3. Oracle 데이터베이스 연결 설정
4. 기본 인증 시스템 구현 (회원가입, 로그인)
5. Vue.js 프론트엔드 기본 구조 설정

---

## ✅ 완료 작업

### 1. 프로젝트 초기화

#### Backend 설정
- Node.js 프로젝트 초기화
- 필요한 패키지 설치:
  - `express` - 웹 프레임워크
  - `oracledb` - Oracle 데이터베이스 드라이버
  - `jsonwebtoken` - JWT 토큰 생성/검증
  - `argon2` - 비밀번호 해싱
  - `dotenv` - 환경 변수 관리
  - `cors` - CORS 설정
  - `express-session` - 세션 관리 (소셜 로그인용)

#### Frontend 설정
- Vue.js 프로젝트 구조 설정
- 필요한 라이브러리:
  - Vue.js 2.x
  - jQuery (AJAX 통신)
  - CSS 파일 구조화

### 2. 데이터베이스 설계

#### 테이블 구조
1. **LIB_USERS** (사용자 테이블)
   - USERID (VARCHAR, PK)
   - PASSWORD (VARCHAR) - 해싱된 비밀번호
   - NAME (VARCHAR)
   - EMAIL (VARCHAR)
   - PHONE (VARCHAR)
   - ADDRESS (VARCHAR)

2. **LIB_SEATS** (좌석 테이블)
   - SEATNO (NUMBER, PK)
   - TYPENO (NUMBER, FK)
   - CAPACITY (NUMBER)
   - SEATSTATUS (VARCHAR)
   - LOCATION (VARCHAR)
   - SEAT_NOTES (VARCHAR)

3. **LIB_SEAT_TYPES** (좌석 유형 테이블)
   - TYPENO (NUMBER, PK)
   - TYPENAME (VARCHAR)
   - PRICE (NUMBER)
   - DESCRIPTION (VARCHAR)

4. **LIB_RESERVATIONS** (예약 테이블)
   - RESVNO (NUMBER, PK)
   - USERID (VARCHAR, FK)
   - SEATNO (NUMBER, FK)
   - RESVDATE (DATE)
   - START_HOUR (NUMBER)
   - END_HOUR (NUMBER)
   - TOTALPRICE (NUMBER)
   - RESVSTATUS (VARCHAR)
   - RESVTIME (DATE)

### 3. 백엔드 서버 구축

#### Express 서버 설정
- 기본 Express 앱 생성
- CORS 미들웨어 설정
- JSON 파싱 미들웨어 설정
- 환경 변수 관리 (.env 파일)
- Oracle 데이터베이스 연결 풀 설정

#### 라우터 구조
- `/lib/login` - 로그인 API
- `/lib/join` - 회원가입 API
- `/lib/checkId` - 아이디 중복 확인 API
- `/lib/findId` - 아이디 찾기 API
- `/lib/resetPwd` - 비밀번호 재설정 API

### 4. 사용자 인증 시스템 구현

#### 회원가입 기능
- **엔드포인트**: `GET /lib/join`
- **기능**:
  - 아이디, 비밀번호, 이름, 이메일 입력 검증
  - 이메일/전화번호 형식 검증
  - 비밀번호 해싱 (argon2)
  - 아이디 중복 체크
  - 사용자 정보 데이터베이스 저장

#### 로그인 기능
- **엔드포인트**: `GET /lib/login`
- **기능**:
  - 아이디/비밀번호 검증
  - 비밀번호 해싱 검증
  - JWT 토큰 생성 (만료 시간: 7일)
  - 사용자 정보 반환 (비밀번호 제외)

#### JWT 토큰 관리
- 토큰 생성 함수 (`generateToken`)
- 토큰 검증 미들웨어 (`authenticateToken`)
- 환경 변수로 JWT_SECRET 관리

### 5. 인증 미들웨어 구현

#### authenticateToken 미들웨어
- 요청 헤더에서 토큰 추출
- JWT 토큰 검증
- 사용자 정보를 `req.user`에 저장

---

## 🛠 기술 스택 선정

### Frontend
- **Vue.js 2.x**: 프론트엔드 프레임워크
- **jQuery**: AJAX 통신 및 DOM 조작
- **CSS**: 모바일 전용 반응형 디자인

### Backend
- **Node.js**: 서버 런타임
- **Express**: 웹 프레임워크
- **Oracle Database**: 관계형 데이터베이스
- **JWT**: 인증 토큰
- **argon2**: 비밀번호 해싱

---

## 🐛 주요 이슈 및 해결

### 이슈 1: Oracle 데이터베이스 연결 문제
**문제**:  
- Oracle Instant Client 설치 필요
- 연결 풀 초기화 실패

**해결 과정**:
1. Oracle Instant Client 설치 및 환경 변수 설정
2. 연결 풀 설정 최적화
3. 에러 핸들링 추가

### 이슈 2: 비밀번호 해싱 라이브러리 선택
**문제**:  
- bcrypt vs argon2 선택 고민

**해결 과정**:
1. 보안성과 성능 비교
2. argon2 선택 (더 안전한 해싱 알고리즘)
3. 비밀번호 해싱/검증 함수 구현

### 이슈 3: 환경 변수 관리
**문제**:  
- 하드코딩된 값들 (포트, 데이터베이스 정보 등)
- 보안 문제 (비밀번호, API 키 노출)

**해결 과정**:
1. `.env` 파일 생성
2. `dotenv` 패키지로 환경 변수 로드
3. `.gitignore`에 `.env` 추가
4. `config.js` 파일로 설정 중앙화

---

## 📝 코드 구조

### Backend 구조
```
server/
├── config.js              # 설정 파일
├── db.js                  # 데이터베이스 연결
├── server.js              # 서버 진입점
├── middleware/
│   └── auth.js           # 인증 미들웨어
├── utils/
│   ├── passwordHash.js   # 비밀번호 해싱
│   ├── validators.js     # 입력 검증
│   └── errorHandler.js   # 에러 처리
└── .env                   # 환경 변수
```

### Frontend 구조
```
client/
├── LIB_Login.html        # 로그인 페이지
├── LIB_Join.html         # 회원가입 페이지
├── LIB_Main.html         # 메인 페이지
├── js/
│   ├── config.js        # API 설정
│   └── common.js        # 공통 함수
└── css/
    └── LIB_Style1.css   # 스타일시트
```

---

## 💡 배운 점

1. **Oracle 데이터베이스 연결**
   - Oracle Instant Client 설정 방법
   - 연결 풀 관리

2. **argon2 비밀번호 해싱**
   - 비동기 해싱/검증
   - 보안성 향상

3. **JWT 토큰 기반 인증**
   - 토큰 생성 및 검증 과정
   - 미들웨어를 통한 인증 처리

4. **환경 변수 관리**
   - `.env` 파일을 통한 보안 관리
   - 설정 파일 중앙화

---

## 📊 작업 통계

- **작성한 파일 수**: 약 10개
- **코드 라인 수**: 약 800줄
- **구현한 API 엔드포인트**: 5개 (로그인, 회원가입, 아이디 중복 확인, 아이디 찾기, 비밀번호 재설정)
- **생성한 데이터베이스 테이블**: 4개 (USERS, SEATS, SEAT_TYPES, RESERVATIONS)

---

## 🎯 내일 계획

1. 사용자 정보 조회/수정 API 구현
2. 회원 탈퇴 기능 구현
3. 좌석 정보 조회 API 구현
4. 예약 기능 기본 구조 구현
5. 프론트엔드 로그인/회원가입 페이지 완성

---

**작성일**: 2025년 9월 12일
