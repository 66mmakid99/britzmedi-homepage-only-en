# YouTube to Blog 자동화 시스템

> 이 명령문을 클로드 코드에 붙여넣으세요.

---

어드민 페이지에 "YouTube to Blog" 자동화 시스템을 추가해줘.

## 1. 개요

YouTube 영상 URL(단일/다중/채널)을 입력하면:
1. 자막 추출
2. 영어 번역 (Gemini)
3. 블로그 글 생성 (Claude Opus 4.5)
4. 이미지 자동 생성 (Gemini Nano Banana)
5. 의사 프로필 자동 조사
6. 컨펌 후 발행

모든 작업은 병렬로 처리되고, 큐 대시보드에서 관리.

---

## 2. 기술 스택

| 용도 | 기술 |
|------|------|
| 글 생성 | Claude Opus 4.5 (claude-opus-4-5-20251101) |
| 번역 | Gemini API |
| 이미지 생성 | Gemini (gemini-2.5-flash-image) |
| 에디터 | TipTap (React) |
| 자막 추출 | YouTube RSS + RapidAPI fallback |
| 이미지 최적화 | Sharp (WebP, 리사이즈) |
| 이미지 저장 | Cloudflare R2 |
| 데이터 | Cloudflare D1 |
| 이메일 | Resend API |
| 발행 | GitHub API |
| 백그라운드 | Cloudflare Queue 또는 Cron |

---

## 3. 환경변수

```env
# AI
ANTHROPIC_API_KEY=     # Claude Opus 4.5
GEMINI_API_KEY=        # 번역 + 이미지

# 이메일
RESEND_API_KEY=
ADMIN_EMAIL=

# GitHub
GITHUB_TOKEN=
GITHUB_REPO=66mmakid99/britzmedi-homepage-only-en

# 이미지 저장
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=britzmedi-blog-images

# 옵션
YOUTUBE_API_KEY=       # 채널 수집용 (RSS로 대체 가능)
MAX_CONCURRENT_JOBS=3
```

---

## 4. 입력 방식 3가지

### 4.1 단일 URL
- 영상 1개 URL 입력
- 바로 처리 시작

### 4.2 다중 URL
- 텍스트박스에 여러 URL 붙여넣기 (줄바꿈 구분)
- 한번에 큐에 추가
- 병렬 처리

### 4.3 채널 URL
- YouTube 채널 URL 입력 (예: https://youtube.com/@BritzMedi)
- [Fetch Videos] 클릭 → 영상 목록 표시
- 체크박스로 처리할 영상 선택
- 이미 처리한 영상은 "처리됨" 표시
- 선택한 영상들 일괄 큐에 추가

채널 영상 수집 방법:
- YouTube RSS: https://www.youtube.com/feeds/videos.xml?channel_id={id}
- 또는 YouTube Data API (YOUTUBE_API_KEY 있을 경우)

---

## 5. 처리 플로우

```
YouTube URL(s) 입력
    ↓
[큐에 추가]
    ↓
┌─────────────────────────────────────┐
│  Worker (백그라운드, 최대 3개 병렬)  │
├─────────────────────────────────────┤
│  ① 자막 추출                        │
│     - 영어 자막 우선                 │
│     - 없으면 한국어 → Gemini 번역    │
│                                     │
│  ② Gemini: 영어로 번역/다듬기        │
│     - 구어체 → 문어체               │
│     - 전문 용어 통일                 │
│                                     │
│  ③ Claude Opus 4.5: 블로그 글 생성   │
│     - 인터뷰 형식 Q&A               │
│     - 메타데이터 자동 추출           │
│     - 의사 정보 추출                 │
│     - 이미지 삽입 지점 분석          │
│                                     │
│  ④ Gemini: 의사 프로필 웹 검색       │
│     - 학력, 논문, 학회 활동          │
│     - PubMed 검색                   │
│                                     │
│  ⑤ Gemini Nano Banana: 이미지 생성  │
│     - 글 맥락에 맞는 이미지 5개      │
│                                     │
│  ⑥ Sharp: 이미지 최적화             │
│     - 1200x800, WebP, 200KB 이하    │
│     - R2에 업로드                   │
│                                     │
│  ⑦ 완료 → status: ready             │
└─────────────────────────────────────┘
    ↓
미리보기 & 편집 (TipTap 에디터)
    ↓
컨펌 (어드민 직접 OR 이메일 버튼)
    ↓
GitHub 커밋 → Cloudflare Pages 자동 배포
    ↓
완료 이메일 발송
```

---

## 6. Claude Opus 4.5 글 생성 프롬프트

```
You are a senior medical content strategist for BRITZMEDI (britzmedi.com), a Korean aesthetic medical device manufacturer.

Transform this video transcript into a world-class English blog article that will be cited by AI search engines (ChatGPT, Perplexity, etc.).

## Context
- Target audience: International medical device distributors, clinic owners, dermatologists
- Goal: Establish BRITZMEDI as a trusted authority in RF aesthetic technology
- The article must feel natural, sophisticated, and professionally written — never AI-generated

## Article Requirements

### Structure
1. **Title**: "Clinical Insights: Dr. [Name] on [Topic]" format
2. **Opening** (2-3 sentences): Hook + context
3. **[YOUTUBE_EMBED]** placeholder
4. **Key Takeaways**: 3-5 bullet points (AI snippet-friendly)
5. **Interview Q&A**: 5-8 meaningful exchanges, naturally flowing
6. **Clinical Applications** (if relevant): How this applies in practice
7. **Conclusion**: Summary + CTA
8. **[EXPERT_PROFILE]** placeholder (will be filled separately)

### Writing Style
- Professional yet accessible
- Confident, authoritative tone
- Use specific data/numbers when available
- Natural internal link to /products/torr-rf woven into text
- Length: 1,500-2,000 words

### SEO Keywords (use naturally)
- multi-wave RF technology
- TORR RF
- non-invasive skin tightening
- body contouring
- aesthetic medical device

### Image Placement
Identify exactly 5 points where images would enhance the article.
For each, provide:
- Position (after which paragraph)
- Purpose (illustrate concept, show results, etc.)
- Generation prompt (detailed description for AI image generation)
- Alt text (SEO-optimized, under 125 chars)
- Caption (optional)

## Output Format (JSON)

{
  "title": "...",
  "slug": "url-friendly-slug",
  "description": "150-160 char SEO description",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full markdown content with [IMAGE_1], [IMAGE_2]... and [YOUTUBE_EMBED], [EXPERT_PROFILE] placeholders",
  "images": [
    {
      "position": 1,
      "purpose": "...",
      "prompt": "Detailed image generation prompt...",
      "alt": "Alt text under 125 chars",
      "caption": "Optional caption"
    }
  ],
  "doctor": {
    "name": "Full name",
    "name_korean": "한글 이름 if mentioned",
    "affiliation": "Hospital/clinic",
    "specialty": "Specialty if mentioned",
    "credentials_mentioned": ["any credentials mentioned in video"]
  },
  "key_quotes": ["Notable quotes from the doctor for social media"]
}

## Transcript

{transcript}
```

---

## 7. 의사 프로필 조사 (Gemini 웹 검색)

```
Research the following medical professional and compile a comprehensive profile for a blog article. This information will be used to establish credibility (E-E-A-T).

Doctor: {name}
Known affiliation: {affiliation}
Specialty: {specialty}
Country: South Korea (likely)

## Search and gather:

1. **Education & Training**
   - Medical school
   - Residency
   - Fellowship
   - PhD/graduate degrees

2. **Board Certifications**
   - Korean Dermatological Association
   - Other relevant boards

3. **Current Position(s)**
   - Hospital/clinic name and role
   - Academic appointments

4. **Academic Activities**
   - Published papers (search PubMed: "{name}" dermatology OR aesthetic OR RF)
   - Conference presentations (IMCAS, AMWC, KDA, KSDS, etc.)
   - Editorial board memberships
   - Book chapters

5. **Awards & Recognition**

6. **Professional Memberships**
   - Korean Dermatological Association
   - International societies

## Output Format (JSON)

{
  "name": "...",
  "credentials": "MD, PhD, etc.",
  "verified": true/false,
  "education": [
    {"degree": "MD", "institution": "...", "year": "..."}
  ],
  "certifications": ["..."],
  "positions": [
    {"title": "...", "organization": "...", "current": true}
  ],
  "publications": [
    {"title": "...", "journal": "...", "year": "...", "pubmed_id": "..."}
  ],
  "publication_count": 23,
  "conferences": ["IMCAS 2024 speaker", "..."],
  "awards": ["..."],
  "memberships": ["..."],
  "pubmed_search_url": "https://pubmed.ncbi.nlm.nih.gov/?term=...",
  "notes": "Any caveats about unverified information"
}

IMPORTANT: 
- Only include information you can verify
- Mark unverified fields clearly
- Never fabricate credentials
- If minimal information found, return what you have with verified: false
```

---

## 8. 이미지 생성 (Gemini Nano Banana)

### AEO/GEO 이미지 가이드라인

| 항목 | 기준 |
|------|------|
| 갯수 | 본문 300단어당 1개 (약 5개) |
| 포맷 | WebP |
| 크기 | 1200x800px |
| 용량 | 200KB 이하 |
| alt 텍스트 | 필수, 키워드 포함, 125자 이내 |
| 파일명 | SEO 친화적 (torr-rf-skin-layers.webp) |
| 캡션 | 권장 |

### 이미지 생성 프롬프트 템플릿

```
Create a professional medical illustration for BRITZMEDI's blog.

Style Requirements:
- Clean, modern, professional medical illustration
- Color scheme: Blue, white, light gray (BRITZMEDI brand colors)
- High quality, suitable for medical/professional context
- No text overlay (text will be added separately if needed)
- Photorealistic or clean vector style depending on subject

Subject: {prompt from Claude's analysis}

Technical specs:
- Aspect ratio: 3:2 (1200x800)
- High resolution
- Suitable for web use
```

### 이미지 유형별 처리

1. **기술 일러스트** (RF 원리, 피부 단면) → Gemini 생성
2. **인포그래픽** (비교표, 프로세스) → Gemini 생성
3. **제품 사진** → 기존 /images/products/ 에서 매칭
4. **시술 결과** → 플레이스홀더 또는 스톡

---

## 9. Expert Profile 섹션 템플릿

글 하단에 자동 삽입:

```markdown
---

## About the Expert

**{name}, {credentials}**

{specialty} specialist with {years} years of clinical experience in aesthetic medicine.

**Current Position**
{positions as bullet list}

**Education & Training**
{education as bullet list}

**Academic Contributions**
- {publication_count} peer-reviewed publications
- Regular speaker at {conferences}
- {memberships}

**Selected Publications**
{top 3 publications with links}

[View full publication list on PubMed]({pubmed_search_url})
```

### Schema.org 마크업

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "author": {
    "@type": "Person",
    "name": "{name}",
    "jobTitle": "{specialty}",
    "affiliation": {
      "@type": "MedicalClinic",
      "name": "{affiliation}"
    },
    "hasCredential": [
      {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "degree",
        "name": "{degree}"
      }
    ],
    "sameAs": ["{pubmed_url}", "{linkedin if available}"]
  }
}
```

---

## 10. UI 설계

### 10.1 메인 대시보드

```
┌─────────────────────────────────────────────────────────────┐
│  YouTube to Blog                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┬─────────┬─────────┐                           │
│  │ Single  │Multiple │ Channel │  ← 탭 전환                │
│  └─────────┴─────────┴─────────┘                           │
│                                                             │
│  [Single 탭]                                                │
│  URL: [____________________________________] [Add to Queue] │
│                                                             │
│  [Multiple 탭]                                              │
│  ┌──────────────────────────────────────────┐              │
│  │ https://youtube.com/watch?v=abc123       │              │
│  │ https://youtube.com/watch?v=def456       │              │
│  │ https://youtube.com/watch?v=ghi789       │              │
│  │ (한 줄에 하나씩)                           │              │
│  └──────────────────────────────────────────┘              │
│  Found: 3 URLs                      [Add All to Queue]     │
│                                                             │
│  [Channel 탭]                                               │
│  Channel: [________________________________] [Fetch Videos] │
│                                                             │
│  ☑ 토르RF 시술 후기 - Dr. Kim         2024.01.15  [처리됨]  │
│  ☑ 울블랑 사용법 안내                  2024.01.10          │
│  ☐ 회사 소개 영상                      2023.12.01          │
│  ☑ RF 기술 설명 - Dr. Park            2023.11.20          │
│                                                             │
│  [Select All] [Deselect All]     [Add 3 to Queue]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Processing Queue                                           │
├─────────────────────────────────────────────────────────────┤
│  Filter: [All ▼]  Queued: 2 | Processing: 2 | Ready: 3     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🟢 READY  토르RF 시술 후기 - Dr. Kim                       │
│            Completed 5 min ago • 5 images                   │
│            [Preview] [Edit] [Approve] [Delete]              │
│                                                             │
│  🟢 READY  울블랑 사용법 안내                                │
│            Completed 12 min ago • 4 images                  │
│            [Preview] [Edit] [Approve] [Delete]              │
│                                                             │
│  🟡 PROCESSING  RF 기술 설명 - Dr. Park                     │
│            ████████████░░░░░░░░ 60% Generating images (3/5) │
│                                                             │
│  🔵 PROCESSING  신제품 런칭 영상                             │
│            ████░░░░░░░░░░░░░░░░ 20% Translating...          │
│                                                             │
│  ⏳ QUEUED  학회 발표 영상                                   │
│            Waiting... (position 1)                          │
│                                                             │
│  🔴 FAILED  테스트 영상                                      │
│            Error: Subtitle extraction failed                │
│            [Retry] [Delete]                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Approve All Ready (2)] [Send All for Email Review]        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Published Posts                                            │
├─────────────────────────────────────────────────────────────┤
│  ✅ Clinical Insights: Dr. Lee on TORR RF                   │
│     Published Feb 5, 2026 • 1,847 words • 5 images          │
│     [View Post] [Edit] [Unpublish]                          │
│                                                             │
│  ✅ Multi-wave RF Technology Explained                      │
│     Published Feb 3, 2026 • 1,623 words • 4 images          │
│     [View Post] [Edit] [Unpublish]                          │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 편집 페이지

```
┌────────────────────────────┬────────────────────────────────┐
│  Metadata                  │  Live Preview                  │
├────────────────────────────┤                                │
│                            │  ┌────────────────────────┐   │
│  Title                     │  │                        │   │
│  [Clinical Insights: Dr__] │  │  [미리보기 렌더링]      │   │
│                            │  │                        │   │
│  Slug                      │  │  - 실제 블로그처럼 보임 │   │
│  [dr-kim-torr-rf-insights] │  │  - 이미지 포함          │   │
│                            │  │  - 영상 임베드          │   │
│  Description               │  │  - 의사 프로필 섹션     │   │
│  [Dr. Kim shares clinic__] │  │                        │   │
│  143/160 chars             │  │                        │   │
│                            │  │                        │   │
│  Tags                      │  │                        │   │
│  [TORR RF, skin tightening]│  │                        │   │
│                            │  │                        │   │
│  Featured Image            │  │                        │   │
│  [📷 torr-rf-hero.webp]    │  │                        │   │
│  [Change]                  │  │                        │   │
│                            │  │                        │   │
├────────────────────────────┤  │                        │   │
│  👨‍⚕️ Expert Profile        │  │                        │   │
├────────────────────────────┤  │                        │   │
│  Name: Dr. Kim Minjun      │  │                        │   │
│  Credentials: MD, PhD      │  │                        │   │
│  Affiliation: ABC Clinic   │  │                        │   │
│                            │  │                        │   │
│  ✅ 23 publications found  │  │                        │   │
│  ✅ IMCAS speaker verified │  │                        │   │
│  ⚠️ Education: unverified  │  │                        │   │
│                            │  │                        │   │
│  [Edit Profile] [Re-search]│  │                        │   │
│                            │  └────────────────────────┘   │
├────────────────────────────┴────────────────────────────────┤
│  Content Editor                                             │
├─────────────────────────────────────────────────────────────┤
│  [B] [I] [H1] [H2] [•] [1.] [🔗] [📷] [🎬] [</>]           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  # Clinical Insights: Dr. Kim on TORR RF Results   │   │
│  │                                                     │   │
│  │  [YouTube Video Embed]                             │   │
│  │                                                     │   │
│  │  ## Key Takeaways                                  │   │
│  │  - Point one about the treatment...               │   │
│  │  - Point two about results...                     │   │
│  │                                                     │   │
│  │  [Image 1: RF skin penetration diagram]           │   │
│  │  Caption: Multi-wave RF energy reaching dermal... │   │
│  │                                                     │   │
│  │  ## Interview                                      │   │
│  │  **Q: What makes TORR RF different?**             │   │
│  │  ...                                               │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🖼️ Images (5)                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │ [img1]  │ │ [img2]  │ │ [img3]  │ │ [img4]  │ │[img5] │ │
│  │ 📷      │ │ 📷      │ │ 📷      │ │ 📷      │ │ 📷    │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │
│  [Click to edit alt text, regenerate, or replace]          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Save Draft]  [Send Approval Email]  [Approve & Publish]  │
└─────────────────────────────────────────────────────────────┘
```

### 10.3 이미지 편집 모달

```
┌─────────────────────────────────────────────────────────────┐
│  Edit Image 2 of 5                                    [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────┐                 │
│  │                                       │                 │
│  │         [이미지 미리보기]              │                 │
│  │                                       │                 │
│  └───────────────────────────────────────┘                 │
│                                                             │
│  Alt Text (required for SEO)                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Multi-wave RF energy penetrating skin layers        │   │
│  └─────────────────────────────────────────────────────┘   │
│  87/125 characters                                         │
│                                                             │
│  Caption (optional)                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Illustration showing how TORR RF delivers energy    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Generation Prompt                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Medical illustration showing RF energy waves        │   │
│  │ penetrating through epidermis and dermis layers...  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [🔄 Regenerate Image]  [📤 Upload Different Image]        │
│                                                             │
│                                    [Cancel]  [Save Changes] │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. D1 스키마

```sql
-- 작업 큐
CREATE TABLE blog_jobs (
  id TEXT PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  youtube_video_id TEXT,
  youtube_title TEXT,
  youtube_thumbnail TEXT,
  channel_name TEXT,
  channel_url TEXT,
  
  status TEXT DEFAULT 'queued',
  -- queued, extracting, translating, generating, researching, imaging, optimizing, ready, approved, published, failed
  
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at INTEGER DEFAULT (unixepoch()),
  started_at INTEGER,
  completed_at INTEGER,
  
  UNIQUE(youtube_url)
);

-- 생성된 블로그 글
CREATE TABLE blog_posts (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES blog_jobs(id),
  
  youtube_url TEXT NOT NULL,
  youtube_title TEXT,
  original_transcript TEXT,
  english_transcript TEXT,
  
  -- 메타데이터 (자동 추출, 편집 가능)
  title TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  tags TEXT,
  
  -- 본문
  content TEXT,
  word_count INTEGER,
  
  -- 대표 이미지
  featured_image TEXT,
  featured_image_alt TEXT,
  
  -- 의사 프로필
  doctor_name TEXT,
  doctor_credentials TEXT,
  doctor_affiliation TEXT,
  doctor_specialty TEXT,
  doctor_profile TEXT,  -- JSON: full profile data
  doctor_verified INTEGER DEFAULT 0,
  
  -- 생성된 이미지들
  images TEXT,  -- JSON: [{url, alt, caption, position, prompt}]
  
  -- 상태
  status TEXT DEFAULT 'draft',
  -- draft, pending, approved, published
  
  approval_token TEXT,
  token_expires_at INTEGER,
  
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER,
  published_at INTEGER,
  published_url TEXT
);

-- 채널 캐시
CREATE TABLE youtube_channels (
  channel_url TEXT PRIMARY KEY,
  channel_id TEXT,
  channel_name TEXT,
  thumbnail_url TEXT,
  video_count INTEGER,
  last_fetched_at INTEGER
);

-- 채널 영상 목록
CREATE TABLE youtube_videos (
  video_id TEXT PRIMARY KEY,
  channel_url TEXT REFERENCES youtube_channels(channel_url),
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  published_at INTEGER,
  duration TEXT,
  processed INTEGER DEFAULT 0,
  processed_at INTEGER,
  blog_post_id TEXT REFERENCES blog_posts(id)
);

-- 인덱스
CREATE INDEX idx_jobs_status ON blog_jobs(status);
CREATE INDEX idx_posts_status ON blog_posts(status);
CREATE INDEX idx_videos_channel ON youtube_videos(channel_url);
CREATE INDEX idx_videos_processed ON youtube_videos(processed);
```

---

## 12. API 엔드포인트

### 큐 관리
```
POST   /api/blog/queue              - URL(들) 큐에 추가
GET    /api/blog/queue              - 큐 목록 조회 (필터: status)
GET    /api/blog/queue/:id          - 개별 작업 상태
POST   /api/blog/queue/:id/retry    - 실패한 작업 재시도
DELETE /api/blog/queue/:id          - 큐에서 제거
```

### 블로그 글
```
GET    /api/blog/posts              - 글 목록
GET    /api/blog/posts/:id          - 글 상세
PUT    /api/blog/posts/:id          - 글 수정 (메타, 본문, 이미지)
POST   /api/blog/posts/:id/save     - 초안 저장
DELETE /api/blog/posts/:id          - 글 삭제
```

### 승인 & 발행
```
POST   /api/blog/posts/:id/send-approval  - 컨펌 이메일 발송
POST   /api/blog/posts/:id/approve        - 어드민에서 승인
GET    /api/blog/approve                  - 이메일 버튼 승인 (?token=xxx)
POST   /api/blog/posts/:id/publish        - GitHub 커밋 & 발행
POST   /api/blog/posts/:id/unpublish      - 발행 취소
```

### 이미지
```
POST   /api/blog/posts/:id/regenerate-image  - 특정 이미지 재생성
POST   /api/blog/posts/:id/upload-image      - 이미지 직접 업로드
```

### 의사 프로필
```
POST   /api/blog/posts/:id/research-doctor   - 의사 프로필 재조사
PUT    /api/blog/posts/:id/doctor            - 의사 정보 수동 수정
```

### YouTube
```
GET    /api/youtube/channel          - 채널 영상 목록 (?url=xxx)
POST   /api/youtube/channel/refresh  - 채널 새로고침
```

### Worker (내부)
```
POST   /api/blog/worker/process      - Cron에서 호출, 큐 처리
```

---

## 13. 파일 구조

```
src/pages/admin/youtube-to-blog/
├── index.astro                    # 메인 대시보드
├── [id]/
│   ├── index.astro               # 편집 페이지
│   └── preview.astro             # 미리보기 (이메일 링크용)

src/components/admin/youtube-to-blog/
├── InputTabs.tsx                  # Single/Multiple/Channel 탭
├── SingleUrlInput.tsx
├── MultipleUrlInput.tsx
├── ChannelInput.tsx
├── ChannelVideoList.tsx
├── ProcessingQueue.tsx            # 큐 대시보드
├── QueueItem.tsx                  # 개별 작업 카드
├── PublishedPosts.tsx
├── BlogEditor.tsx                 # TipTap 에디터 wrapper
├── BlogPreview.tsx                # 실시간 미리보기
├── MetadataPanel.tsx              # 메타데이터 편집
├── DoctorProfilePanel.tsx         # 의사 프로필 편집
├── ImageGallery.tsx               # 이미지 목록
├── ImageEditModal.tsx             # 이미지 편집 모달
└── ApprovalButtons.tsx            # 승인 버튼들

src/pages/api/blog/
├── queue.ts                       # POST, GET
├── queue/[id].ts                  # GET, DELETE
├── queue/[id]/retry.ts            # POST
├── posts.ts                       # GET
├── posts/[id].ts                  # GET, PUT, DELETE
├── posts/[id]/save.ts
├── posts/[id]/send-approval.ts
├── posts/[id]/approve.ts
├── posts/[id]/publish.ts
├── posts/[id]/unpublish.ts
├── posts/[id]/regenerate-image.ts
├── posts/[id]/upload-image.ts
├── posts/[id]/research-doctor.ts
├── posts/[id]/doctor.ts
├── approve.ts                     # GET (이메일 토큰)
├── worker/process.ts              # 백그라운드 처리

src/pages/api/youtube/
├── channel.ts
└── channel/refresh.ts

src/lib/youtube-to-blog/
├── youtube.ts                     # 자막 추출, 채널 수집
├── gemini.ts                      # 번역, 이미지 생성, 의사 조사
├── claude.ts                      # 글 생성 (Opus 4.5)
├── images.ts                      # Sharp 최적화, R2 업로드
├── github.ts                      # 커밋
├── email.ts                       # Resend 이메일
├── queue.ts                       # 큐 관리 로직
└── schemas.ts                     # Zod 스키마

src/lib/youtube-to-blog/templates/
├── blog-post.md                   # 마크다운 템플릿
├── expert-profile.md              # 의사 프로필 섹션
└── schema-json-ld.ts              # Schema.org 생성
```

---

## 14. 이메일 템플릿

### 컨펌 요청

```
Subject: [BRITZMEDI Blog] Review Required: {title}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEW BLOG POST READY FOR REVIEW

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Title: {title}

🎬 Source: {youtube_title}

👨‍⚕️ Expert: {doctor_name}, {doctor_credentials}
   {doctor_affiliation}
   ✓ {publication_count} publications verified

📊 Stats:
   • {word_count} words
   • {image_count} images generated
   • Reading time: {reading_time} min

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[PREVIEW POST]  [APPROVE & PUBLISH]  [EDIT IN ADMIN]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ This approval link expires in 24 hours.

—
BRITZMEDI Blog System
https://britzmedi.com
```

### 발행 완료

```
Subject: [BRITZMEDI Blog] Published ✅ {title}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR POST IS NOW LIVE! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 {title}

🔗 {published_url}

📊 Post Stats:
   • {word_count} words
   • {image_count} images
   • Expert: {doctor_name}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[VIEW POST]  [SHARE ON LINKEDIN]  [CREATE ANOTHER]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

—
BRITZMEDI Blog System
https://britzmedi.com
```

---

## 15. Worker 로직 (백그라운드 처리)

```typescript
// Cloudflare Cron Trigger: */1 * * * * (매분)
// 또는 Queue consumer

async function processQueue() {
  // 1. 처리 중인 작업 수 확인
  const inProgress = await db.query(
    "SELECT COUNT(*) FROM blog_jobs WHERE status IN ('extracting', 'translating', 'generating', 'researching', 'imaging', 'optimizing')"
  );
  
  if (inProgress >= MAX_CONCURRENT_JOBS) return;
  
  // 2. 대기 중인 작업 가져오기
  const job = await db.query(
    "SELECT * FROM blog_jobs WHERE status = 'queued' ORDER BY created_at LIMIT 1"
  );
  
  if (!job) return;
  
  // 3. 처리 시작
  try {
    await updateJob(job.id, { status: 'extracting', started_at: now() });
    
    // Step 1: 자막 추출
    const transcript = await extractSubtitles(job.youtube_url);
    await updateJob(job.id, { progress: 10, current_step: 'Subtitles extracted' });
    
    // Step 2: 번역 (Gemini)
    await updateJob(job.id, { status: 'translating', progress: 20 });
    const englishTranscript = await translateWithGemini(transcript);
    await updateJob(job.id, { progress: 30, current_step: 'Translated to English' });
    
    // Step 3: 글 생성 (Claude Opus 4.5)
    await updateJob(job.id, { status: 'generating', progress: 40 });
    const article = await generateWithClaude(englishTranscript);
    await updateJob(job.id, { progress: 50, current_step: 'Article generated' });
    
    // Step 4: 의사 프로필 조사 (Gemini)
    await updateJob(job.id, { status: 'researching', progress: 55 });
    const doctorProfile = await researchDoctor(article.doctor);
    await updateJob(job.id, { progress: 60, current_step: 'Doctor profile researched' });
    
    // Step 5: 이미지 생성 (Gemini Nano Banana)
    await updateJob(job.id, { status: 'imaging', progress: 65 });
    const images = [];
    for (let i = 0; i < article.images.length; i++) {
      const image = await generateImage(article.images[i].prompt);
      images.push(image);
      await updateJob(job.id, { 
        progress: 65 + (i + 1) * 5, 
        current_step: `Generated image ${i + 1}/${article.images.length}` 
      });
    }
    
    // Step 6: 이미지 최적화 & 업로드
    await updateJob(job.id, { status: 'optimizing', progress: 90 });
    const optimizedImages = await optimizeAndUpload(images);
    
    // Step 7: 블로그 글 저장
    await createBlogPost({
      job_id: job.id,
      ...article,
      doctor_profile: doctorProfile,
      images: optimizedImages
    });
    
    // 완료
    await updateJob(job.id, { 
      status: 'ready', 
      progress: 100, 
      completed_at: now() 
    });
    
  } catch (error) {
    await updateJob(job.id, { 
      status: 'failed', 
      error_message: error.message,
      retry_count: job.retry_count + 1
    });
  }
}
```

---

## 16. 중요 사항

### 언어
- 최종 출력: 영어 (글로벌 사이트)
- 한국어 자막 → Gemini 영어 번역

### 글 품질
- Claude Opus 4.5 사용
- 자연스럽고 세련된 문체
- AI가 쓴 티 안 나게

### 메타데이터
- Claude가 본문에서 자동 추출
- 모두 편집 가능

### 의사 프로필
- Gemini 웹 검색으로 자동 조사
- PubMed 논문 검색
- 검증 안 된 정보는 명시
- 수동 편집 가능

### 이미지
- AEO/GEO 기준 준수
- WebP 포맷, alt 필수
- 글 맥락에 맞게 자동 생성
- 재생성/교체 가능

### 에디터
- TipTap (이미지, 영상 지원)
- 마크다운 모드 전환 가능
- 실시간 미리보기

### 승인
- 어드민에서 직접 승인
- 이메일 버튼으로 원클릭 승인
- 토큰 24시간 만료

### 병렬 처리
- 최대 3개 동시 처리
- 실패 시 자동 재시도 (3회)
- 진행 상태 실시간 표시

기존 어드민 디자인/스타일과 일관되게 만들어줘.
