# DAY 2 개발일지 - 사용자 정보 관리 및 좌석 조회 기능

**날짜**: 2025년 9월 13일  
**목표**: 사용자 정보 관리 기능 및 좌석 조회 API 구현

---

## 📋 오늘의 목표

1. 사용자 정보 조회/수정 API 구현
2. 회원 탈퇴 기능 구현
3. 좌석 유형 및 좌석 정보 조회 API 구현
4. 예약 상태 확인 로직 구현
5. 프론트엔드 사용자 정보 페이지 구현

---

## ✅ 완료 작업

### 1. 사용자 정보 관리 API

#### 사용자 정보 조회
- **엔드포인트**: `GET /lib/userInfo`
- **기능**:
  - JWT 토큰 인증 필요
  - 로그인한 사용자의 정보 조회
  - 비밀번호 제외한 사용자 정보 반환

#### 사용자 정보 수정
- **엔드포인트**: `GET /lib/updateUserInfo`
- **기능**:
  - JWT 토큰 인증 필요
  - 본인 정보만 수정 가능 (권한 확인)
  - 기존 비밀번호 확인 필수
  - 새 비밀번호 입력 시 비밀번호 변경
  - 이메일/전화번호 형식 검증
  - 정보 업데이트 처리

#### 회원 탈퇴
- **엔드포인트**: `GET /lib/withdraw`
- **기능**:
  - JWT 토큰 인증 필요
  - 본인만 탈퇴 가능 (권한 확인)
  - 비밀번호 확인 필수
  - 사용자 정보 삭제

### 2. 좌석 정보 조회 API

#### 좌석 유형 조회
- **엔드포인트**: `GET /seattypes`
- **기능**:
  - 모든 좌석 유형 정보 조회
  - 유형별 가격 및 설명 포함
  - 정렬: TYPENO 순서

#### 좌석 정보 및 예약 상태 조회
- **엔드포인트**: `GET /seats?date={date}&startHour={startHour}&endHour={endHour}`
- **기능**:
  - 특정 날짜/시간대의 좌석 정보 조회
  - 예약된 좌석은 'OCCUPIED' 상태로 표시
  - 예약 가능한 좌석은 'AVAILABLE' 상태로 표시
  - 시간대 겹침 체크 로직 구현

### 3. 예약 상태 확인 로직

#### 시간대 겹침 체크
- 시작 시간과 종료 시간이 겹치는 예약 확인
- SQL 쿼리 최적화:
  ```sql
  WHERE (START_HOUR < :endHour AND END_HOUR > :startHour)
     OR (START_HOUR = :startHour AND END_HOUR = :endHour)
  ```

### 4. 프론트엔드 구현

#### 내 정보 페이지 (LIB_MyPage.html)
- 사용자 정보 표시
- 정보 수정 폼
- 비밀번호 변경 기능
- 회원 탈퇴 기능

#### 에러 처리 개선
- 인라인 에러 메시지 표시
- 입력 검증 실시간 피드백

---

## 🛠 기술적 구현

### 권한 확인 로직
```javascript
// 본인만 수정 가능하도록 확인
if (req.user.userId !== userId) {
  return res.status(403).json({ 
    success: false, 
    message: '본인의 정보만 수정할 수 있습니다.' 
  });
}
```

### 비밀번호 확인 로직
```javascript
// 기존 비밀번호 일치 여부 확인
const isValidPassword = await verifyPassword(storedHashedPassword, currentPassword);
if (!isValidPassword) {
  return res.json({ 
    success: false, 
    message: '기존 비밀번호가 일치하지 않습니다.' 
  });
}
```

### 좌석 예약 상태 확인
```javascript
// 예약된 좌석 번호 추출
const reservedSeatNumbers = reservedSeatsResult.rows.map(row => row[0]);

// 좌석 상태 반영
const finalSeats = allSeats.map(seat => {
  if (reservedSeatNumbers.includes(seat[0])) {
    return [seat[0], seat[1], seat[2], 'OCCUPIED', seat[4], seat[5]];
  } else {
    return seat;
  }
});
```

---

## 🐛 주요 이슈 및 해결

### 이슈 1: 비밀번호 변경 로직
**문제**:  
- 비밀번호 변경 시 기존 비밀번호 확인 필요
- 새 비밀번호가 없을 때도 처리해야 함

**해결 과정**:
1. 조건부 업데이트 쿼리 구현
2. 새 비밀번호가 있을 때만 비밀번호 업데이트
3. 기존 비밀번호 확인 로직 추가

### 이슈 2: 좌석 예약 상태 표시
**문제**:  
- 시간대가 겹치는 예약을 정확히 찾아야 함
- SQL 쿼리 최적화 필요

**해결 과정**:
1. 시간대 겹침 로직 수정
2. DISTINCT로 중복 제거
3. 예약 상태를 'OCCUPIED'로 명확히 표시

### 이슈 3: 권한 확인
**문제**:  
- 다른 사용자의 정보를 수정할 수 있는 보안 취약점

**해결 과정**:
1. JWT 토큰에서 userId 추출
2. 요청 userId와 토큰 userId 비교
3. 불일치 시 403 에러 반환

---

## 📝 코드 구조

### 추가된 API 엔드포인트
- `GET /lib/userInfo` - 사용자 정보 조회
- `GET /lib/updateUserInfo` - 사용자 정보 수정
- `GET /lib/withdraw` - 회원 탈퇴
- `GET /seattypes` - 좌석 유형 조회
- `GET /seats` - 좌석 정보 및 예약 상태 조회

### 프론트엔드 페이지
- `LIB_MyPage.html` - 내 정보 페이지

---

## 💡 배운 점

1. **권한 관리**
   - JWT 토큰을 통한 사용자 인증
   - 본인 정보만 수정 가능하도록 권한 확인

2. **조건부 업데이트**
   - SQL 쿼리에서 조건부로 컬럼 업데이트
   - 비밀번호 변경 선택적 처리

3. **시간대 겹침 체크**
   - 예약 시간대가 겹치는지 확인하는 로직
   - SQL 쿼리 최적화

---

## 📊 작업 통계

- **구현한 API 엔드포인트**: 5개
- **작성한 프론트엔드 페이지**: 1개
- **코드 라인 수**: 약 600줄

---

## 🎯 내일 계획

1. 좌석 예약 API 구현
2. 1인 1예약 체크 로직 구현
3. 예약 내역 조회 API 구현
4. 예약 취소 기능 구현
5. 프론트엔드 예약 페이지 기본 구조

---

**작성일**: 2025년 9월 13일
