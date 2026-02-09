#!/bin/bash
# ============================================================
# BRITZMEDI 글로벌 B2B 웹사이트 - 전체 QA 점검 스크립트
# 실행 방법: bash qa-britzmedi.sh
# 프로젝트 루트에서 실행해주세요 (C:\Users\J\Projects\britzmedi-global)
# ============================================================

set +e  # Don't exit on non-zero — ((x++)) returns 1 when x=0

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS=0
WARN=0
FAIL=0

log_pass() { echo -e "${GREEN}✅ PASS${NC} $1"; ((PASS++)) || true; }
log_warn() { echo -e "${YELLOW}⚠️  WARN${NC} $1"; ((WARN++)) || true; }
log_fail() { echo -e "${RED}❌ FAIL${NC} $1"; ((FAIL++)) || true; }
log_section() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BLUE}📋 $1${NC}"; echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# ============================================================
# 0. 사전 점검
# ============================================================
log_section "0. 사전 점검 - 프로젝트 확인"

if [ -f "package.json" ]; then
  log_pass "package.json 존재"
else
  log_fail "package.json 없음 - 프로젝트 루트에서 실행해주세요"
  exit 1
fi

if [ -f "astro.config.mjs" ] || [ -f "astro.config.ts" ] || [ -f "astro.config.js" ]; then
  log_pass "Astro 설정 파일 존재"
else
  log_warn "Astro 설정 파일 없음"
fi

# node_modules 확인
if [ -d "node_modules" ]; then
  log_pass "node_modules 존재"
else
  log_warn "node_modules 없음 - npm install 실행 중..."
  npm install 2>&1 | tail -3
fi

# ============================================================
# 1. 빌드 테스트
# ============================================================
log_section "1. 빌드 테스트"

echo "npm run build 실행 중... (시간이 걸릴 수 있습니다)"
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  log_pass "빌드 성공"
  
  # 경고 확인
  BUILD_WARNINGS=$(echo "$BUILD_OUTPUT" | grep -i "warn" | head -10)
  if [ -n "$BUILD_WARNINGS" ]; then
    log_warn "빌드 경고 발견:"
    echo "$BUILD_WARNINGS" | head -5
  fi
else
  log_fail "빌드 실패 (exit code: $BUILD_EXIT)"
  echo "--- 빌드 에러 로그 (마지막 30줄) ---"
  echo "$BUILD_OUTPUT" | tail -30
  echo "--- 빌드 에러 끝 ---"
  echo ""
  echo "⛔ 빌드 실패로 페이지/API 테스트 건너뜁니다."
  echo "   아래 파일 점검 결과부터 확인하세요."
fi

# ============================================================
# 2. 페이지 접근 테스트 (빌드 성공시에만)
# ============================================================
log_section "2. 페이지 접근 테스트"

if [ $BUILD_EXIT -eq 0 ]; then
  # dev 서버 시작
  echo "dev 서버 시작 중..."
  npm run dev -- --port 4321 &>/dev/null &
  DEV_PID=$!
  sleep 8  # 서버 기동 대기

  # 서버 준비 확인
  RETRIES=0
  while ! curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/ 2>/dev/null | grep -q "200"; do
    ((RETRIES++))
    if [ $RETRIES -gt 10 ]; then
      log_fail "dev 서버 시작 실패"
      kill $DEV_PID 2>/dev/null
      break
    fi
    sleep 2
  done

  if [ $RETRIES -le 10 ]; then
    log_pass "dev 서버 정상 기동 (PID: $DEV_PID)"

    # 공개 페이지 테스트
    PUBLIC_PAGES=(
      "/"
      "/products/torr-rf"
      "/products/ulblanc"
      "/products/newchae-shot"
      "/products/lumino-wave"
      "/blog"
      "/blog/rf-device-buyer-guide-7-criteria"
      "/blog/multi-wave-rf-technology-complete-guide"
      "/blog/microneedle-rf-vs-monopolar-rf-vs-hifu"
      "/blog/torr-rf-fda-510k-clearance-guide"
      "/blog/top-5-rf-technologies-aesthetic-medicine-2026"
      "/news"
      "/contact"
      "/about"
      "/resources"
    )

    echo ""
    echo "📄 공개 페이지:"
    for page in "${PUBLIC_PAGES[@]}"; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4321${page}" 2>/dev/null)
      if [ "$STATUS" = "200" ]; then
        log_pass "$page → $STATUS"
      elif [ "$STATUS" = "301" ] || [ "$STATUS" = "302" ]; then
        log_warn "$page → $STATUS (리다이렉트)"
      else
        log_fail "$page → $STATUS"
      fi
    done

    # Admin 페이지 테스트
    ADMIN_PAGES=(
      "/admin"
      "/admin/homepage"
      "/admin/content-hub"
      "/admin/youtube-to-blog"
      "/admin/social"
      "/admin/subscribers"
      "/admin/resources"
    )

    echo ""
    echo "🔒 Admin 페이지 (302 = 인증 리다이렉트 = 정상):"
    for page in "${ADMIN_PAGES[@]}"; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4321${page}" 2>/dev/null)
      if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ]; then
        log_pass "$page → $STATUS"
      elif [ "$STATUS" = "301" ]; then
        log_warn "$page → $STATUS (리다이렉트)"
      else
        log_fail "$page → $STATUS"
      fi
    done

    # 다국어 페이지 테스트
    I18N_PAGES=("/ja" "/zh" "/es")

    echo ""
    echo "🌐 다국어 페이지:"
    for page in "${I18N_PAGES[@]}"; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4321${page}" 2>/dev/null)
      if [ "$STATUS" = "200" ]; then
        log_pass "$page → $STATUS"
      elif [ "$STATUS" = "301" ] || [ "$STATUS" = "302" ]; then
        log_warn "$page → $STATUS (리다이렉트)"
      else
        log_fail "$page → $STATUS"
      fi
    done

    # ============================================================
    # 3. API 테스트
    # ============================================================
    log_section "3. API 테스트"

    # GET APIs
    API_GETS=(
      "/api/admin/blog/posts"
      "/api/admin/content-hub/quality-check?slug=rf-device-buyer-guide-7-criteria"
      "/api/admin/social/accounts"
      "/api/admin/content-hub/news"
    )

    # D1-dependent APIs return 500 in local dev (no D1 binding) — treat as WARN
    D1_APIS="/api/admin/blog/posts|/api/admin/content-hub/quality-check|/api/admin/social/accounts"

    for api in "${API_GETS[@]}"; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4321${api}" 2>/dev/null)
      if [ "$STATUS" = "200" ]; then
        log_pass "GET $api → $STATUS"
      elif [ "$STATUS" = "500" ] && echo "$api" | grep -qE "$D1_APIS"; then
        log_warn "GET $api → $STATUS (D1 로컬 미지원 — 프로덕션 정상)"
      else
        log_fail "GET $api → $STATUS"
      fi
    done

    # POST API (빈 body → 400 예상)
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:4321/api/admin/content-hub/transition" -H "Content-Type: application/json" -d '{}' 2>/dev/null)
    if [ "$STATUS" = "400" ]; then
      log_pass "POST /api/admin/content-hub/transition (빈 body) → $STATUS (정상: 400 에러)"
    elif [ "$STATUS" = "200" ]; then
      log_warn "POST /api/admin/content-hub/transition → $STATUS (빈 body인데 200?)"
    else
      log_fail "POST /api/admin/content-hub/transition → $STATUS"
    fi

    # dev 서버 종료
    kill $DEV_PID 2>/dev/null
    wait $DEV_PID 2>/dev/null
    echo ""
    echo "dev 서버 종료됨"
  fi
else
  echo "빌드 실패로 페이지/API 테스트 건너뜁니다."
fi

# ============================================================
# 4. 콘텐츠 무결성 검사
# ============================================================
log_section "4. 콘텐츠 무결성 검사"

echo "📝 블로그 JSON 검사:"
BLOG_DIR=""
for dir in "src/content/blog" "src/data/blog" "content/blog" "public/data/blog"; do
  if [ -d "$dir" ]; then
    BLOG_DIR="$dir"
    break
  fi
done

if [ -n "$BLOG_DIR" ]; then
  log_pass "블로그 콘텐츠 디렉토리: $BLOG_DIR"
  for file in "$BLOG_DIR"/*.json; do
    [ -f "$file" ] || continue
    FILENAME=$(basename "$file")
    # JSON 유효성
    if node -e "JSON.parse(require('fs').readFileSync('$file','utf8'))" 2>/dev/null; then
      # 필수 필드 확인 (블로그 JSON은 publishedAt 사용, date 아님)
      MISSING=""
      for field in title slug category; do
        if ! grep -q "\"$field\"" "$file" 2>/dev/null; then
          MISSING="$MISSING $field"
        fi
      done
      # date 또는 publishedAt 중 하나
      if ! grep -q "\"date\"\|\"publishedAt\"" "$file" 2>/dev/null; then
        MISSING="$MISSING date/publishedAt"
      fi
      if [ -n "$MISSING" ]; then
        log_warn "$FILENAME - 누락 필드:$MISSING"
      else
        log_pass "$FILENAME - 필수 필드 OK"
      fi
    else
      log_fail "$FILENAME - JSON 파싱 실패"
    fi
  done
else
  log_warn "블로그 콘텐츠 디렉토리를 찾을 수 없음 (검색: src/content/blog, src/data/blog, content/blog)"
fi

echo ""
echo "📰 뉴스 JSON 검사:"
NEWS_DIR=""
for dir in "src/content/news" "src/data/news" "content/news" "public/data/news"; do
  if [ -d "$dir" ]; then
    NEWS_DIR="$dir"
    break
  fi
done

# 뉴스는 단일 JSON 파일 (배열)
NEWS_FILE=""
for file in "src/data/news.json" "src/content/news.json"; do
  if [ -f "$file" ]; then
    NEWS_FILE="$file"
    break
  fi
done

if [ -n "$NEWS_FILE" ]; then
  log_pass "뉴스 파일: $NEWS_FILE"
  MISSING=""
  for field in id title date category; do
    if ! grep -q "\"$field\"" "$NEWS_FILE" 2>/dev/null; then
      MISSING="$MISSING $field"
    fi
  done
  if [ -n "$MISSING" ]; then
    log_warn "news.json - 누락 필드:$MISSING"
  else
    log_pass "news.json - 필수 필드(id,title,date,category) OK"
  fi
  # 카테고리 유효성
  INVALID_CAT=$(grep -oP '"category"\s*:\s*"([^"]+)"' "$NEWS_FILE" 2>/dev/null | grep -oP '"[^"]+"\s*$' | tr -d '"' | tr -d ' ' | while read cat; do
    echo "$cat" | grep -qvE "^(event|product|partnership|award|media)$" && echo "$cat"
  done)
  if [ -n "$INVALID_CAT" ]; then
    log_warn "news.json - 잘못된 카테고리: $INVALID_CAT"
  else
    log_pass "news.json - 카테고리 유효성 OK"
  fi
elif [ -n "$NEWS_DIR" ]; then
  log_pass "뉴스 콘텐츠 디렉토리: $NEWS_DIR"
else
  log_warn "뉴스 데이터를 찾을 수 없음"
fi

echo ""
echo "🏠 homepage.json 검사:"
HOMEPAGE_FILE=""
for file in "src/data/homepage.json" "src/content/homepage.json" "content/homepage.json" "public/data/homepage.json"; do
  if [ -f "$file" ]; then
    HOMEPAGE_FILE="$file"
    break
  fi
done

if [ -n "$HOMEPAGE_FILE" ]; then
  log_pass "homepage.json 위치: $HOMEPAGE_FILE"
  MISSING=""
  for field in hero featuredProducts whyBritzMedi trustBadges; do
    if ! grep -q "\"$field\"" "$HOMEPAGE_FILE" 2>/dev/null; then
      MISSING="$MISSING $field"
    fi
  done
  # latestNews.enabled 확인
  if ! grep -q "latestNews" "$HOMEPAGE_FILE" 2>/dev/null; then
    MISSING="$MISSING latestNews"
  fi
  if [ -n "$MISSING" ]; then
    log_warn "homepage.json - 누락 필드:$MISSING"
  else
    log_pass "homepage.json - 필수 필드 OK"
  fi
else
  log_warn "homepage.json 찾을 수 없음"
fi

# ============================================================
# 5. Import 경로 검사
# ============================================================
log_section "5. Import 경로 검사"

echo "content-hub / social 관련 import 검사:"
IMPORT_ERRORS=0

# content-hub 관련 import 추적
for file in $(grep -rl "content-hub\|contentHub\|ContentHub" src/ 2>/dev/null | head -20); do
  while IFS= read -r line; do
    # import 문에서 경로 추출
    IMPORT_PATH=$(echo "$line" | grep -oP "from ['\"]([^'\"]+)['\"]" | sed "s/from ['\"]//;s/['\"]//")
    if [ -n "$IMPORT_PATH" ] && [[ "$IMPORT_PATH" == ./* ]] || [[ "$IMPORT_PATH" == ../* ]]; then
      # 상대 경로인 경우 실제 파일 존재 확인
      DIR=$(dirname "$file")
      RESOLVED="$DIR/$IMPORT_PATH"
      # .ts, .tsx, .js, .jsx, /index 등 확장자 체크
      FOUND=false
      for ext in "" ".ts" ".tsx" ".js" ".jsx" "/index.ts" "/index.tsx" "/index.js"; do
        if [ -f "${RESOLVED}${ext}" ]; then
          FOUND=true
          break
        fi
      done
      if [ "$FOUND" = false ]; then
        log_fail "깨진 import: $file → $IMPORT_PATH"
        ((IMPORT_ERRORS++))
      fi
    fi
  done < <(grep "import.*from\|require(" "$file" 2>/dev/null | grep -i "content-hub\|contentHub\|social" | head -10)
done

# social 관련 import 추적
for file in $(grep -rl "social\|twitter\|linkedin\|instagram" src/ 2>/dev/null | grep -v node_modules | grep -v ".astro" | head -20); do
  while IFS= read -r line; do
    IMPORT_PATH=$(echo "$line" | grep -oP "from ['\"]([^'\"]+)['\"]" | sed "s/from ['\"]//;s/['\"]//")
    if [ -n "$IMPORT_PATH" ] && [[ "$IMPORT_PATH" == ./* ]] || [[ "$IMPORT_PATH" == ../* ]]; then
      DIR=$(dirname "$file")
      RESOLVED="$DIR/$IMPORT_PATH"
      FOUND=false
      for ext in "" ".ts" ".tsx" ".js" ".jsx" "/index.ts" "/index.tsx"; do
        if [ -f "${RESOLVED}${ext}" ]; then
          FOUND=true
          break
        fi
      done
      if [ "$FOUND" = false ]; then
        log_fail "깨진 import: $file → $IMPORT_PATH"
        ((IMPORT_ERRORS++))
      fi
    fi
  done < <(grep "import.*from\|require(" "$file" 2>/dev/null | grep -i "social\|twitter\|linkedin\|instagram\|formatter" | head -10)
done

if [ $IMPORT_ERRORS -eq 0 ]; then
  log_pass "content-hub/social import 경로 모두 정상"
fi

# ============================================================
# 6. SNS 코드 검사
# ============================================================
log_section "6. SNS 코드 검사"

SNS_FILES=("twitter.ts" "linkedin.ts" "instagram.ts" "formatter.ts")

for sns_file in "${SNS_FILES[@]}"; do
  FOUND=$(find src/ -name "$sns_file" -type f 2>/dev/null | head -1)
  if [ -n "$FOUND" ]; then
    log_pass "$sns_file 존재 → $FOUND"
    
    # export 함수 확인
    EXPORTS=$(grep -c "export " "$FOUND" 2>/dev/null || echo "0")
    if [ "$EXPORTS" -gt 0 ]; then
      log_pass "  └─ export 함수 ${EXPORTS}개"
      grep "export " "$FOUND" 2>/dev/null | head -5 | while read -r line; do
        echo "     $line"
      done
    else
      log_warn "  └─ export 함수 없음"
    fi
  else
    log_fail "$sns_file 파일 없음"
  fi
done

# ============================================================
# 7. Content Hub 워크플로우 검사
# ============================================================
log_section "7. Content Hub 워크플로우 검사"

# quality-checker.ts
QC_FILE=$(find src/ -name "quality-checker*" -o -name "qualityChecker*" -o -name "quality_checker*" 2>/dev/null | head -1)
if [ -n "$QC_FILE" ]; then
  log_pass "quality-checker 파일: $QC_FILE"
else
  log_fail "quality-checker 파일 없음"
fi

# 상태전환 로직 확인
TRANSITION_FILE=$(grep -rl "Draft\|Review\|Approved\|Published\|Archived" src/ 2>/dev/null | grep -i "transition\|workflow\|status\|content-hub" | head -1)
if [ -n "$TRANSITION_FILE" ]; then
  log_pass "상태전환 로직: $TRANSITION_FILE"
  
  STATES=("Draft" "Review" "Approved" "Published" "Archived")
  FOUND_STATES=0
  for state in "${STATES[@]}"; do
    if grep -q "$state" "$TRANSITION_FILE" 2>/dev/null; then
      ((FOUND_STATES++))
    fi
  done
  if [ $FOUND_STATES -ge 4 ]; then
    log_pass "  └─ 5단계 워크플로우 상태 ${FOUND_STATES}/5 확인"
  else
    log_warn "  └─ 워크플로우 상태 ${FOUND_STATES}/5만 확인됨"
  fi
else
  log_warn "상태전환 로직 파일을 특정할 수 없음"
fi

# 반려(reject) 기능 확인
REJECT=$(grep -rl "reject\|반려\|Reject" src/ 2>/dev/null | grep -v node_modules | head -3)
if [ -n "$REJECT" ]; then
  log_pass "반려 기능 코드 존재"
else
  log_warn "반려(reject) 기능 코드 미발견"
fi

# ============================================================
# 8. 이미지/에셋 검사
# ============================================================
log_section "8. 이미지/에셋 참조 검사"

BROKEN_REFS=0

# src/ 내 이미지 참조 검사
echo "이미지 참조 검사 중..."
for ref in $(grep -rohP '(?:src|href)="(/[^"]*\.(?:png|jpg|jpeg|gif|svg|webp|avif))"' src/ 2>/dev/null | grep -oP '/[^"]+' | sort -u | head -30); do
  # public 폴더 기준 체크
  if [ ! -f "public${ref}" ] && [ ! -f ".${ref}" ]; then
    log_fail "깨진 이미지 참조: $ref"
    ((BROKEN_REFS++))
  fi
done

# JSON/MD 내 이미지 참조
for ref in $(grep -rohP '"(?:image|thumbnail|logo|icon|src)"\s*:\s*"(/[^"]*\.(?:png|jpg|jpeg|gif|svg|webp|avif))"' src/ 2>/dev/null | grep -oP '/[^"]+' | sort -u | head -20); do
  if [ ! -f "public${ref}" ] && [ ! -f ".${ref}" ]; then
    log_fail "깨진 이미지 참조 (JSON): $ref"
    ((BROKEN_REFS++))
  fi
done

if [ $BROKEN_REFS -eq 0 ]; then
  log_pass "깨진 이미지 참조 없음"
fi

# public 폴더 에셋 통계
if [ -d "public" ]; then
  IMG_COUNT=$(find public/ -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" -o -name "*.webp" -o -name "*.avif" -o -name "*.gif" \) 2>/dev/null | wc -l)
  log_pass "public/ 내 이미지 파일: ${IMG_COUNT}개"
fi

# ============================================================
# 최종 보고
# ============================================================
log_section "📊 QA 최종 결과"

TOTAL=$((PASS + WARN + FAIL))
echo ""
echo -e "  ${GREEN}✅ 통과: ${PASS}${NC}"
echo -e "  ${YELLOW}⚠️  경고: ${WARN}${NC}"
echo -e "  ${RED}❌ 실패: ${FAIL}${NC}"
echo -e "  ─────────────"
echo -e "  총 검사: ${TOTAL}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 모든 필수 검사를 통과했습니다!${NC}"
  if [ $WARN -gt 0 ]; then
    echo -e "${YELLOW}⚠️  경고 ${WARN}건은 확인이 필요합니다.${NC}"
  fi
else
  echo -e "${RED}⛔ 실패 ${FAIL}건을 수정해주세요.${NC}"
  echo ""
  echo "실패 항목 수정 후:"
  echo "  git add -A"
  echo "  git commit -m 'fix: comprehensive QA audit fixes'"
  echo "  git push origin main"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
