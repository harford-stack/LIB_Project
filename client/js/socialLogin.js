/**
 * 소셜 로그인 유틸리티
 */

const SOCIAL_LOGIN_URLS = {
  kakao: 'http://localhost:3009/auth/kakao',
  naver: 'http://localhost:3009/auth/naver',
  google: 'http://localhost:3009/auth/google'
};

/**
 * 소셜 로그인 시작
 * @param {string} provider - 'kakao', 'naver', 'google'
 */
function startSocialLogin(provider) {
  const url = SOCIAL_LOGIN_URLS[provider];
  if (!url) {
    console.error('지원하지 않는 소셜 로그인 제공자:', provider);
    return;
  }
  window.location.href = url;
}

// 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.startSocialLogin = startSocialLogin;
}

