# DAY 3 개발일지 - 좌석 예약 기능 구현

**날짜**: 2025년 9월 14일  
**목표**: 좌석 예약 API 및 1인 1예약 체크 로직 구현

---

## 📋 오늘의 목표

1. 좌석 예약 API 구현
2. 1인 1예약 체크 로직 구현
3. 중복 예약 방지 로직 구현
4. 예약 번호 생성 로직 구현
5. 프론트엔드 예약 페이지 기본 구조

---

## ✅ 완료 작업

### 1. 좌석 예약 API 구현

#### 예약 처리 API
- **엔드포인트**: `GET /reservation`
- **기능**:
  - JWT 토큰 인증 필요
  - 좌석 번호, 날짜, 시간, 가격 정보 받기
  - 1인 1예약 체크
  - 중복 예약 체크
  - 예약 정보 데이터베이스 저장

### 2. 1인 1예약 체크 로직

#### 활성 예약 확인
- 현재 날짜/시간 기준으로 활성 예약 확인
- 활성 예약: 아직 시작하지 않았거나 진행 중인 예약
- SQL 쿼리:
  ```sql
  WHERE RESVSTATUS = 'CONFIRMED'
    AND (
      TRUNC(RESVDATE) > TRUNC(SYSDATE) 
      OR (
        TRUNC(RESVDATE) = TRUNC(SYSDATE) 
        AND END_HOUR > TO_NUMBER(TO_CHAR(SYSDATE, 'HH24'))
      )
    )
  ```

### 3. 중복 예약 방지 로직

#### 시간대 겹침 체크
- 같은 좌석, 같은 날짜에 시간대가 겹치는 예약 확인
- SQL 쿼리:
  ```sql
  WHERE SEATNO = :seatNo
    AND RESVDATE = TO_DATE(:resvDate, 'YYYY-MM-DD')
    AND (
      (START_HOUR <= :endHour AND END_HOUR >= :startHour)
      OR (START_HOUR >= :startHour AND START_HOUR < :endHour)
      OR (END_HOUR > :startHour AND END_HOUR <= :endHour)
    )
    AND RESVSTATUS = 'CONFIRMED'
  ```

### 4. 예약 번호 생성

#### 시퀀스 또는 MAX+1 사용
- 시퀀스가 있으면 시퀀스 사용
- 시퀀스가 없으면 MAX(RESVNO) + 1 사용
- 에러 처리 포함

### 5. 프론트엔드 예약 페이지

#### LIB_Reservation.html 기본 구조
- 날짜 선택 (달력)
- 시간 선택 (시작/종료 시간)
- 좌석 선택 UI
- 예약 정보 요약
- 예약하기 버튼

---

## 🛠 기술적 구현

### 1인 1예약 체크
```javascript
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

if (activeUserReservationCheck.rows[0][0] > 0) {
  return res.status(409).json({ 
    success: false, 
    message: '이미 활성화된 예약이 있습니다. 스터디카페는 1인 1예약 원칙을 적용하고 있습니다.' 
  });
}
```

### 예약 번호 생성
```javascript
let resvNo;
try {
  const seqResult = await db.executeQuery(`SELECT SEQ_RESERVATION.NEXTVAL FROM DUAL`);
  resvNo = seqResult.rows[0][0];
} catch (seqError) {
  const maxResult = await db.executeQuery(`SELECT NVL(MAX(RESVNO), 0) + 1 FROM LIB_RESERVATIONS`);
  resvNo = maxResult.rows[0][0];
}
```

---

## 🐛 주요 이슈 및 해결

### 이슈 1: 활성 예약 판단 로직
**문제**:  
- 현재 시간 기준으로 활성 예약을 정확히 판단해야 함
- 날짜와 시간을 모두 고려해야 함

**해결 과정**:
1. TRUNC 함수로 날짜 비교
2. 현재 시간(HH24)과 종료 시간 비교
3. 미래 예약 또는 진행 중 예약 모두 체크

### 이슈 2: 시간대 겹침 체크
**문제**:  
- 여러 경우의 시간대 겹침을 모두 체크해야 함
- SQL 쿼리 복잡도 증가

**해결 과정**:
1. 시간대 겹침 케이스 분석
2. OR 조건으로 모든 경우 체크
3. 테스트를 통한 검증

### 이슈 3: 예약 번호 생성
**문제**:  
- 시퀀스가 없을 수 있음
- 예약 번호 중복 방지

**해결 과정**:
1. 시퀀스 사용 시도
2. 실패 시 MAX+1 사용
3. 트랜잭션 처리

---

## 📝 코드 구조

### 추가된 API 엔드포인트
- `GET /reservation` - 좌석 예약

### 프론트엔드 페이지
- `LIB_Reservation.html` - 예약 페이지 (기본 구조)

---

## 💡 배운 점

1. **1인 1예약 원칙**
   - 활성 예약 개념 이해
   - 날짜/시간 기준 판단 로직

2. **중복 예약 방지**
   - 시간대 겹침 체크 로직
   - SQL 쿼리 최적화

3. **예약 번호 생성**
   - 시퀀스와 MAX+1 방식
   - 에러 처리 및 대체 방법

---

## 📊 작업 통계

- **구현한 API 엔드포인트**: 1개
- **작성한 프론트엔드 페이지**: 1개 (기본 구조)
- **코드 라인 수**: 약 400줄

---

## 🎯 내일 계획

1. 예약 내역 조회 API 구현
2. 예약 취소 기능 구현
3. 활성 예약 확인 API 구현
4. 프론트엔드 예약 내역 페이지 구현
5. 예약 페이지 UI/UX 개선

---

**작성일**: 2025년 9월 14일
