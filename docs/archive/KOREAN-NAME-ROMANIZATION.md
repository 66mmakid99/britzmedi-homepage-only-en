# YouTube to Blog — 한국 인명 영문화 + 의사 프로필 조사

전부 순서대로 실행해. 중간에 멈추지 마.

핵심 문제: 번역 단계에서 한국 인명 "서의석" → "Yui Saksayo"로 잘못 변환.
원인: Claude가 한국어 이름을 일반 단어처럼 번역함. 이름은 번역이 아니라 로마자 표기해야 함.

---

## Phase 0: 현재 코드 확인

```bash
# YouTube to Blog 관련 파일 전체 구조 확인
find src -name "*youtube*" -o -name "*blog*" -o -name "*transcript*" | head -30

# 번역 단계 코드 확인
grep -rn "translat" src/pages/api/blog/ src/lib/youtube* 2>/dev/null | head -20

# 글 생성 프롬프트 확인
grep -rn "Transform\|transcript\|blog.*article\|doctor\|의사" src/lib/youtube* src/pages/api/blog/ 2>/dev/null | head -20
```

결과 먼저 보여줘.

---

## Phase 1: 한국어 인명 로마자 표기 모듈

파일: `src/lib/korean-romanization.ts`

```typescript
/**
 * 한국어 인명을 올바른 영문 표기로 변환하는 모듈.
 * 
 * 규칙:
 * 1. 한국 인명은 "번역"하지 않고 "로마자 표기(romanization)"한다
 * 2. 성(family name)은 먼저, 이름(given name)은 뒤에 (국제 표기)
 * 3. 또는 영어권 순서: Given Name + Family Name
 * 4. 표준: 문화체육관광부 로마자 표기법 (Revised Romanization)
 */

// 흔한 한국 성씨 로마자 매핑 (관용 표기 우선)
export const KOREAN_FAMILY_NAMES: Record<string, string[]> = {
  '김': ['Kim'],
  '이': ['Lee', 'Yi'],
  '박': ['Park', 'Pak'],
  '최': ['Choi', 'Choe'],
  '정': ['Jung', 'Jeong', 'Chung'],
  '강': ['Kang', 'Gang'],
  '조': ['Cho', 'Jo'],
  '윤': ['Yoon', 'Yun'],
  '장': ['Jang', 'Chang'],
  '임': ['Lim', 'Im'],
  '한': ['Han'],
  '오': ['Oh', 'O'],
  '서': ['Seo', 'Suh'],
  '신': ['Shin', 'Sin'],
  '권': ['Kwon', 'Gwon'],
  '황': ['Hwang'],
  '안': ['Ahn', 'An'],
  '송': ['Song'],
  '류': ['Ryu', 'Yoo'],
  '유': ['Yoo', 'Yu'],
  '전': ['Jeon', 'Jun', 'Chun'],
  '홍': ['Hong'],
  '고': ['Ko', 'Go'],
  '문': ['Moon', 'Mun'],
  '양': ['Yang'],
  '손': ['Son'],
  '배': ['Bae', 'Bai'],
  '백': ['Baek', 'Paek'],
  '허': ['Heo', 'Hur', 'Huh'],
  '노': ['Noh', 'Roh'],
  '심': ['Shim', 'Sim'],
  '하': ['Ha'],
  '주': ['Joo', 'Ju'],
  '우': ['Woo', 'U'],
  '구': ['Koo', 'Ku', 'Gu'],
  '남': ['Nam'],
  '민': ['Min'],
  '차': ['Cha'],
  '지': ['Ji'],
  '성': ['Sung', 'Seong'],
  '표': ['Pyo'],
  '변': ['Byun', 'Byeon'],
  '도': ['Do'],
  '석': ['Seok', 'Suk'],
  '선': ['Sun', 'Seon'],
  '설': ['Seol', 'Sul'],
  '마': ['Ma'],
  '길': ['Gil', 'Kil'],
  '연': ['Yeon', 'Yun'],
  '방': ['Bang'],
  '위': ['Wi'],
  '피': ['Pi'],
  '원': ['Won'],
  '천': ['Cheon', 'Chun'],
  '탁': ['Tak'],
  '봉': ['Bong'],
  '학': ['Hak'],
};

// 흔한 이름 글자 로마자 매핑
export const KOREAN_GIVEN_NAME_CHARS: Record<string, string> = {
  '가': 'Ga', '각': 'Gak', '간': 'Gan', '강': 'Gang',
  '건': 'Geon', '결': 'Gyeol',
  '경': 'Gyeong', '계': 'Gye',
  '고': 'Go', '곤': 'Gon', '광': 'Gwang',
  '구': 'Gu', '국': 'Guk', '군': 'Gun', '권': 'Gwon',
  '근': 'Geun', '기': 'Gi', '길': 'Gil',
  '나': 'Na', '남': 'Nam',
  '다': 'Da', '대': 'Dae', '덕': 'Deok',
  '도': 'Do', '동': 'Dong', '두': 'Du',
  '라': 'Ra', '래': 'Rae', '련': 'Ryeon',
  '로': 'Ro', '록': 'Rok', '룡': 'Ryong',
  '리': 'Ri',
  '마': 'Ma', '만': 'Man', '명': 'Myeong',
  '모': 'Mo', '무': 'Mu', '문': 'Mun', '미': 'Mi', '민': 'Min',
  '바': 'Ba', '박': 'Bak', '배': 'Bae', '백': 'Baek',
  '범': 'Beom', '병': 'Byeong', '보': 'Bo', '복': 'Bok',
  '봉': 'Bong', '부': 'Bu', '빈': 'Bin',
  '사': 'Sa', '산': 'San', '상': 'Sang',
  '서': 'Seo', '석': 'Seok', '선': 'Seon', '설': 'Seol',
  '성': 'Seong', '세': 'Se', '소': 'So', '솔': 'Sol',
  '송': 'Song', '수': 'Su', '숙': 'Suk', '순': 'Sun',
  '승': 'Seung', '시': 'Si', '신': 'Sin',
  '아': 'A', '안': 'An', '애': 'Ae',
  '양': 'Yang', '연': 'Yeon', '영': 'Yeong',
  '예': 'Ye', '오': 'O', '옥': 'Ok',
  '완': 'Wan', '용': 'Yong', '우': 'U', 'Woo': 'Woo',
  '운': 'Un', '원': 'Won', '월': 'Wol',
  '위': 'Wi', '유': 'Yu', '윤': 'Yun', '율': 'Yul',
  '은': 'Eun', '의': 'Eui', '이': 'I',
  '인': 'In', '일': 'Il',
  '자': 'Ja', '재': 'Jae', '정': 'Jeong', '제': 'Je',
  '조': 'Jo', '종': 'Jong', '주': 'Ju', '준': 'Jun',
  '중': 'Jung', '지': 'Ji', '진': 'Jin',
  '찬': 'Chan', '창': 'Chang', '채': 'Chae',
  '천': 'Cheon', '철': 'Cheol', '청': 'Cheong',
  '초': 'Cho', '충': 'Chung',
  '태': 'Tae', '택': 'Taek',
  '하': 'Ha', '한': 'Han', '해': 'Hae', '혁': 'Hyeok',
  '현': 'Hyeon', '형': 'Hyeong', '혜': 'Hye',
  '호': 'Ho', '홍': 'Hong', '화': 'Hwa', '환': 'Hwan',
  '회': 'Hoe', '효': 'Hyo', '훈': 'Hun', '휘': 'Hwi',
  '희': 'Hee', '히': 'Hi',
};

/**
 * 한국 이름을 로마자 표기로 변환
 * @param koreanName 한글 이름 (예: "서의석")
 * @returns 영문 이름 옵션들 (예: ["Seo Eui-seok", "Suh Eui-seok"])
 */
export function romanizeKoreanName(koreanName: string): {
  primary: string;      // 가장 일반적인 표기
  alternatives: string[]; // 대안 표기들
  familyName: string;
  givenName: string;
  westernOrder: string;  // Given Family 순서
} {
  const name = koreanName.trim();
  
  // 이미 영문이면 그대로 반환
  if (/^[a-zA-Z\s\-\.]+$/.test(name)) {
    const parts = name.split(/\s+/);
    return {
      primary: name,
      alternatives: [],
      familyName: parts[parts.length - 1],
      givenName: parts.slice(0, -1).join(' '),
      westernOrder: name
    };
  }

  // 한글 이름 분해: 첫 글자 = 성, 나머지 = 이름
  const chars = [...name];
  
  // 성씨 추출 (보통 1글자, 드물게 2글자)
  let familyNameKr = '';
  let givenNameKr = '';
  
  // 2글자 성 체크 (남궁, 선우, 제갈, 사공, 독고, 황보 등)
  const twoCharFamilyNames = ['남궁', '선우', '제갈', '사공', '독고', '황보', '어금'];
  const firstTwo = chars.slice(0, 2).join('');
  if (twoCharFamilyNames.includes(firstTwo)) {
    familyNameKr = firstTwo;
    givenNameKr = chars.slice(2).join('');
  } else {
    familyNameKr = chars[0];
    givenNameKr = chars.slice(1).join('');
  }

  // 성 로마자화
  const familyOptions = KOREAN_FAMILY_NAMES[familyNameKr] || [romanizeChar(familyNameKr)];
  const primaryFamily = familyOptions[0];

  // 이름 로마자화
  const givenChars = [...givenNameKr];
  const givenRoman = givenChars.map(ch => KOREAN_GIVEN_NAME_CHARS[ch] || romanizeChar(ch));
  
  // 이름 형식: 첫 글자 대문자 + 하이픈 + 두번째 소문자
  let givenName = '';
  if (givenRoman.length === 2) {
    givenName = `${givenRoman[0]}-${givenRoman[1].toLowerCase()}`;
  } else if (givenRoman.length === 1) {
    givenName = givenRoman[0];
  } else {
    givenName = givenRoman.join('-');
  }

  const primary = `${primaryFamily} ${givenName}`;
  
  // 대안 표기
  const alternatives = familyOptions.slice(1).map(f => `${f} ${givenName}`);

  // 서양식 순서 (Given Family)
  const westernOrder = `${givenName} ${primaryFamily}`;

  return {
    primary,          // "Seo Eui-seok"
    alternatives,     // ["Suh Eui-seok"]
    familyName: primaryFamily,  // "Seo"
    givenName,        // "Eui-seok"
    westernOrder      // "Eui-seok Seo"
  };
}

// 개별 한글 글자를 로마자로 (매핑에 없는 경우 fallback)
function romanizeChar(char: string): string {
  if (KOREAN_GIVEN_NAME_CHARS[char]) return KOREAN_GIVEN_NAME_CHARS[char];
  // 기본 자모 분해 로마자화 (간단 버전)
  return char; // fallback — Claude가 처리
}

/**
 * 텍스트에서 한국 인명 패턴 감지
 * "서의석 원장", "김민수 교수", "박지영 선생님" 등
 */
export function detectKoreanNames(text: string): {
  name: string;
  title?: string;
  position: number;
}[] {
  const patterns = [
    // "서의석 원장님", "김민수 교수님", "박지영 대표님"
    /([가-힣]{2,4})\s*(원장|교수|대표|원장님|교수님|대표님|선생님|의사|박사|실장|부원장|전문의|과장)/g,
    // "Dr. 서의석", "닥터 김민수"
    /(?:Dr\.\s*|닥터\s*)([가-힣]{2,4})/g,
    // "[이름] 피부과", "[이름] 성형외과"  
    /([가-힣]{2,4})\s*(?:피부과|성형외과|의원|클리닉|병원)/g,
  ];

  const results: { name: string; title?: string; position: number; }[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1];
      if (!seen.has(name) && name.length >= 2) {
        seen.add(name);
        results.push({
          name,
          title: match[2] || undefined,
          position: match.index
        });
      }
    }
  }

  return results;
}

/**
 * 의사 직함을 영문으로 변환
 */
export function romanizeTitle(koreanTitle: string): string {
  const titleMap: Record<string, string> = {
    '원장': 'Director',
    '원장님': 'Director',
    '부원장': 'Vice Director',
    '교수': 'Professor',
    '교수님': 'Professor',
    '대표': 'CEO',
    '대표님': 'CEO',
    '선생님': 'Doctor',
    '의사': 'Doctor',
    '박사': 'Ph.D.',
    '전문의': 'Board-certified Specialist',
    '실장': 'Chief',
    '과장': 'Department Head',
    '피부과': 'Dermatology',
    '성형외과': 'Plastic Surgery',
    '레이저': 'Laser Medicine',
  };
  return titleMap[koreanTitle] || koreanTitle;
}
```

---

## Phase 2: 번역 프롬프트에 인명 보호 규칙 추가

YouTube to Blog의 번역 단계 코드를 찾아서 수정.

```bash
# 번역 프롬프트가 있는 파일 찾기
grep -rn "translat\|Translate" src/pages/api/blog/queue/*/step/ src/lib/youtube* 2>/dev/null
```

### 번역 프롬프트에 추가할 규칙:

기존 번역 프롬프트를 찾아서 아래 규칙을 반드시 포함:

```
CRITICAL TRANSLATION RULES FOR KOREAN NAMES:

1. KOREAN PERSON NAMES: NEVER translate Korean names phonetically or by meaning. Korean names must be ROMANIZED using standard Korean romanization rules.
   - 서의석 → "Seo Eui-seok" (NOT "Yui Saksayo" or any other phonetic guess)
   - 김민수 → "Kim Min-su" (NOT "Minsoo Kim" unless that's their known English name)
   - 박지영 → "Park Ji-yeong"

2. NAME FORMAT: Family name first: "Seo Eui-seok" or Western order: "Eui-seok Seo"
   - Family name (성): First character, capitalize: Kim, Lee, Park, Choi, Seo, etc.
   - Given name (이름): Remaining characters, hyphenated, first letter cap: Eui-seok, Min-su, Ji-yeong

3. KOREAN TITLES: Romanize properly:
   - 원장/원장님 → "Director" (clinic director)
   - 교수/교수님 → "Professor"  
   - 전문의 → "Board-certified specialist"
   - 피부과 전문의 → "Board-certified dermatologist"
   - 성형외과 전문의 → "Board-certified plastic surgeon"

4. HOSPITAL/CLINIC NAMES: Keep the Korean romanization + English description:
   - "서울피부과" → "Seoul Dermatology Clinic (서울피부과)"
   - "강남성형외과" → "Gangnam Plastic Surgery Clinic (강남성형외과)"

5. PRESERVE ORIGINAL: Always include the Korean name in parentheses on first mention:
   - "Dr. Seo Eui-seok (서의석)"

6. COMMON FAMILY NAME ROMANIZATIONS (use these, not phonetic guesses):
   김=Kim, 이=Lee, 박=Park, 최=Choi, 정=Jung/Jeong, 강=Kang, 조=Cho,
   윤=Yoon, 장=Jang, 임=Lim, 한=Han, 오=Oh, 서=Seo, 신=Shin, 권=Kwon,
   황=Hwang, 안=Ahn, 송=Song, 류=Ryu, 유=Yoo, 전=Jeon, 홍=Hong, 고=Ko,
   문=Moon, 배=Bae, 백=Baek, 허=Heo, 노=Noh
```

---

## Phase 3: 글 생성 프롬프트에도 인명 규칙 추가

글 생성(Generate Article) 단계 프롬프트에도 동일 규칙 추가.

특히 doctor 정보 출력 부분:

```
## Doctor Name Rules
- The doctor's name in the article MUST use proper Korean romanization
- First mention: "Dr. [Romanized Name] ([Korean Name])" — e.g., "Dr. Seo Eui-seok (서의석)"
- Subsequent mentions: "Dr. Seo" (family name only)
- NEVER invent or guess an English name for a Korean doctor
- If unsure about romanization, keep the Korean name as-is and flag for manual review

## Doctor JSON output
"doctor": {
  "name": "Dr. Seo Eui-seok",           // Romanized
  "name_korean": "서의석",                // Original Korean
  "name_display": "Dr. Seo Eui-seok (서의석)", // For article use
  "credentials": "Board-certified [specialty]",
  "affiliation": "[Hospital/Clinic name]",
  "specialty": "[Specialty]"
}
```

---

## Phase 4: 번역 후 인명 검증 후처리

번역이 완료된 후, 인명이 올바르게 변환되었는지 자동 검증:

파일: `src/lib/youtube-to-blog/postprocess.ts` (또는 기존 후처리 파일)

```typescript
import { detectKoreanNames, romanizeKoreanName, romanizeTitle } from '../korean-romanization';

/**
 * 번역된 텍스트에서 잘못된 인명 변환을 감지하고 수정
 * 
 * @param originalKorean 원본 한국어 자막
 * @param translatedEnglish 번역된 영문 텍스트
 * @returns 수정된 영문 텍스트 + 감지된 인명 목록
 */
export function validateAndFixNames(
  originalKorean: string,
  translatedEnglish: string
): {
  fixed: string;
  detectedNames: { korean: string; romanized: string; title?: string }[];
  corrections: { original: string; corrected: string }[];
} {
  // 1. 원본 한국어에서 인명 감지
  const koreanNames = detectKoreanNames(originalKorean);
  
  const detectedNames: { korean: string; romanized: string; title?: string }[] = [];
  const corrections: { original: string; corrected: string }[] = [];
  let fixed = translatedEnglish;

  for (const detected of koreanNames) {
    const romanized = romanizeKoreanName(detected.name);
    const titleEn = detected.title ? romanizeTitle(detected.title) : undefined;
    
    detectedNames.push({
      korean: detected.name,
      romanized: romanized.primary,
      title: titleEn
    });

    // 2. 번역문에서 이 이름이 올바르게 표기되었는지 확인
    // 올바른 표기가 이미 있으면 스킵
    if (fixed.includes(romanized.primary) || fixed.includes(romanized.westernOrder)) {
      continue;
    }

    // 3. 잘못된 표기 감지 — 원본 이름 근처의 맥락으로 찾기
    // "Dr. [잘못된 이름]" 패턴 찾기
    // 번역기가 만든 잘못된 이름은 예측이 어려우므로,
    // "Dr. " 다음에 오는 이름이 우리가 아는 올바른 표기가 아니면 교체 대상
    
    // 방법: Claude에게 교체 요청 (가장 안전)
    // 이 단계는 Phase 5에서 Claude 호출로 처리
  }

  return { fixed, detectedNames, corrections };
}
```

---

## Phase 5: 파이프라인 통합

YouTube to Blog 파이프라인에서 번역 → 글 생성 사이에 인명 검증 단계 삽입:

### 5-1. 번역 단계 후 (translate step 완료 후)

```typescript
import { detectKoreanNames, romanizeKoreanName } from '../../lib/korean-romanization';

// 번역 완료 후:
// 1. 원본 한국어 자막에서 인명 감지
const originalTranscript = job.original_transcript; // 한국어 원본
const translatedTranscript = job.translated_transcript; // 번역된 영문

const detectedNames = detectKoreanNames(originalTranscript);

if (detectedNames.length > 0) {
  // 2. 각 인명을 올바르게 로마자화
  const nameMap = detectedNames.map(n => ({
    korean: n.name,
    romanized: romanizeKoreanName(n.name).primary,
    title: n.title
  }));

  // 3. Claude에게 번역문의 잘못된 이름을 교정 요청
  const nameFixPrompt = `The following English translation of a Korean video transcript contains incorrectly translated Korean person names. Korean names should be ROMANIZED, not translated.

Here are the correct name mappings:
${nameMap.map(n => `- Korean: ${n.korean} → Correct English: ${n.romanized}${n.title ? ` (${n.title})` : ''}`).join('\n')}

Find and replace ALL incorrect versions of these names in the text below. The translator may have produced bizarre phonetic translations — replace them with the correct romanizations listed above.

On first mention of each person, use format: "Dr. [Name] ([Korean Name])" — e.g., "Dr. ${nameMap[0]?.romanized} (${nameMap[0]?.korean})"

Return ONLY the corrected text, nothing else.

Text to fix:
${translatedTranscript}`;

  const correctedTranscript = await callClaude(env, {
    messages: [{ role: 'user', content: nameFixPrompt }]
  });

  // 4. 교정된 번역문으로 업데이트
  await env.DB.prepare(
    'UPDATE blog_queue SET translated_transcript = ?, detected_names = ? WHERE id = ?'
  ).bind(
    correctedTranscript,
    JSON.stringify(nameMap),
    jobId
  ).run();
}
```

### 5-2. 글 생성 단계에서 인명 정보 전달

Generate Article 프롬프트에 감지된 인명 정보를 주입:

```typescript
// 감지된 이름 가져오기
const detectedNames = JSON.parse(job.detected_names || '[]');

// 프롬프트에 추가
const nameContext = detectedNames.length > 0 
  ? `\n\nDOCTOR/EXPERT NAMES (use these exact romanizations):\n${detectedNames.map(n => 
      `- ${n.romanized} (${n.korean})${n.title ? ` — ${n.title}` : ''}`
    ).join('\n')}\n\nFirst mention: "Dr. ${detectedNames[0].romanized} (${detectedNames[0].korean})"\nSubsequent: "Dr. ${detectedNames[0].romanized.split(' ')[0]}"\n`
  : '';

// 기존 프롬프트에 nameContext 삽입
```

---

## Phase 6: 의사 프로필 조사 (Research 단계)

이전 설계에 있었던 의사 프로필 자동 조사. Research 단계에서 실행:

```typescript
// Research 단계에서 의사 프로필 조사 추가
const detectedNames = JSON.parse(job.detected_names || '[]');

if (detectedNames.length > 0) {
  const primaryDoctor = detectedNames[0];
  
  const profilePrompt = `Research this Korean medical professional for a blog article. Compile their professional profile.

Name (Korean): ${primaryDoctor.korean}
Name (English): ${primaryDoctor.romanized}
Title: ${primaryDoctor.title || 'Doctor'}
Country: South Korea

Search the web and provide a structured profile. Return JSON only:

{
  "name_english": "${primaryDoctor.romanized}",
  "name_korean": "${primaryDoctor.korean}",
  "verified_english_name": "If you find their official English name on their website/papers, use that instead",
  "credentials": "MD, PhD, Board-certified [specialty], etc.",
  "current_position": "Current role and institution",
  "affiliation": "Hospital/Clinic name",
  "specialty": "Medical specialty",
  "education": ["Medical school", "Residency", "Fellowship if any"],
  "certifications": ["Board certifications"],
  "notable_achievements": ["Key achievements, publications, conference presentations"],
  "profile_summary": "2-3 sentence professional bio suitable for blog article",
  "sources_checked": ["URLs of sources found"],
  "confidence": "high|medium|low",
  "note": "Any caveats about the information found"
}

IMPORTANT:
- If you find their OFFICIAL English name on a hospital website, academic paper, or social media, use that instead of the romanized version
- Do NOT fabricate credentials or achievements
- If you cannot find information, say "Not verified" — do not guess
- Korean academic paper databases: PubMed, KoreaMed, RISS`;

  const profileResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: profilePrompt }]
    })
  });

  const profileData = await profileResponse.json();
  const profileText = profileData.content
    ?.filter(b => b.type === 'text')
    ?.map(b => b.text)
    ?.join('\n') || '';

  const jsonMatch = profileText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const profile = JSON.parse(jsonMatch[0]);
    
    // 공식 영문 이름이 발견되면 업데이트
    if (profile.verified_english_name && profile.verified_english_name !== primaryDoctor.romanized) {
      // 글 내용에서 이름 교체
      // blog_queue에 verified_name 저장
    }

    // 프로필 저장
    await env.DB.prepare(
      'UPDATE blog_queue SET doctor_profile = ?, doctor_name = ?, doctor_name_korean = ? WHERE id = ?'
    ).bind(
      JSON.stringify(profile),
      profile.verified_english_name || primaryDoctor.romanized,
      primaryDoctor.korean,
      jobId
    ).run();
  }
}
```

---

## Phase 7: blog_queue 테이블에 컬럼 추가 (없으면)

```sql
ALTER TABLE blog_queue ADD COLUMN detected_names TEXT;
ALTER TABLE blog_queue ADD COLUMN doctor_profile TEXT;
ALTER TABLE blog_queue ADD COLUMN doctor_name TEXT;
ALTER TABLE blog_queue ADD COLUMN doctor_name_korean TEXT;
```

D1 remote 적용. 한 줄씩.

---

## Phase 8: 기존 발행글 인명 수정

이미 발행된 "Dr. Yui Saksayo" 글 수정:

```sql
-- 해당 글 찾기
SELECT id, title, status FROM content_items WHERE content LIKE '%Yui Saksayo%' OR content LIKE '%Saksayo%';
```

찾은 글의 content에서:
- "Dr. Yui Saksayo" → "Dr. Seo Eui-seok (서의석)" 로 전부 교체
- "Yui Saksayo" → "Seo Eui-seok" 로 전부 교체
- doctor_name 컬럼도 업데이트

```sql
UPDATE content_items 
SET content = REPLACE(REPLACE(content, 'Dr. Yui Saksayo', 'Dr. Seo Eui-seok (서의석)'), 'Yui Saksayo', 'Seo Eui-seok'),
    doctor_name = 'Dr. Seo Eui-seok'
WHERE content LIKE '%Saksayo%';
```

blog_posts 테이블에도 동일 적용:
```sql
UPDATE blog_posts
SET content = REPLACE(REPLACE(content, 'Dr. Yui Saksayo', 'Dr. Seo Eui-seok (서의석)'), 'Yui Saksayo', 'Seo Eui-seok'),
    doctor_name = 'Dr. Seo Eui-seok',
    doctor_name_korean = '서의석'
WHERE content LIKE '%Saksayo%';
```

---

## Phase 9: 빌드 + 배포

```bash
npm run build
git add -A
git commit -m "feat: Korean name romanization + doctor profile research for YouTube to Blog pipeline"
git push
```

---

## Phase 10: 테스트

1. 기존 "Yui Saksayo" 글이 "Seo Eui-seok"으로 교체되었는지 확인
2. YouTube to Blog에서 새 한국어 영상 URL 입력 → 이름이 올바르게 로마자화되는지 확인
3. Research 단계에서 의사 프로필 조사가 실행되는지 확인
4. 글에서 첫 번째 언급: "Dr. Seo Eui-seok (서의석)" 형식인지 확인

---

## 핵심 규칙

1. 한국 인명은 번역 아님 — 로마자 표기(romanization)
2. 서의석 → Seo Eui-seok (NOT Yui Saksayo)
3. 성씨는 관용 표기 우선: 김=Kim, 이=Lee, 박=Park, 서=Seo
4. 첫 언급: "Dr. [영문] ([한글])" 형식 필수
5. 웹 검색으로 공식 영문 이름 발견 시 그걸 사용
6. 의사 프로필은 조사 기반 — 허위 생성 금지
7. 기존 발행글도 즉시 수정
8. 안 되는 부분은 보고하고 나머지 계속 진행
9. 빌드 + 배포까지 완료해야 끝
