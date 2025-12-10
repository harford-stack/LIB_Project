# DAY 4 개발일지 - 예약 내역 조회 및 취소 기능

**날짜**: 2025년 9월 15일  
**목표**: 예약 내역 조회, 예약 취소, 활성 예약 확인 기능 구현

---

## 📋 오늘의 목표

1. 예약 내역 조회 API 구현
2. 예약 취소 기능 구현
3. 활성 예약 확인 API 구현
4. 프론트엔드 예약 내역 페이지 구현
5. 예약 취소 로직 개선

---

## ✅ 완료 작업

### 1. 예약 내역 조회 API

#### 내 예약 내역 조회
- **엔드포인트**: `GET /myreservations`
- **기능**:
  - JWT 토큰 인증 필요
  - 로그인한 사용자의 모든 예약 내역 조회
  - 좌석 정보, 좌석 유형 정보 JOIN
  - 최신순 정렬 (RESVDATE DESC, START_HOUR DESC)
  - 예약 상태, 예약 시간 포함

### 2. 예약 취소 기능

#### 예약 취소 API
- **엔드포인트**: `GET /cancel-reservation?resvNo={resvNo}`
- **기능**:
  - JWT 토큰 인증 필요
  - 본인의 예약만 취소 가능 (권한 확인)
  - 예약 상태를 'CANCELED'로 변경
  - 이미 종료된 예약은 취소 불가
  - 이미 취소된 예약 체크

### 3. 활성 예약 확인 API

#### 활성 예약 조회
- **엔드포인트**: `GET /user/active-reservations`
- **기능**:
  - JWT 토큰 인증 필요
  - 사용자의 활성 예약 개수 확인
  - 활성 예약 존재 여부 반환
  - 프론트엔드에서 예약 가능 여부 판단에 사용

### 4. 프론트엔드 구현

#### 예약 내역 페이지 (LIB_MyReservations.html)
- 모든 예약 내역 표시
- 예약 상태별 필터링 (전체/확정/취소)
- 예약 취소 버튼
- 예약 정보 상세 표시

#### 예약 페이지 개선
- 활성 예약 확인 로직 추가
- 활성 예약이 있으면 예약 불가 안내
- 예약 상태 확인 후 UI 활성화/비활성화

---

## 🛠 기술적 구현

### 예약 내역 조회 (JOIN 사용)
```javascript
const result = await db.executeQuery(
  `SELECT 
      R.RESVNO, R.USERID, R.SEATNO, TO_CHAR(R.RESVDATE, 'YYYY-MM-DD') AS RESVDATE, 
      R.START_HOUR, R.END_HOUR, R.TOTALPRICE, R.RESVSTATUS, 
      TO_CHAR(R.RESVTIME, 'YYYY-MM-DD HH24:MI:SS') AS RESVTIME, 
      S.LOCATION, S.SEAT_NOTES, T.TYPENAME
   FROM LIB_RESERVATIONS R
   JOIN LIB_SEATS S ON R.SEATNO = S.SEATNO
   JOIN LIB_SEAT_TYPES T ON S.TYPENO = T.TYPENO
   WHERE R.USERID = :userId
   ORDER BY R.RESVDATE DESC, R.START_HOUR DESC`,
  { userId: userId }
);
```

### 예약 취소 로직
```javascript
// 예약 종료 시간이 지났는지 확인
const now = new Date();
const endDate = new Date(resvDate);
endDate.setHours(endHour);

if (endDate <= now) {
  return res.status(409).json({ 
    success: false, 
    message: '이미 종료된 예약은 취소할 수 없습니다.' 
  });
}

// 예약 상태를 'CANCELED'로 변경
const result = await db.executeQuery(
  `UPDATE LIB_RESERVATIONS SET RESVSTATUS = 'CANCELED' WHERE RESVNO = :resvNo`,
  { resvNo: resvNo },
  { autoCommit: true }
);
```

### 활성 예약 확인
```javascript
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

res.json({ 
  success: true, 
  hasActiveReservation: activeCount > 0,
  activeCount: activeCount
});
```

---

## 🐛 주요 이슈 및 해결

### 이슈 1: 예약 취소 시점 판단
**문제**:  
- 예약 종료 시간이 지났는지 정확히 판단해야 함
- 날짜와 시간을 모두 고려해야 함

**해결 과정**:
1. JavaScript Date 객체로 현재 시간과 종료 시간 비교
2. 종료 시간이 지났으면 취소 불가
3. 에러 메시지 명확히 표시

### 이슈 2: 예약 내역 JOIN 쿼리
**문제**:  
- 여러 테이블을 JOIN해서 정보를 가져와야 함
- 날짜 형식 변환 필요

**해결 과정**:
1. LIB_RESERVATIONS, LIB_SEATS, LIB_SEAT_TYPES JOIN
2. TO_CHAR 함수로 날짜 형식 변환
3. 필요한 정보만 선택적으로 가져오기

### 이슈 3: 활성 예약 확인 타이밍
**문제**:  
- 프론트엔드에서 예약 가능 여부를 미리 확인해야 함
- API 호출 타이밍 최적화 필요

**해결 과정**:
1. 예약 페이지 진입 시 활성 예약 확인
2. 활성 예약이 있으면 예약 UI 비활성화
3. 사용자에게 명확한 안내 메시지 표시

---

## 📝 코드 구조

### 추가된 API 엔드포인트
- `GET /myreservations` - 예약 내역 조회
- `GET /cancel-reservation` - 예약 취소
- `GET /user/active-reservations` - 활성 예약 확인

### 프론트엔드 페이지
- `LIB_MyReservations.html` - 예약 내역 페이지

---

## 💡 배운 점

1. **JOIN 쿼리 활용**
   - 여러 테이블을 연결해서 정보 가져오기
   - 날짜 형식 변환 (TO_CHAR)

2. **예약 취소 로직**
   - 종료된 예약은 취소 불가
   - 상태 변경으로 취소 처리

3. **활성 예약 개념**
   - 현재 시간 기준으로 활성 예약 판단
   - 프론트엔드에서 예약 가능 여부 판단에 활용

---

## 📊 작업 통계

- **구현한 API 엔드포인트**: 3개
- **작성한 프론트엔드 페이지**: 1개
- **코드 라인 수**: 약 500줄

---

## 🎯 내일 계획

1. 소셜 로그인 기능 구현 (카카오, 네이버, 구글)
2. 소셜 로그인 라우트 설정
3. OAuth 2.0 인증 플로우 구현
4. 프론트엔드 소셜 로그인 버튼 추가
5. 소셜 로그인 사용자 데이터베이스 저장

---

**작성일**: 2025년 9월 15일
