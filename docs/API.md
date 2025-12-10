# API 문서

스터디 카페 좌석 예약 시스템의 API 엔드포인트 상세 설명입니다.

---

## 🔐 인증 (Auth)

### 로그인
- **GET** `/lib/login?userId={userId}&pwd={password}`
- **Query Parameters**:
  - `userId`: 사용자 아이디 (필수)
  - `pwd`: 비밀번호 (필수)
- **Response**: 
  ```json
  {
    "success": true,
    "user": {
      "USERID": "user123",
      "NAME": "홍길동",
      "EMAIL": "user@example.com",
      "PHONE": "010-1234-5678",
      "ADDRESS": "서울시 강남구"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Response**: 
  ```json
  {
    "error": "아이디 또는 비밀번호가 올바르지 않습니다."
  }
  ```

### 아이디 중복 확인
- **GET** `/lib/checkId?userId={userId}`
- **Query Parameters**:
  - `userId`: 확인할 아이디 (필수)
- **Response**: 
  ```json
  {
    "duplicate": false
  }
  ```

### 회원가입
- **GET** `/lib/join?userId={userId}&password={password}&name={name}&email={email}&phone={phone}&address={address}`
- **Query Parameters**:
  - `userId`: 사용자 아이디 (필수)
  - `password`: 비밀번호 (필수)
  - `name`: 이름 (필수)
  - `email`: 이메일 (필수, 형식 검증)
  - `phone`: 전화번호 (선택, 형식 검증)
  - `address`: 주소 (선택)
- **Response**: 
  ```json
  {
    "success": true,
    "message": "회원가입이 완료되었습니다."
  }
  ```

### 아이디 찾기
- **GET** `/lib/findId?name={name}&email={email}`
- **Query Parameters**:
  - `name`: 이름 (필수)
  - `email`: 이메일 (필수)
- **Response**: 
  ```json
  {
    "userId": "user123"
  }
  ```
- **Not Found**: 
  ```json
  {
    "userId": null
  }
  ```

### 비밀번호 재설정
- **GET** `/lib/resetPwd?userId={userId}&name={name}&email={email}`
- **Query Parameters**:
  - `userId`: 사용자 아이디 (필수)
  - `name`: 이름 (필수)
  - `email`: 이메일 (필수, 형식 검증)
- **Response**: 
  ```json
  {
    "tempPassword": "a3b7c9d2e5f1"
  }
  ```
- **Not Found**: 
  ```json
  {
    "tempPassword": null
  }
  ```

### 사용자 정보 조회
- **GET** `/lib/userInfo`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: 
  ```json
  {
    "USERID": "user123",
    "NAME": "홍길동",
    "EMAIL": "user@example.com",
    "PHONE": "010-1234-5678",
    "ADDRESS": "서울시 강남구"
  }
  ```

### 사용자 정보 수정
- **GET** `/lib/updateUserInfo?userId={userId}&name={name}&email={email}&phone={phone}&address={address}&currentPassword={currentPassword}&newPassword={newPassword}`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `userId`: 사용자 아이디 (필수)
  - `name`: 이름 (필수)
  - `email`: 이메일 (필수, 형식 검증)
  - `phone`: 전화번호 (선택, 형식 검증)
  - `address`: 주소 (선택)
  - `currentPassword`: 현재 비밀번호 (필수)
  - `newPassword`: 새 비밀번호 (선택, 입력 시 비밀번호 변경)
- **Response**: 
  ```json
  {
    "success": true,
    "message": "회원 정보가 성공적으로 수정되었습니다."
  }
  ```

### 회원 탈퇴
- **GET** `/lib/withdraw?userId={userId}&password={password}`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `userId`: 사용자 아이디 (필수)
  - `password`: 비밀번호 (필수)
- **Response**: 
  ```json
  {
    "success": true,
    "message": "회원 탈퇴가 완료되었습니다."
  }
  ```

---

## 🔑 소셜 로그인 (Social Login)

### 카카오 로그인 시작
- **GET** `/auth/kakao`
- **Description**: 카카오 로그인 페이지로 리다이렉트
- **Response**: 리다이렉트 (카카오 로그인 페이지)

### 카카오 로그인 콜백
- **GET** `/auth/kakao/callback?code={code}`
- **Query Parameters**:
  - `code`: 카카오 인증 코드
- **Response**: 리다이렉트 (메인 페이지, 토큰 포함)

### 네이버 로그인 시작
- **GET** `/auth/naver`
- **Description**: 네이버 로그인 페이지로 리다이렉트
- **Response**: 리다이렉트 (네이버 로그인 페이지)

### 네이버 로그인 콜백
- **GET** `/auth/naver/callback?code={code}&state={state}`
- **Query Parameters**:
  - `code`: 네이버 인증 코드
  - `state`: CSRF 방지를 위한 상태값
- **Response**: 리다이렉트 (메인 페이지, 토큰 포함)

### 구글 로그인 시작
- **GET** `/auth/google`
- **Description**: 구글 로그인 페이지로 리다이렉트
- **Response**: 리다이렉트 (구글 로그인 페이지)

### 구글 로그인 콜백
- **GET** `/auth/google/callback?code={code}`
- **Query Parameters**:
  - `code`: 구글 인증 코드
- **Response**: 리다이렉트 (메인 페이지, 토큰 포함)

---

## 🪑 좌석 (Seats)

### 좌석 유형 조회
- **GET** `/seattypes`
- **Response**: 
  ```json
  [
    {
      "TYPENO": 1,
      "TYPENAME": "일반석",
      "PRICE": 5000,
      "DESCRIPTION": "기본 좌석"
    },
    {
      "TYPENO": 2,
      "TYPENAME": "프리미엄석",
      "PRICE": 8000,
      "DESCRIPTION": "프리미엄 좌석"
    }
  ]
  ```

### 좌석 정보 및 예약 상태 조회
- **GET** `/seats?date={date}&startHour={startHour}&endHour={endHour}`
- **Query Parameters**:
  - `date`: 예약 날짜 (YYYY-MM-DD 형식, 필수)
  - `startHour`: 시작 시간 (0-23, 필수)
  - `endHour`: 종료 시간 (0-23, 필수)
- **Response**: 
  ```json
  [
    [1, 1, 1, "AVAILABLE", "1층 A구역", "창가석"],
    [2, 1, 1, "OCCUPIED", "1층 A구역", "중앙석"],
    [3, 2, 2, "AVAILABLE", "2층 B구역", "조용한 구역"]
  ]
  ```
- **설명**: 
  - 배열 순서: [SEATNO, TYPENO, CAPACITY, SEATSTATUS, LOCATION, SEAT_NOTES]
  - `SEATSTATUS`: "AVAILABLE" (예약 가능), "OCCUPIED" (예약됨)

---

## 📅 예약 (Reservations)

### 좌석 예약
- **GET** `/reservation?seatNo={seatNo}&resvDate={resvDate}&startHour={startHour}&endHour={endHour}&totalPrice={totalPrice}`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `seatNo`: 좌석 번호 (필수)
  - `resvDate`: 예약 날짜 (YYYY-MM-DD 형식, 필수)
  - `startHour`: 시작 시간 (0-23, 필수)
  - `endHour`: 종료 시간 (0-23, 필수)
  - `totalPrice`: 총 가격 (필수)
- **Response**: 
  ```json
  {
    "success": true,
    "message": "예약이 성공적으로 완료되었습니다."
  }
  ```
- **Error Response (409 Conflict)**: 
  ```json
  {
    "success": false,
    "message": "이미 활성화된 예약이 있습니다. 스터디카페는 1인 1예약 원칙을 적용하고 있습니다."
  }
  ```
  또는
  ```json
  {
    "success": false,
    "message": "해당 시간대에 이미 예약된 좌석입니다. 다시 선택해주세요."
  }
  ```

### 내 예약 내역 조회
- **GET** `/myreservations`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: 
  ```json
  {
    "success": true,
    "reservations": [
      {
        "RESVNO": 1,
        "USERID": "user123",
        "SEATNO": 1,
        "RESVDATE": "2025-09-15",
        "START_HOUR": 9,
        "END_HOUR": 12,
        "TOTALPRICE": 15000,
        "RESVSTATUS": "CONFIRMED",
        "RESVTIME": "2025-09-12 10:30:00",
        "LOCATION": "1층 A구역",
        "SEAT_NOTES": "창가석",
        "TYPENAME": "일반석"
      }
    ]
  }
  ```

### 예약 취소
- **GET** `/cancel-reservation?resvNo={resvNo}`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `resvNo`: 예약 번호 (필수)
- **Response**: 
  ```json
  {
    "success": true,
    "message": "예약이 성공적으로 취소되었습니다."
  }
  ```
- **Error Response (409 Conflict)**: 
  ```json
  {
    "success": false,
    "message": "이미 종료된 예약은 취소할 수 없습니다."
  }
  ```

### 활성 예약 확인
- **GET** `/user/active-reservations`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: 
  ```json
  {
    "success": true,
    "hasActiveReservation": true,
    "activeCount": 1
  }
  ```
- **설명**: 
  - `hasActiveReservation`: 활성 예약 존재 여부
  - `activeCount`: 활성 예약 개수
  - 활성 예약: 아직 시작하지 않았거나 진행 중인 예약

---

## 📝 게시판 (Board)

### 게시판 목록 조회
- **GET** `/board/list?pageSize={pageSize}&offset={offset}`
- **Query Parameters**:
  - `pageSize`: 페이지당 항목 수 (필수)
  - `offset`: 오프셋 (필수)
- **Response**: 
  ```json
  {
    "result": "success",
    "boardList": [
      {
        "BOARDNO": 1,
        "TITLE": "게시글 제목",
        "CONTENTS": "게시글 내용",
        "USERID": "user123",
        "CDATE": "2025-09-12"
      }
    ],
    "count": 10
  }
  ```

### 게시글 작성
- **GET** `/board/add?title={title}&contents={contents}&userId={userId}&kind={kind}`
- **Query Parameters**:
  - `title`: 제목 (필수)
  - `contents`: 내용 (필수)
  - `userId`: 작성자 아이디 (필수)
  - `kind`: 게시글 종류 (선택)
- **Response**: 
  ```json
  {
    "result": "success"
  }
  ```

### 게시글 조회
- **GET** `/board/view?boardNo={boardNo}`
- **Query Parameters**:
  - `boardNo`: 게시글 번호 (필수)
- **Response**: 
  ```json
  {
    "result": "success",
    "info": {
      "BOARDNO": 1,
      "TITLE": "게시글 제목",
      "CONTENTS": "게시글 내용",
      "USERID": "user123",
      "CDATE": "2025-09-12"
    }
  }
  ```

---

## 📝 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "message": "성공 메시지",
  "data": { ... }
}
```

### 에러 응답
```json
{
  "success": false,
  "error": "에러 메시지"
}
```

또는

```json
{
  "error": "에러 메시지"
}
```

---

## 🔒 인증

대부분의 API는 JWT 토큰 인증이 필요합니다.

**헤더 형식**:
```
Authorization: Bearer {token}
```

토큰은 로그인 또는 소셜 로그인 시 받을 수 있습니다.

---

## 📌 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (필수 파라미터 누락, 형식 오류) |
| 401 | 인증 실패 (로그인 필요) |
| 403 | 권한 없음 (본인만 접근 가능) |
| 404 | 리소스를 찾을 수 없음 |
| 409 | 충돌 (중복 예약, 이미 취소된 예약 등) |
| 500 | 서버 오류 |

---

**작성일**: 2025년 9월 19일
