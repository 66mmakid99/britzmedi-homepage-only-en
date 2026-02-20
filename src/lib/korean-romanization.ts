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
  '완': 'Wan', '용': 'Yong', '우': 'U',
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
  primary: string;
  alternatives: string[];
  familyName: string;
  givenName: string;
  westernOrder: string;
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

  // 2글자 성 체크
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
    primary,
    alternatives,
    familyName: primaryFamily,
    givenName,
    westernOrder
  };
}

// 개별 한글 글자를 로마자로 (매핑에 없는 경우 fallback)
function romanizeChar(char: string): string {
  if (KOREAN_GIVEN_NAME_CHARS[char]) return KOREAN_GIVEN_NAME_CHARS[char];
  return char;
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

  const results: { name: string; title?: string; position: number }[] = [];
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
