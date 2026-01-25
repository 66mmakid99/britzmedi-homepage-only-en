# Keystatic 경로 보호 설정 가이드

**작성일**: 2026-01-25
**목적**: `/keystatic` 경로를 인증으로 보호하여 무단 접근 방지

---

## 🔒 보안 설정 옵션

Cloudflare Pages에서 `/keystatic` 경로를 보호하는 방법은 3가지가 있습니다:

### Option 1: Cloudflare Access (추천) ⭐
**장점**:
- 무료 (최대 50명 사용자)
- Google, GitHub 등 OAuth 로그인 지원
- IP 기반 접근 제어
- 세션 관리 자동화

**단점**:
- Cloudflare 대시보드 설정 필요
- 초기 설정 복잡도 중간

### Option 2: Basic Authentication
**장점**:
- 설정 간단
- 추가 서비스 불필요

**단점**:
- 사용자 경험 나쁨 (브라우저 팝업)
- 비밀번호 관리 어려움
- 세션 없음 (매번 로그인)

### Option 3: Custom Middleware
**장점**:
- 완전한 커스터마이징 가능
- 자체 인증 로직 구현

**단점**:
- 개발 시간 많이 소요
- 보안 취약점 위험
- 유지보수 부담

---

## 🎯 추천 방법: Cloudflare Access

### 1단계: Cloudflare Access 활성화

1. **Cloudflare 대시보드 접속**
   - https://dash.cloudflare.com
   - 계정 로그인

2. **Zero Trust 메뉴 이동**
   - 왼쪽 사이드바에서 "Zero Trust" 클릭
   - 또는 https://one.dash.cloudflare.com

3. **Access 설정**
   - "Access" → "Applications" 클릭
   - "Add an application" 버튼 클릭

### 2단계: Application 생성

1. **Application Type 선택**
   - "Self-hosted" 선택
   - "Next" 클릭

2. **Application Configuration**
   ```
   Application name: Keystatic CMS
   Session Duration: 24 hours
   Application domain: britzmedi.com
   Path: /keystatic
   ```

3. **Identity Providers 설정**
   - "One-time PIN" (이메일 인증) 또는
   - "Google" (Google 계정 로그인) 또는
   - "GitHub" (GitHub 계정 로그인)

4. **Access Policy 생성**
   ```
   Policy name: Keystatic Admins
   Action: Allow
   
   Include:
   - Emails: your-email@example.com
   또는
   - Email domain: @yourcompany.com
   ```

5. **Save Application**

### 3단계: 테스트

1. **브라우저에서 접속**
   ```
   https://britzmedi.com/keystatic
   ```

2. **인증 화면 확인**
   - Cloudflare Access 로그인 페이지 표시
   - 설정한 방법으로 로그인

3. **접근 확인**
   - 로그인 성공 시 Keystatic UI 표시
   - 세션 유지 (24시간)

---

## 🔧 대안: _headers 파일 (Basic Auth)

Cloudflare Access를 사용하지 않는 경우, `public/_headers` 파일로 Basic Authentication을 설정할 수 있습니다.

### 파일 생성

**파일 위치**: `public/_headers`

```
/keystatic/*
  X-Robots-Tag: noindex
  WWW-Authenticate: Basic realm="Keystatic CMS"
```

### 환경 변수 설정

Cloudflare Pages 대시보드에서:

1. **Settings** → **Environment variables**
2. 다음 변수 추가:
   ```
   KEYSTATIC_USERNAME=admin
   KEYSTATIC_PASSWORD=your-secure-password
   ```

### Middleware 추가

**파일**: `src/middleware.ts`

```typescript
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  // Keystatic 경로 보호
  if (pathname.startsWith('/keystatic')) {
    const authHeader = context.request.headers.get('authorization');
    
    if (!authHeader) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Keystatic CMS"'
        }
      });
    }
    
    const [scheme, credentials] = authHeader.split(' ');
    
    if (scheme !== 'Basic') {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const [username, password] = atob(credentials).split(':');
    
    const validUsername = import.meta.env.KEYSTATIC_USERNAME || 'admin';
    const validPassword = import.meta.env.KEYSTATIC_PASSWORD;
    
    if (username !== validUsername || password !== validPassword) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
  
  return next();
});
```

**주의**: 이 방법은 보안이 약하므로 프로덕션에서는 Cloudflare Access 사용을 강력히 권장합니다.

---

## 📋 체크리스트

### Cloudflare Access 설정
- [ ] Cloudflare Zero Trust 대시보드 접속
- [ ] Access Application 생성
- [ ] Identity Provider 설정 (Google/GitHub/Email)
- [ ] Access Policy 생성 (허용할 이메일 추가)
- [ ] 테스트: https://britzmedi.com/keystatic 접속
- [ ] 로그인 성공 확인
- [ ] 세션 유지 확인

### Basic Auth 설정 (대안)
- [ ] `public/_headers` 파일 생성
- [ ] `src/middleware.ts` 파일 생성
- [ ] Cloudflare Pages 환경 변수 설정
- [ ] 재배포
- [ ] 테스트: 브라우저 인증 팝업 확인

---

## 🚨 중요 보안 사항

1. **절대 하지 말 것**:
   - 비밀번호를 코드에 하드코딩
   - Git에 비밀번호 커밋
   - 약한 비밀번호 사용

2. **반드시 할 것**:
   - 강력한 비밀번호 사용 (16자 이상)
   - 환경 변수로 비밀번호 관리
   - 정기적으로 비밀번호 변경
   - 접근 로그 모니터링

3. **추가 보안 강화**:
   - IP 화이트리스트 설정
   - 2FA (Two-Factor Authentication) 활성화
   - 세션 타임아웃 설정
   - 실패한 로그인 시도 모니터링

---

## 📊 현재 상태

**보안 설정**: ❌ 미설정
**접근 제어**: ❌ 없음 (누구나 접근 가능)
**권장 조치**: Cloudflare Access 설정 필요

---

## 🔗 참고 자료

- [Cloudflare Access 문서](https://developers.cloudflare.com/cloudflare-one/applications/)
- [Keystatic 보안 가이드](https://keystatic.com/docs/security)
- [Astro Middleware 문서](https://docs.astro.build/en/guides/middleware/)

---

**다음 단계**: Cloudflare 대시보드에서 Access 설정 진행

**예상 소요 시간**: 15-20분
