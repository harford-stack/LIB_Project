/**
 * ============================================
 * 공통 유틸리티 함수 파일 (common.js)
 * ============================================
 * 
 * 이 파일은 여러 페이지에서 공통으로 사용하는 함수들을 모아둔 곳입니다!
 * 
 * [이 파일이 하는 일]
 * 1. 헤더와 푸터를 동적으로 불러옵니다
 * 2. 세션에서 사용자 정보를 가져옵니다
 * 3. 로그인 상태를 확인합니다
 * 4. 로그아웃을 처리합니다
 * 
 * [비유로 설명하면]
 * - 이 파일은 학교의 공통 시설과 같습니다
 * - 모든 교실에서 사용할 수 있는 도구들을 모아둔 곳입니다
 * - 각 교실에서 따로 만들 필요 없이 여기서 가져다 씁니다
 */

/**
 * 헤더와 푸터를 동적으로 불러오는 함수
 * 
 * HTML 파일에서 헤더와 푸터를 별도 파일로 관리하고,
 * 필요할 때 불러와서 표시합니다.
 * 
 * [왜 동적으로 불러오나요?]
 * - 헤더와 푸터를 여러 페이지에서 공통으로 사용합니다
 * - 한 곳에서 수정하면 모든 페이지에 반영됩니다
 * - 코드 중복을 줄일 수 있습니다
 * 
 * [작동 방식]
 * 1. fetch로 LIB_Header.html 파일을 가져옵니다
 * 2. HTML 내용을 파싱합니다
 * 3. header-container에 삽입합니다
 * 4. 푸터도 동일하게 처리합니다
 * 
 * [예시]
 * loadHeaderFooter()
 * → 헤더와 푸터가 페이지에 표시됨
 */
function loadHeaderFooter() {
  // 헤더 로드
  // fetch: 서버에서 파일을 가져오는 함수 (비동기)
  fetch('LIB_Header.html')
    .then(response => {
      // response.ok: 요청이 성공했는지 확인 (200~299 상태 코드)
      if (!response.ok) {
        throw new Error('헤더를 불러올 수 없습니다.');
      }
      // response.text(): 응답을 텍스트로 변환합니다
      return response.text();
    })
    .then(data => {
      // DOMParser: HTML 문자열을 DOM 객체로 변환하는 도구
      // parseFromString: 문자열을 파싱합니다
      // querySelector('header'): header 태그를 찾습니다
      const headerContent = new DOMParser()
        .parseFromString(data, 'text/html')
        .querySelector('header');
      
      // header-container: 헤더를 넣을 곳 (HTML에 있어야 함)
      const headerContainer = document.getElementById('header-container');
      if (headerContainer && headerContent) {
        headerContainer.innerHTML = '';  // 기존 내용 삭제
        headerContainer.appendChild(headerContent);  // 새 헤더 추가
      }
    })
    .catch(error => {
      // 에러가 발생하면 콘솔에 출력합니다
      console.error('헤더 로드 오류:', error);
    });
  
  // 푸터 로드 (헤더와 동일한 방식)
  fetch('LIB_Footer.html')
    .then(response => {
      if (!response.ok) {
        throw new Error('푸터를 불러올 수 없습니다.');
      }
      return response.text();
    })
    .then(data => {
      const footerContent = new DOMParser()
        .parseFromString(data, 'text/html')
        .querySelector('footer');
      
      const footerContainer = document.getElementById('footer-container');
      if (footerContainer && footerContent) {
        footerContainer.innerHTML = '';
        footerContainer.appendChild(footerContent);
      }
    })
    .catch(error => {
      console.error('푸터 로드 오류:', error);
    });
}

/**
 * 세션에서 사용자 정보 가져오기 함수
 * 
 * sessionStorage에 저장된 사용자 아이디와 이름을 가져옵니다.
 * 
 * [작동 방식]
 * 1. sessionStorage에서 sessionId(사용자 아이디)를 가져옵니다
 * 2. sessionStorage에서 sessionName(사용자 이름)을 가져옵니다
 * 3. 둘 다 있으면 객체로 반환합니다
 * 4. 없으면 null을 반환합니다
 * 
 * [예시]
 * getSessionUser()
 * → { userId: "hong", userName: "홍길동" } 또는 null
 * 
 * @returns {Object|null} 사용자 정보 객체 또는 null
 */
function getSessionUser() {
  const userId = sessionStorage.getItem('sessionId');
  const userName = sessionStorage.getItem('sessionName');
  
  // 둘 다 있으면 객체로 반환
  if (userId && userName) {
    return { userId, userName };
  }
  // 없으면 null 반환
  return null;
}

/**
 * 로그인 상태 확인 함수
 * 
 * 사용자가 로그인했는지 확인합니다.
 * 
 * [작동 방식]
 * 1. sessionStorage에서 sessionId를 확인합니다
 * 2. 있으면 true (로그인함), 없으면 false (로그인 안 함)
 * 
 * [예시]
 * isLoggedIn()
 * → true (로그인함) 또는 false (로그인 안 함)
 * 
 * @returns {boolean} 로그인 여부
 */
function isLoggedIn() {
  return sessionStorage.getItem('sessionId') !== null;
}

/**
 * 로그아웃 처리 함수
 * 
 * 로그인 정보를 삭제하고 메인 페이지로 이동합니다.
 * 
 * [작동 방식]
 * 1. auth.js의 clearAuth 함수를 사용합니다 (있으면)
 * 2. 없으면 직접 sessionStorage에서 정보를 삭제합니다
 * 3. 알림을 표시합니다
 * 4. 메인 페이지로 이동합니다
 * 
 * [예시]
 * logout()
 * → "로그아웃 되었습니다." 알림 표시 → 메인 페이지로 이동
 */
function logout() {
  // auth.js의 clearAuth 사용 (더 안전함)
  // typeof window.clearAuth === 'function': clearAuth 함수가 있는지 확인
  if (typeof window.clearAuth === 'function') {
    window.clearAuth();
  } else {
    // 모듈이 로드되지 않은 경우 직접 처리
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('sessionName');
  }
  alert('로그아웃 되었습니다.');
  window.location.href = 'LIB_Main.html';  // 메인 페이지로 이동
}
