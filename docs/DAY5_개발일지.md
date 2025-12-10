# DAY 5 개발일지 - 소셜 로그인 기능 구현

**날짜**: 2025년 9월 16일  
**목표**: 카카오, 네이버, 구글 소셜 로그인 기능 구현

---

## 📋 오늘의 목표

1. 소셜 로그인 라우트 설정
2. 카카오 로그인 구현
3. 네이버 로그인 구현
4. 구글 로그인 구현
5. 소셜 로그인 사용자 데이터베이스 저장 로직

---

## ✅ 완료 작업

### 1. 소셜 로그인 라우트 설정

#### auth.js 라우터 생성
- `/auth/kakao` - 카카오 로그인 시작
- `/auth/kakao/callback` - 카카오 로그인 콜백
- `/auth/naver` - 네이버 로그인 시작
- `/auth/naver/callback` - 네이버 로그인 콜백
- `/auth/google` - 구글 로그인 시작
- `/auth/google/callback` - 구글 로그인 콜백

### 2. 카카오 로그인 구현

#### OAuth 2.0 플로우
1. 사용자를 카카오 로그인 페이지로 리다이렉트
2. 카카오에서 인증 코드 발급
3. 인증 코드로 액세스 토큰 요청
4. 액세스 토큰으로 사용자 정보 요청
5. 사용자 정보를 데이터베이스에 저장/조회
6. JWT 토큰 생성 후 메인 페이지로 리다이렉트

#### 주요 기능
- `prompt=login` 파라미터 추가 (항상 로그인 화면 표시)
- 이메일은 선택적 (없을 수 있음)
- 닉네임 필수

### 3. 네이버 로그인 구현

#### OAuth 2.0 플로우
1. state 값 생성 (CSRF 방지)
2. 세션에 state 저장
3. 사용자를 네이버 로그인 페이지로 리다이렉트
4. 네이버에서 인증 코드 및 state 반환
5. state 검증
6. 인증 코드로 액세스 토큰 요청
7. 액세스 토큰으로 사용자 정보 요청
8. 사용자 정보를 데이터베이스에 저장/조회
9. JWT 토큰 생성 후 메인 페이지로 리다이렉트

#### 주요 기능
- state 값으로 CSRF 공격 방지
- 세션을 통한 state 관리
- 이메일 기본 제공

### 4. 구글 로그인 구현

#### OAuth 2.0 플로우
1. 사용자를 구글 로그인 페이지로 리다이렉트
2. 구글에서 인증 코드 발급
3. 인증 코드로 액세스 토큰 요청
4. 액세스 토큰으로 사용자 정보 요청
5. 사용자 정보를 데이터베이스에 저장/조회
6. JWT 토큰 생성 후 메인 페이지로 리다이렉트

#### 주요 기능
- `scope=openid email profile` 설정
- `prompt=login` 파라미터 추가
- 이메일 기본 제공

### 5. 소셜 로그인 사용자 저장 로직

#### findOrCreateSocialUser 함수
- 소셜 사용자 ID 형식: `{provider}_{providerId}`
- 소셜 ID로 먼저 조회
- 없으면 이메일로 조회 (기존 회원가입 사용자와 연결)
- 둘 다 없으면 새 사용자 생성
- 소셜 로그인용 랜덤 비밀번호 생성

---

## 🛠 기술적 구현

### 카카오 로그인 시작
```javascript
const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${config.social.kakao.clientId}&redirect_uri=${config.social.kakao.redirectUri}&response_type=code&prompt=login`;
res.redirect(kakaoAuthUrl);
```

### 카카오 토큰 요청
```javascript
const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
  params: {
    grant_type: 'authorization_code',
    client_id: config.social.kakao.clientId,
    client_secret: config.social.kakao.clientSecret,
    redirect_uri: config.social.kakao.redirectUri,
    code: code
  },
  headers: {
    'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
  }
});
```

### 네이버 state 생성 및 저장
```javascript
const state = Math.random().toString(36).substring(2, 15);
if (req.session) {
  req.session.naverState = state;
}
```

### 소셜 사용자 조회/생성
```javascript
async function findOrCreateSocialUser(provider, providerId, email, name) {
  const userId = `${provider}_${providerId.substring(0, 20)}`;
  
  // 소셜 ID로 먼저 조회
  let query = `SELECT USERID, NAME, EMAIL, PHONE, ADDRESS FROM LIB_USERS WHERE USERID = :userId`;
  let result = await db.executeQuery(query, { userId });
  
  if (result.rows.length > 0) {
    return convertUserRow(result.rows[0]);
  }
  
  // 이메일로 조회 (기존 회원가입 사용자와 연결)
  if (email) {
    query = `SELECT USERID, NAME, EMAIL, PHONE, ADDRESS FROM LIB_USERS WHERE EMAIL = :email`;
    result = await db.executeQuery(query, { email });
    
    if (result.rows.length > 0) {
      return convertUserRow(result.rows[0]);
    }
  }
  
  // 새 사용자 생성
  const randomPassword = Math.random().toString(36).slice(-12);
  const hashedPassword = await hashPassword(randomPassword);
  
  await db.executeQuery(
    `INSERT INTO LIB_USERS (USERID, PASSWORD, NAME, EMAIL, PHONE, ADDRESS)
     VALUES (:1, :2, :3, :4, :5, :6)`,
    [userId, hashedPassword, name, email || '', '', ''],
    { autoCommit: true }
  );
  
  return { USERID: userId, NAME: name, EMAIL: email || '', PHONE: '', ADDRESS: '' };
}
```

---

## 🐛 주요 이슈 및 해결

### 이슈 1: OAuth 2.0 플로우 이해
**문제**:  
- OAuth 2.0 인증 플로우가 복잡함
- 각 소셜 사이트마다 다른 API 형식

**해결 과정**:
1. OAuth 2.0 표준 문서 학습
2. 각 소셜 사이트의 개발자 문서 참고
3. 단계별로 구현 및 테스트

### 이슈 2: 네이버 state 관리
**문제**:  
- CSRF 공격 방지를 위한 state 값 관리
- 세션이 없을 수 있음

**해결 과정**:
1. 세션에 state 저장
2. 콜백에서 state 검증
3. 세션이 없어도 경고만 하고 진행 (개발 환경)

### 이슈 3: 소셜 사용자 ID 형식
**문제**:  
- 각 소셜 사이트의 사용자 ID 형식이 다름
- 데이터베이스 제한 고려

**해결 과정**:
1. `{provider}_{providerId}` 형식으로 통일
2. providerId가 너무 길면 20자로 제한
3. 기존 회원가입 사용자와 이메일로 연결

---

## 📝 코드 구조

### 추가된 파일
- `server/routes/auth.js` - 소셜 로그인 라우터

### 추가된 API 엔드포인트
- `GET /auth/kakao` - 카카오 로그인 시작
- `GET /auth/kakao/callback` - 카카오 로그인 콜백
- `GET /auth/naver` - 네이버 로그인 시작
- `GET /auth/naver/callback` - 네이버 로그인 콜백
- `GET /auth/google` - 구글 로그인 시작
- `GET /auth/google/callback` - 구글 로그인 콜백

---

## 💡 배운 점

1. **OAuth 2.0 인증 플로우**
   - Authorization Code Grant 방식
   - 인증 코드 → 액세스 토큰 → 사용자 정보

2. **CSRF 방지**
   - state 값으로 CSRF 공격 방지
   - 세션을 통한 state 관리

3. **소셜 로그인 사용자 관리**
   - 소셜 사용자 ID 형식 통일
   - 기존 회원가입 사용자와 연결

---

## 📊 작업 통계

- **구현한 API 엔드포인트**: 6개
- **작성한 코드 라인 수**: 약 300줄

---

## 🎯 내일 계획

1. 프론트엔드 소셜 로그인 버튼 추가
2. 소셜 로그인 콜백 처리 (토큰 저장)
3. 소셜 로그인 UI/UX 개선
4. 에러 처리 개선
5. 환경 변수 설정 가이드 작성

---

**작성일**: 2025년 9월 16일
