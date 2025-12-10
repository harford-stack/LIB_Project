# DAY 6 개발일지 - 소셜 로그인 프론트엔드 및 보안 강화

**날짜**: 2025년 9월 17일  
**목표**: 소셜 로그인 프론트엔드 구현 및 보안 기능 강화

---

## 📋 오늘의 목표

1. 프론트엔드 소셜 로그인 버튼 추가
2. 소셜 로그인 콜백 처리 (토큰 저장)
3. JWT 토큰 관리 개선
4. 비밀번호 해싱 마이그레이션
5. 서버 사이드 검증 강화

---

## ✅ 완료 작업

### 1. 프론트엔드 소셜 로그인 구현

#### 로그인 페이지 소셜 로그인 버튼
- 카카오 로그인 버튼
- 네이버 로그인 버튼
- 구글 로그인 버튼
- 각 소셜 사이트의 브랜드 색상 적용
- SVG 아이콘 추가

#### 소셜 로그인 함수
- `socialLogin(provider)` 함수 구현
- 각 소셜 로그인 URL로 리다이렉트
- 에러 처리

### 2. 소셜 로그인 콜백 처리

#### 메인 페이지 콜백 처리
- URL 파라미터에서 토큰과 사용자 정보 추출
- `auth.js`의 `saveAuth` 함수로 토큰 저장
- 중복 처리 방지 로직
- 에러 메시지 표시

#### auth.js 개선
- `saveAuth(token, user)` 함수 구현
- `getAuth()` 함수 구현
- `getToken()` 함수 구현
- `redirectToLogin()` 함수 구현
- localStorage를 통한 토큰 관리

### 3. JWT 토큰 관리 개선

#### 토큰 저장/조회
- localStorage에 토큰과 사용자 정보 저장
- 페이지 로드 시 토큰 복원
- 토큰 만료 시 자동 로그아웃

#### 토큰 검증
- API 요청 시 토큰 자동 포함
- 토큰 만료 시 로그인 페이지로 리다이렉트

### 4. 비밀번호 해싱 마이그레이션

#### 기존 비밀번호 해싱
- 평문 비밀번호를 argon2로 해싱
- 마이그레이션 스크립트 작성
- 기존 사용자 비밀번호 업데이트

### 5. 서버 사이드 검증 강화

#### 입력 검증
- 이메일 형식 검증
- 전화번호 형식 검증
- 필수 필드 검증
- SQL 인젝션 방지

#### 에러 처리 개선
- 구조화된 에러 응답
- 에러 메시지 명확화
- 로깅 개선

---

## 🛠 기술적 구현

### 소셜 로그인 버튼
```html
<button @click="socialLogin('kakao')" class="social-btn social-btn-kakao">
  <svg class="social-btn-icon">...</svg>
  <span>카카오로 시작하기</span>
</button>
```

### 소셜 로그인 함수
```javascript
socialLogin(provider) {
  if (window.startSocialLogin) {
    window.startSocialLogin(provider);
  } else {
    // 직접 리다이렉트
    const baseUrl = 'http://localhost:3009';
    window.location.href = `${baseUrl}/auth/${provider}`;
  }
}
```

### 콜백 처리
```javascript
mounted() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userStr = urlParams.get('user');
  const error = urlParams.get('error');
  
  if (error) {
    alert('로그인 실패: ' + decodeURIComponent(error));
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  if (token && userStr) {
    try {
      const user = JSON.parse(decodeURIComponent(userStr));
      if (window.saveAuth) {
        window.saveAuth(token, user);
      }
      this.sessionId = user.USERID;
      this.userName = user.NAME;
      window.history.replaceState({}, document.title, window.location.pathname);
      alert(`${user.NAME}님 환영합니다!`);
    } catch (e) {
      console.error('소셜 로그인 처리 오류:', e);
    }
  }
}
```

### auth.js 구현
```javascript
function saveAuth(token, user) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function getAuth() {
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');
  if (token && userStr) {
    return { token, user: JSON.parse(userStr) };
  }
  return null;
}

function getToken() {
  return localStorage.getItem('authToken');
}
```

---

## 🐛 주요 이슈 및 해결

### 이슈 1: 소셜 로그인 콜백 중복 처리
**문제**:  
- 페이지 새로고침 시 중복 alert 발생
- 토큰이 이미 저장되어 있어도 다시 처리

**해결 과정**:
1. 이미 처리된 토큰인지 확인
2. 토큰이 같으면 중복 처리 스킵
3. URL 파라미터 제거

### 이슈 2: 토큰 관리
**문제**:  
- 여러 페이지에서 토큰을 일관되게 관리해야 함
- 토큰 만료 처리

**해결 과정**:
1. `auth.js` 파일로 토큰 관리 중앙화
2. 모든 페이지에서 `auth.js` 사용
3. API 요청 시 토큰 자동 포함

### 이슈 3: 비밀번호 마이그레이션
**문제**:  
- 기존 평문 비밀번호를 해싱해야 함
- 마이그레이션 중 서비스 중단 없이 처리

**해결 과정**:
1. 마이그레이션 스크립트 작성
2. 배치로 비밀번호 해싱
3. 기존 사용자 로그인 테스트

---

## 📝 코드 구조

### 추가된 파일
- `client/js/auth.js` - 인증 관리 유틸리티
- `server/migration/password-migration.js` - 비밀번호 마이그레이션 스크립트

### 수정된 파일
- `client/LIB_Login.html` - 소셜 로그인 버튼 추가
- `client/LIB_Main.html` - 콜백 처리 추가
- `client/LIB_Reservation.html` - 토큰 관리 개선

---

## 💡 배운 점

1. **소셜 로그인 구현**
   - OAuth 2.0 콜백 처리
   - 토큰 저장 및 관리

2. **토큰 관리 중앙화**
   - 공통 유틸리티 파일로 관리
   - 일관된 토큰 처리

3. **비밀번호 마이그레이션**
   - 기존 데이터 마이그레이션 방법
   - 서비스 중단 없이 처리

---

## 📊 작업 통계

- **작성한 파일**: 2개
- **수정한 파일**: 3개
- **코드 라인 수**: 약 400줄

---

## 🎯 내일 계획

1. API 문서 작성 (Swagger)
2. 에러 처리 개선
3. 코드 리팩토링
4. 주석 추가
5. 테스트 및 버그 수정

---

**작성일**: 2025년 9월 17일
