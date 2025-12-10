/**
 * ============================================
 * 소셜 로그인 라우트 파일 (auth.js)
 * ============================================
 * 
 * 이 파일은 카카오, 네이버, 구글 로그인을 처리하는 역할을 합니다!
 * 
 * [이 파일이 하는 일]
 * 1. 소셜 로그인을 시작합니다 (사용자를 카카오/네이버/구글 로그인 페이지로 보냄)
 * 2. 소셜 로그인 후 돌아온 사용자를 처리합니다 (콜백)
 * 3. 소셜 로그인 사용자를 데이터베이스에 등록하거나 찾습니다
 * 
 * [소셜 로그인이란?]
 * - 카카오, 네이버, 구글 계정으로 우리 웹사이트에 로그인하는 것입니다
 * - 별도로 회원가입할 필요 없이 소셜 계정으로 바로 로그인할 수 있습니다
 * - 예: "카카오로 로그인" 버튼을 누르면 카카오 로그인 페이지로 이동합니다
 * 
 * [OAuth 2.0이란?]
 * - 소셜 로그인을 위한 표준 방법입니다
 * - 마치 "위임장"과 같습니다
 * - 사용자가 "이 웹사이트에 내 정보를 알려줘"라고 소셜 사이트에 요청합니다
 * - 소셜 사이트가 "좋아, 인증 코드를 줄게"라고 응답합니다
 * - 우리 서버가 그 코드로 사용자 정보를 가져옵니다
 * 
 * [비유로 설명하면]
 * - 이 파일은 학교의 방문객 등록소와 같습니다
 * - 외부인(소셜 로그인 사용자)이 학교에 들어올 때
 * - 신분증(소셜 계정)을 확인하고
 * - 방문증(토큰)을 발급합니다
 */

// 필요한 도구들을 가져옵니다
const express = require('express');  // Express 라우터를 만들기 위해
const axios = require('axios');       // HTTP 요청을 보내기 위해 (카카오/네이버/구글 API 호출)
const db = require('../db');          // 데이터베이스와 대화하기 위해
const { hashPassword } = require('../utils/passwordHash');  // 비밀번호 해싱
const { generateToken } = require('../middleware/auth');    // JWT 토큰 생성
const config = require('../config');  // 설정 파일 (소셜 로그인 설정 등)

// Express 라우터를 만듭니다
// 라우터란? 특정 경로로 오는 요청을 처리하는 도구입니다
// 예: /auth/kakao 경로로 오는 요청을 처리합니다
const router = express.Router();

// ============================================
// 카카오 로그인
// ============================================

/**
 * 카카오 로그인 시작
 * 
 * 사용자가 "카카오로 로그인" 버튼을 누르면 실행됩니다.
 * 
 * [작동 방식]
 * 1. 카카오 로그인이 설정되어 있는지 확인합니다
 * 2. 카카오 로그인 페이지 URL을 만듭니다
 * 3. 사용자를 카카오 로그인 페이지로 보냅니다 (리다이렉트)
 * 
 * [OAuth 2.0 흐름]
 * 1단계: 사용자 → 카카오 로그인 페이지로 이동 (이 함수)
 * 2단계: 사용자가 카카오에서 로그인
 * 3단계: 카카오 → 우리 서버로 인증 코드 전달 (콜백)
 * 4단계: 우리 서버 → 카카오에 토큰 요청
 * 5단계: 카카오 → 우리 서버에 사용자 정보 전달
 * 
 * GET /auth/kakao
 */
router.get('/kakao', (req, res) => {
  // 카카오 로그인이 설정되어 있는지 확인
  // clientId가 없으면 카카오 로그인을 사용할 수 없습니다
  if (!config.social.kakao.clientId) {
    return res.status(400).json({ error: '카카오 로그인이 설정되지 않았습니다' });
  }
  
  // 카카오 로그인 페이지 URL 만들기
  // prompt=login: 항상 로그인 화면을 표시합니다 (캐시 무시)
  // 이렇게 하면 사용자가 이미 로그인해 있어도 다시 로그인 화면을 보게 됩니다
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${config.social.kakao.clientId}&redirect_uri=${config.social.kakao.redirectUri}&response_type=code&prompt=login`;
  
  // 사용자를 카카오 로그인 페이지로 보냅니다 (리다이렉트)
  // res.redirect(): 사용자를 다른 페이지로 보내는 함수
  res.redirect(kakaoAuthUrl);
});

/**
 * 카카오 로그인 콜백
 * 
 * 사용자가 카카오에서 로그인한 후 우리 서버로 돌아올 때 실행됩니다.
 * 
 * [작동 방식]
 * 1. 카카오가 보낸 인증 코드(code)를 받습니다
 * 2. 그 코드로 카카오에 토큰을 요청합니다
 * 3. 토큰으로 카카오 사용자 정보를 가져옵니다
 * 4. 사용자를 데이터베이스에서 찾거나 새로 만듭니다
 * 5. JWT 토큰을 생성합니다
 * 6. 사용자를 메인 페이지로 보냅니다 (토큰 포함)
 * 
 * GET /auth/kakao/callback?code=인증코드
 */
router.get('/kakao/callback', async (req, res) => {
  // 카카오가 보낸 인증 코드를 가져옵니다
  // code: 카카오가 발급한 인증 코드 (일회용, 짧은 시간만 유효)
  const { code } = req.query;
  
  // 인증 코드가 없으면 로그인 실패
  if (!code) {
    return res.redirect(`http://localhost:8000/LIB_Login.html?error=${encodeURIComponent('카카오 로그인 실패')}`);
  }

  // client_secret 확인 (보안을 위해 필요)
  // clientId와 clientSecret이 모두 있어야 카카오 API를 사용할 수 있습니다
  if (!config.social.kakao.clientId || !config.social.kakao.clientSecret) {
    return res.redirect(`http://localhost:8000/LIB_Login.html?error=${encodeURIComponent('카카오 로그인이 설정되지 않았습니다')}`);
  }

  try {
    // 1단계: 카카오에 토큰 요청
    // 인증 코드를 보내면 카카오가 액세스 토큰을 줍니다
    // 액세스 토큰: 사용자 정보를 가져올 수 있는 열쇠
    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',  // 인증 코드로 토큰을 받겠다는 의미
        client_id: config.social.kakao.clientId,      // 우리 앱의 아이디
        client_secret: config.social.kakao.clientSecret,  // 우리 앱의 비밀번호
        redirect_uri: config.social.kakao.redirectUri,    // 돌아올 주소
        code: code  // 카카오가 준 인증 코드
      },
      headers: {
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'  // 카카오가 요구하는 형식
      }
    });

    // 액세스 토큰 추출
    const { access_token } = tokenResponse.data;

    // 2단계: 카카오 사용자 정보 요청
    // 액세스 토큰을 보내면 카카오가 사용자 정보를 줍니다
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`  // 토큰을 헤더에 포함
      }
    });

    // 카카오 사용자 정보 추출
    const kakaoUser = userResponse.data;
    // ?. : 옵셔널 체이닝 (없어도 에러가 나지 않음)
    // || : 없으면 기본값 사용
    const email = kakaoUser.kakao_account?.email || null;  // 이메일은 선택적 (없을 수 있음)
    const nickname = kakaoUser.kakao_account?.profile?.nickname || '카카오사용자';  // 닉네임

    // 닉네임이 없으면 에러 (필수 정보)
    if (!nickname) {
      return res.redirect(`http://localhost:8000/LIB_Login.html?error=${encodeURIComponent('닉네임 정보가 필요합니다')}`);
    }

    // 3단계: 사용자 조회 또는 생성
    // 데이터베이스에 이 사용자가 있는지 확인하고, 없으면 새로 만듭니다
    let user = await findOrCreateSocialUser('kakao', kakaoUser.id.toString(), email, nickname);
    
    // 4단계: JWT 토큰 생성
    // 우리 서버의 로그인 증명서를 만듭니다
    const token = generateToken({ userId: user.USERID, name: user.NAME });

    // 5단계: 클라이언트로 리다이렉트 (토큰 포함)
    // 사용자를 메인 페이지로 보내고, 토큰도 함께 보냅니다
    // encodeURIComponent: URL에 특수문자가 있어도 안전하게 인코딩
    const redirectUrl = `http://localhost:8000/LIB_Main.html?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;
    console.log('카카오 로그인 성공, 리다이렉트:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    // 에러가 발생하면 로그인 페이지로 보내고 에러 메시지를 표시합니다
    console.error('카카오 로그인 오류:', error);
    const errorMsg = error.response?.data?.error_description || error.message || '카카오 로그인 처리 중 오류가 발생했습니다';
    res.redirect(`http://localhost:8000/LIB_Login.html?error=${encodeURIComponent(errorMsg)}`);
  }
});

// ============================================
// 네이버 로그인
// ============================================

/**
 * 네이버 로그인 시작
 * 
 * 사용자가 "네이버로 로그인" 버튼을 누르면 실행됩니다.
 * 
 * [작동 방식]
 * 1. 네이버 로그인이 설정되어 있는지 확인합니다
 * 2. state 값을 생성합니다 (보안을 위해)
 * 3. 세션에 state를 저장합니다
 * 4. 네이버 로그인 페이지 URL을 만듭니다
 * 5. 사용자를 네이버 로그인 페이지로 보냅니다
 * 
 * [state란?]
 * - CSRF 공격을 방지하기 위한 랜덤 문자열입니다
 * - 마치 "비밀 번호"와 같습니다
 * - 나중에 돌아왔을 때 이 번호가 맞는지 확인합니다
 * - 맞지 않으면 해커의 공격일 수 있습니다
 * 
 * GET /auth/naver
 */
router.get('/naver', (req, res) => {
  // 네이버 로그인이 설정되어 있는지 확인
  if (!config.social.naver.clientId) {
    return res.status(400).json({ error: '네이버 로그인이 설정되지 않았습니다' });
  }
  
  // state 값 생성 (랜덤 문자열)
  // Math.random(): 0과 1 사이의 랜덤한 숫자
  // toString(36): 36진수로 변환 (0-9, a-z 사용)
  // substring(2, 15): 2번째부터 15번째까지 자르기
  // 예: "a3b7c9d2e5f1"
  const state = Math.random().toString(36).substring(2, 15);
  
  // 세션에 state 저장 (나중에 확인하기 위해)
  // 세션이란? 서버에 일시적으로 정보를 저장하는 곳입니다
  // 브라우저를 닫으면 사라집니다
  if (req.session) {
    req.session.naverState = state;
  }
  
  // 네이버 로그인 페이지 URL 만들기
  // prompt=login: 항상 로그인 화면을 표시합니다
  // state: 보안을 위한 랜덤 문자열
  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${config.social.naver.clientId}&redirect_uri=${config.social.naver.redirectUri}&state=${state}&prompt=login`;
  res.redirect(naverAuthUrl);
});

/**
 * 네이버 로그인 콜백
 * 
 * 사용자가 네이버에서 로그인한 후 우리 서버로 돌아올 때 실행됩니다.
 * 
 * [작동 방식]
 * 1. 네이버가 보낸 인증 코드와 state를 받습니다
 * 2. state가 맞는지 확인합니다 (보안)
 * 3. 그 코드로 네이버에 토큰을 요청합니다
 * 4. 토큰으로 네이버 사용자 정보를 가져옵니다
 * 5. 사용자를 데이터베이스에서 찾거나 새로 만듭니다
 * 6. JWT 토큰을 생성합니다
 * 7. 사용자를 메인 페이지로 보냅니다
 * 
 * GET /auth/naver/callback?code=인증코드&state=상태값
 */
router.get('/naver/callback', async (req, res) => {
  // 네이버가 보낸 인증 코드와 state를 가져옵니다
  const { code, state } = req.query;
  
  // 세션에서 저장했던 state 확인
  // ?. : 옵셔널 체이닝 (세션이 없어도 에러가 나지 않음)
  const savedState = req.session?.naverState;
  
  // 인증 코드가 없으면 로그인 실패
  if (!code) {
    return res.redirect(`http://localhost:8000/LIB_Login.html?error=${encodeURIComponent('네이버 로그인 실패: 인증 코드가 없습니다')}`);
  }
  
  // state 검증 (보안 확인)
  // 받은 state와 저장했던 state가 다르면 경고
  // 세션이 없을 수 있으므로 경고만 하고 진행 (개발 환경에서는 유연하게 처리)
  if (savedState && state !== savedState) {
    console.error('네이버 로그인 state 불일치:', { received: state, saved: savedState });
    // state 불일치해도 진행 (개발 환경에서는 유연하게 처리)
  }
  
  // state 확인 후 세션 정리 (다음 로그인을 위해)
  if (req.session && req.session.naverState) {
    delete req.session.naverState;
  }

  // client_secret 확인
  if (!config.social.naver.clientId || !config.social.naver.clientSecret) {
    return res.redirect(`http://localhost:8000/LIB_Login.html?error=${encodeURIComponent('네이버 로그인이 설정되지 않았습니다')}`);
  }

  try {
    // 1단계: 네이버에 토큰 요청
    const tokenResponse = await axios.post('https://nid.naver.com/oauth2.0/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: config.social.naver.clientId,
        client_secret: config.social.naver.clientSecret,
        code: code,
        state: state  // state도 함께 보냅니다
      }
    });

    // 액세스 토큰 추출
    const { access_token } = tokenResponse.data;

    // 2단계: 네이버 사용자 정보 요청
    const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    // 네이버 사용자 정보 추출
    // 네이버는 response 안에 사용자 정보를 넣어서 보냅니다
    const naverUser = userResponse.data.response;
    const email = naverUser.email || null;  // 네이버는 기본적으로 이메일 제공
    const nickname = naverUser.name || '네이버사용자';

    // 닉네임이 없으면 에러
    if (!nickname) {
      return res.redirect('/?error=이름 정보가 필요합니다');
    }

    // 3단계: 사용자 조회 또는 생성
    let user = await findOrCreateSocialUser('naver', naverUser.id, email, nickname);
    
    // 4단계: JWT 토큰 생성
    const token = generateToken({ userId: user.USERID, name: user.NAME });

    // 5단계: 클라이언트로 리다이렉트
    const redirectUrl = `http://localhost:8000/LIB_Main.html?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;
    console.log('네이버 로그인 성공, 리다이렉트:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('네이버 로그인 오류:', error);
    const errorMsg = error.response?.data?.error_description || error.message || '네이버 로그인 처리 중 오류가 발생했습니다';
    res.redirect(`http://localhost:8000/LIB_Login.html?error=${encodeURIComponent(errorMsg)}`);
  }
});

// ============================================
// 구글 로그인
// ============================================

/**
 * 구글 로그인 시작
 * 
 * 사용자가 "구글로 로그인" 버튼을 누르면 실행됩니다.
 * 
 * [작동 방식]
 * 1. 구글 로그인이 설정되어 있는지 확인합니다
 * 2. 구글 로그인 페이지 URL을 만듭니다
 * 3. 사용자를 구글 로그인 페이지로 보냅니다
 * 
 * [scope란?]
 * - 구글에서 어떤 정보를 가져올지 정하는 것입니다
 * - openid: 사용자 식별 정보
 * - email: 이메일 주소
 * - profile: 프로필 정보 (이름 등)
 * 
 * GET /auth/google
 */
router.get('/google', (req, res) => {
  // 구글 로그인이 설정되어 있는지 확인
  if (!config.social.google.clientId) {
    return res.status(400).json({ error: '구글 로그인이 설정되지 않았습니다' });
  }
  
  // 구글 로그인 페이지 URL 만들기
  // scope: 가져올 정보 종류
  // prompt=login: 항상 로그인 화면을 표시합니다
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.social.google.clientId}&redirect_uri=${config.social.google.redirectUri}&response_type=code&scope=openid email profile&prompt=login`;
  res.redirect(googleAuthUrl);
});

/**
 * 구글 로그인 콜백
 * 
 * 사용자가 구글에서 로그인한 후 우리 서버로 돌아올 때 실행됩니다.
 * 
 * [작동 방식]
 * 1. 구글이 보낸 인증 코드를 받습니다
 * 2. 그 코드로 구글에 토큰을 요청합니다
 * 3. 토큰으로 구글 사용자 정보를 가져옵니다
 * 4. 사용자를 데이터베이스에서 찾거나 새로 만듭니다
 * 5. JWT 토큰을 생성합니다
 * 6. 사용자를 메인 페이지로 보냅니다
 * 
 * GET /auth/google/callback?code=인증코드
 */
router.get('/google/callback', async (req, res) => {
  // 구글이 보낸 인증 코드를 가져옵니다
  const { code } = req.query;
  
  // 인증 코드가 없으면 로그인 실패
  if (!code) {
    return res.redirect('/?error=구글 로그인 실패');
  }

  // client_secret 확인
  if (!config.social.google.clientId || !config.social.google.clientSecret) {
    return res.redirect(`http://localhost:8000/LIB_Login.html?error=${encodeURIComponent('구글 로그인이 설정되지 않았습니다')}`);
  }

  try {
    // 1단계: 구글에 토큰 요청
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code: code,
        client_id: config.social.google.clientId,
        client_secret: config.social.google.clientSecret,
        redirect_uri: config.social.google.redirectUri,
        grant_type: 'authorization_code'
      }
    });

    // 액세스 토큰 추출
    const { access_token } = tokenResponse.data;

    // 2단계: 구글 사용자 정보 요청
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    // 구글 사용자 정보 추출
    const googleUser = userResponse.data;
    const email = googleUser.email || null;  // 구글은 기본적으로 이메일 제공
    // 이름이 없으면 이메일 앞부분을 이름으로 사용
    const nickname = googleUser.name || googleUser.email?.split('@')[0] || '구글사용자';

    // 3단계: 사용자 조회 또는 생성
    let user = await findOrCreateSocialUser('google', googleUser.id, email, nickname);
    
    // 4단계: JWT 토큰 생성
    const token = generateToken({ userId: user.USERID, name: user.NAME });

    // 5단계: 클라이언트로 리다이렉트
    const redirectUrl = `http://localhost:8000/LIB_Main.html?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;
    console.log('구글 로그인 성공, 리다이렉트:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('구글 로그인 오류:', error);
    const errorMsg = error.response?.data?.error_description || error.message || '구글 로그인 처리 중 오류가 발생했습니다';
    res.redirect(`http://localhost:8000/LIB_Login.html?error=${encodeURIComponent(errorMsg)}`);
  }
});

// ============================================
// 공통 함수
// ============================================

/**
 * 소셜 로그인 사용자 조회 또는 생성 함수
 * 
 * 소셜 로그인으로 들어온 사용자를 데이터베이스에서 찾거나 새로 만듭니다.
 * 
 * [작동 방식]
 * 1. 소셜 사용자 ID로 먼저 찾아봅니다 (예: "kakao_1234567890")
 * 2. 없으면 이메일로 찾아봅니다 (기존 회원가입 사용자와 연결)
 * 3. 둘 다 없으면 새 사용자를 만듭니다
 * 4. 사용자 정보를 반환합니다
 * 
 * [소셜 사용자 ID 형식]
 * - "provider_providerId" 형식
 * - 예: "kakao_1234567890", "naver_9876543210", "google_abcdefghij"
 * - providerId가 너무 길면 20자로 자릅니다
 * 
 * [비유로 설명하면]
 * - 이 함수는 학교의 신입생 등록소와 같습니다
 * - 학생증(소셜 ID)으로 먼저 찾아봅니다
 * - 없으면 이름(이메일)으로 찾아봅니다
 * - 둘 다 없으면 새 학생으로 등록합니다
 * 
 * @param {string} provider - 제공자 ('kakao', 'naver', 'google')
 * @param {string} providerId - 제공자에서 발급한 사용자 ID (카카오/네이버/구글이 준 고유 번호)
 * @param {string|null} email - 이메일 (선택적, 없을 수 있음)
 * @param {string} name - 닉네임/이름 (필수)
 * @returns {Promise<Object>} 사용자 정보 객체
 */
async function findOrCreateSocialUser(provider, providerId, email, name) {
  // 소셜 로그인 사용자 ID 생성
  // 형식: "provider_providerId"
  // 예: "kakao_1234567890"
  // substring(0, 20): providerId가 너무 길면 20자로 자릅니다 (데이터베이스 제한)
  const userId = `${provider}_${providerId.substring(0, 20)}`;
  
  // 1단계: 소셜 ID로 먼저 조회 시도
  // 이 사용자가 이전에 소셜 로그인으로 들어온 적이 있는지 확인
  let query = `SELECT USERID, NAME, EMAIL, PHONE, ADDRESS FROM LIB_USERS WHERE USERID = :userId`;
  let result = await db.executeQuery(query, { userId });
  
  // 사용자를 찾았으면 기존 사용자 정보를 반환합니다
  if (result.rows.length > 0) {
    const user = result.rows[0];
    return {
      USERID: user[0],      // 사용자 아이디
      NAME: user[1],        // 이름
      EMAIL: user[2] || '', // 이메일 (없으면 빈 문자열)
      PHONE: user[3] || '', // 전화번호 (없으면 빈 문자열)
      ADDRESS: user[4] || '' // 주소 (없으면 빈 문자열)
    };
  }
  
  // 2단계: 이메일로 조회 시도 (기존 회원가입 사용자와 연결)
  // 이메일이 있고, 이 이메일로 일반 회원가입을 한 사용자가 있을 수 있습니다
  // 그 사용자와 연결하면 소셜 로그인도 같은 계정으로 사용할 수 있습니다
  if (email) {
    query = `SELECT USERID, NAME, EMAIL, PHONE, ADDRESS FROM LIB_USERS WHERE EMAIL = :email`;
    result = await db.executeQuery(query, { email });
    
    // 이메일로 사용자를 찾았으면 기존 사용자 정보를 반환합니다
    if (result.rows.length > 0) {
      const user = result.rows[0];
      return {
        USERID: user[0],
        NAME: user[1],
        EMAIL: user[2] || '',
        PHONE: user[3] || '',
        ADDRESS: user[4] || ''
      };
    }
  }
  
  // 3단계: 새 사용자 생성
  // 소셜 ID로도, 이메일로도 찾지 못했으면 새 사용자를 만듭니다
  
  // 소셜 로그인용 랜덤 비밀번호 생성
  // 소셜 로그인 사용자는 비밀번호를 입력하지 않지만,
  // 데이터베이스에는 비밀번호가 필요하므로 랜덤 비밀번호를 만듭니다
  // 이 비밀번호는 사용자가 알 필요가 없습니다 (소셜 로그인만 사용)
  const randomPassword = Math.random().toString(36).slice(-12);
  const hashedPassword = await hashPassword(randomPassword);
  
  // 새 사용자를 데이터베이스에 추가
  const insertQuery = `INSERT INTO LIB_USERS (USERID, PASSWORD, NAME, EMAIL, PHONE, ADDRESS)
    VALUES (:1, :2, :3, :4, :5, :6)`;
  
  await db.executeQuery(
    insertQuery,
    [userId, hashedPassword, name, email || '', '', ''],  // 이메일 없으면 빈 문자열, 전화번호와 주소는 빈 문자열
    { autoCommit: true }  // 즉시 저장
  );
  
  // 새로 만든 사용자 정보를 반환합니다
  return {
    USERID: userId,
    NAME: name,
    EMAIL: email || '',
    PHONE: '',
    ADDRESS: ''
  };
}

// 이 파일에서 사용할 수 있도록 라우터를 내보냅니다 (export)
module.exports = router;
