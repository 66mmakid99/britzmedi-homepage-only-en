# Hero Section 완전 수정 — 한번에 실행

아래를 Claude Code에 통째로 복붙하세요. 나머지는 자동으로 처리됩니다.

---

```
Hero Section이 모바일에서 영상과 텍스트가 위아래로 분리되고, PC에서 영상 비율이 깨지는 문제를 근본 수정해. 태블릿에서만 정상이야.

원인은 어딘가에서 모바일 breakpoint에서 position을 static/relative로 바꾸거나 flex-direction: column으로 영상과 텍스트를 분리하는 CSS가 있기 때문이야.

아래 순서대로 전부 실행해. 중간에 멈추지 마.

== 1단계: 범인 찾기 ==

아래 명령 전부 실행하고 결과 보여줘:

grep -rn "flex-col\|flex-direction.*column" src/components/Hero* src/components/hero* src/pages/index.astro src/pages/\[lang\]/index.astro 2>/dev/null
grep -rn "position.*static\|position.*relative" src/components/Hero* src/components/hero* 2>/dev/null
grep -rn "hero" src/styles/global.css src/styles/*.css 2>/dev/null | grep -i "position\|flex\|display"
find src -name "*.astro" -o -name "*.tsx" -o -name "*.css" | xargs grep -ln "hero.*flex-col\|hero.*flex-direction\|hero.*position.*static\|hero.*position.*relative" 2>/dev/null

== 2단계: 현재 HeroSection 파일 확인 ==

find src -name "*ero*ection*" -o -name "*ero*section*" | head -10
ls -la src/components/Hero* src/components/hero* 2>/dev/null

파일명이 뭐든 hero section 담당 컴포넌트를 찾아. 그리고 그 파일 전체 내용을 읽어.

== 3단계: HeroSection 컴포넌트 완전 교체 ==

찾은 hero section 컴포넌트 파일을 백업하고 아래 내용으로 완전히 교체해.

주의사항:
- 현재 파일에서 props로 받는 값들(heroImage 경로, KV에서 가져오는 로직 등)은 유지해야 해
- 아래 코드의 HTML 구조와 <style> 부분만 교체하는 거야
- 기존 frontmatter(---) 안의 import, fetch, KV 조회 로직은 그대로 유지

교체할 HTML 구조:

<section class="hero-wrap">
  <div class="hero-bg-layer">
    {isVideo 판별 조건 ? (
      <video autoplay muted loop playsinline preload="auto" class="hero-media-el">
        <source src={heroImage 변수} type="video/mp4" />
      </video>
    ) : (
      <img src={heroImage 변수} alt="BRITZMEDI Hero" class="hero-media-el" loading="eager" />
    )}
  </div>
  <div class="hero-dim"></div>
  <div class="hero-text-layer">
    <div class="hero-text-box">
      {배지 텍스트 && (
        <div class="hero-pill">
          <span class="hero-pill-dot"></span>
          <span>{배지 텍스트}</span>
        </div>
      )}
      <h1 class="hero-h1">
        Innovative Aesthetic
        <span class="hero-h1-blue">Medical Technology</span>
        from Korea
      </h1>
      <p class="hero-desc">{설명 텍스트}</p>
      <div class="hero-btns">
        <a href="/products" class="hero-btn-pri">Explore Products →</a>
        <a href="/contact" class="hero-btn-sec">Contact Sales</a>
      </div>
    </div>
  </div>
</section>

교체할 <style> (기존 <style> 태그 전체를 이걸로 교체):

<style>
  .hero-wrap {
    position: relative;
    width: 100%;
    height: clamp(500px, 80vh, 900px);
    overflow: hidden;
  }
  .hero-bg-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
  }
  .hero-media-el {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }
  .hero-dim {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 70%, transparent 100%);
  }
  .hero-text-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: flex-end;
  }
  .hero-text-box {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 16px 40px;
  }
  .hero-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 9999px;
    padding: 6px 14px;
    margin-bottom: 16px;
  }
  .hero-pill span { color: #fff; font-size: 12px; font-weight: 500; }
  .hero-pill-dot { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; flex-shrink: 0; }
  .hero-h1 {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    color: #fff;
    margin: 0 0 16px;
    max-width: 600px;
  }
  .hero-h1 span { display: block; }
  .hero-h1-blue { color: #3b82f6 !important; }
  .hero-desc {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255,255,255,0.8);
    margin: 0 0 24px;
    max-width: 460px;
  }
  .hero-btns {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .hero-btn-pri {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #2563eb;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    padding: 14px 28px;
    border-radius: 8px;
    text-decoration: none;
    text-align: center;
    transition: background 0.2s;
  }
  .hero-btn-pri:hover { background: #1d4ed8; }
  .hero-btn-sec {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    padding: 14px 28px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.2);
    text-decoration: none;
    text-align: center;
    transition: background 0.2s;
  }
  .hero-btn-sec:hover { background: rgba(255,255,255,0.2); }

  @media (min-width: 640px) {
    .hero-text-box { padding: 0 24px 48px; }
    .hero-pill span { font-size: 13px; }
    .hero-h1 { font-size: 36px; }
    .hero-desc { font-size: 15px; }
    .hero-btns { flex-direction: row; }
  }
  @media (min-width: 1024px) {
    .hero-text-box { padding: 0 48px 64px; }
    .hero-h1 { font-size: 52px; max-width: 700px; }
    .hero-desc { font-size: 16px; max-width: 520px; }
  }
  @media (min-width: 1280px) {
    .hero-text-box { padding: 0 64px 72px; }
    .hero-h1 { font-size: 60px; max-width: 780px; }
    .hero-desc { font-size: 17px; max-width: 560px; }
  }
</style>

핵심 규칙:
- .hero-bg-layer, .hero-dim, .hero-text-layer 세 개 모두 position: absolute; inset: 0
- 이 position 값은 어떤 @media query에서도 절대 변경하지 않음
- 반응형에서는 오직 font-size, padding, max-width만 변경
- flex-direction: column은 오직 .hero-btns (버튼 그룹)에만 사용하고 모바일에서만

== 4단계: 외부 CSS 충돌 제거 ==

global.css나 다른 CSS 파일에서 hero 관련 스타일 찾아서 position, display, flex-direction을 변경하는 것이 있으면 삭제:

grep -rn "hero-section\|hero-bg\|hero-content\|hero-media\|hero-overlay\|\.hero " src/styles/ 2>/dev/null

찾은 것 중 position, display, flex를 건드리는 것들 제거.

또한 index.astro, [lang]/index.astro에서 HeroSection을 감싸는 div에 flex, flex-col 같은 Tailwind 클래스가 있으면 제거:

grep -n "HeroSection\|hero-section\|hero_section" src/pages/index.astro src/pages/\[lang\]/index.astro 2>/dev/null

만약 이런 코드가 있으면:
<div class="flex flex-col">
  <HeroSection />
</div>

이렇게 바꿔:
<HeroSection />

== 5단계: 빌드 + 검증 ==

npm run build

빌드 성공하면:

1. dist/index.html에서 hero 관련 CSS 확인:
grep -A3 "hero-bg-layer\|hero-text-layer\|hero-dim" dist/_astro/*.css 2>/dev/null | head -30

position: absolute가 유지되는지, @media에서 바뀌지 않는지 확인.

2. dist/index.html에서 hero HTML 구조 확인:
grep -o 'class="hero-[^"]*"' dist/index.html | head -20

hero-wrap, hero-bg-layer, hero-dim, hero-text-layer, hero-text-box가 있는지 확인.

== 6단계: 배포 ==

git add -A
git commit -m "fix: Hero section - absolute overlay layout for all breakpoints (no more flex-col split)"
git push

또는 git push가 안 되면:
npx wrangler pages deploy dist/

배포 완료 후 URL 알려줘.

== 최종 확인 ==

빌드된 CSS에서 다음이 절대 나오면 안 됨:
- hero-text-layer에 position: static 또는 position: relative
- hero-bg-layer에 position: static 또는 position: relative
- hero-wrap에 flex-direction: column

이것들이 빌드 결과에 있으면 원인을 찾아서 제거하고 다시 빌드해.
```
