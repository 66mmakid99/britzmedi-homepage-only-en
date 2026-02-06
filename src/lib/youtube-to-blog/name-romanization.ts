// Korean Name Romanization Pipeline
// D1 lookup -> Web search -> Korean romanization fallback -> Save to DB

// Common Korean surname romanizations
const SURNAME_MAP: Record<string, string[]> = {
  '\uae40': ['Kim'],
  '\uc774': ['Lee', 'Yi'],
  '\ubc15': ['Park', 'Pak'],
  '\ucd5c': ['Choi', 'Choe'],
  '\uc815': ['Jung', 'Jeong', 'Chung'],
  '\uac15': ['Kang', 'Gang'],
  '\uc870': ['Cho', 'Jo'],
  '\uc724': ['Yoon', 'Yun'],
  '\uc7a5': ['Jang', 'Chang'],
  '\uc784': ['Lim', 'Im'],
  '\ud55c': ['Han'],
  '\uc624': ['Oh'],
  '\uc11c': ['Seo', 'Suh'],
  '\uc2e0': ['Shin', 'Sin'],
  '\uad8c': ['Kwon', 'Gwon'],
  '\ud669': ['Hwang'],
  '\uc548': ['Ahn', 'An'],
  '\uc1a1': ['Song'],
  '\uc804': ['Jeon', 'Jun'],
  '\ud64d': ['Hong'],
  '\uc720': ['Yoo', 'Yu'],
  '\uace0': ['Ko', 'Go'],
  '\ubb38': ['Moon', 'Mun'],
  '\uc591': ['Yang'],
  '\uc190': ['Son'],
  '\ubc30': ['Bae'],
  '\ubc31': ['Baek', 'Paek'],
  '\ud5c8': ['Heo', 'Hur'],
  '\ub178': ['Noh', 'Roh'],
  '\uc2ec': ['Shim', 'Sim'],
  '\ud558': ['Ha'],
  '\uc8fc': ['Joo', 'Ju'],
  '\uad6c': ['Koo', 'Gu'],
  '\ubbc0': ['Min'],
  '\uc9c4': ['Jin'],
  '\ub098': ['Na'],
  '\uc6b0': ['Woo', 'Wu'],
  '\uc9c0': ['Ji'],
  '\uc5c4': ['Eom', 'Um'],
  '\ucc44': ['Chae'],
  '\uc6d0': ['Won'],
  '\ucc9c': ['Cheon', 'Chun'],
  '\ubc29': ['Bang'],
  '\uacf5': ['Kong', 'Gong'],
  '\uac15': ['Kang'],
  '\ud0c1': ['Tak'],
  '\ub958': ['Ryu', 'Ryoo'],
  '\ub9c8': ['Ma'],
  '\uc131': ['Sung', 'Seong'],
};

// Korean vowel/consonant romanization (Revised Romanization)
const INITIAL_CONSONANTS: Record<string, string> = {
  '\u3131': 'g', '\u3132': 'kk', '\u3134': 'n', '\u3137': 'd',
  '\u3138': 'tt', '\u3139': 'r', '\u3141': 'm', '\u3142': 'b',
  '\u3143': 'pp', '\u3145': 's', '\u3146': 'ss', '\u3147': '',
  '\u3148': 'j', '\u3149': 'jj', '\u314a': 'ch', '\u314b': 'k',
  '\u314c': 't', '\u314d': 'p', '\u314e': 'h',
};

const VOWELS: Record<string, string> = {
  '\u314f': 'a', '\u3150': 'ae', '\u3151': 'ya', '\u3152': 'yae',
  '\u3153': 'eo', '\u3154': 'e', '\u3155': 'yeo', '\u3156': 'ye',
  '\u3157': 'o', '\u3158': 'wa', '\u3159': 'wae', '\u315a': 'oe',
  '\u315b': 'yo', '\u315c': 'u', '\u315d': 'wo', '\u315e': 'we',
  '\u315f': 'wi', '\u3160': 'yu', '\u3161': 'eu', '\u3162': 'ui',
  '\u3163': 'i',
};

const FINAL_CONSONANTS: Record<string, string> = {
  '': '', '\u3131': 'k', '\u3132': 'k', '\u3133': 'k',
  '\u3134': 'n', '\u3135': 'n', '\u3136': 'n', '\u3137': 't',
  '\u3139': 'l', '\u313a': 'k', '\u313b': 'm', '\u313c': 'p',
  '\u313d': 'l', '\u313e': 'l', '\u313f': 'l', '\u3140': 'l',
  '\u3141': 'm', '\u3142': 'p', '\u3143': 'p', '\u3145': 't',
  '\u3146': 't', '\u3147': 'ng', '\u3148': 't', '\u314a': 't',
  '\u314b': 'k', '\u314c': 't', '\u314d': 'p', '\u314e': 't',
};

/**
 * Check if text contains Korean characters
 */
export function containsKorean(text: string): boolean {
  return /[\uAC00-\uD7AF\u3130-\u318F]/.test(text);
}

/**
 * Romanize a Korean name using standard rules
 */
export function romanizeKoreanName(nameKo: string): string {
  const chars = nameKo.trim().split('');
  if (chars.length < 2) return nameKo;

  // First char is surname
  const surname = chars[0];
  const surnameRoman = SURNAME_MAP[surname]?.[0];

  // Given name
  const givenName = chars.slice(1).map(ch => romanizeSyllable(ch)).join('');

  if (surnameRoman) {
    // Capitalize given name
    const capitalizedGiven = givenName.charAt(0).toUpperCase() + givenName.slice(1);
    return `${surnameRoman} ${capitalizedGiven}`;
  }

  // Fallback: romanize all syllables
  const fullRoman = chars.map(ch => romanizeSyllable(ch)).join('');
  return fullRoman.charAt(0).toUpperCase() + fullRoman.slice(1);
}

function romanizeSyllable(char: string): string {
  const code = char.charCodeAt(0);

  // Check if it's a Korean syllable (Hangul Syllables block)
  if (code < 0xAC00 || code > 0xD7AF) return char;

  const syllableIndex = code - 0xAC00;
  const initialIndex = Math.floor(syllableIndex / (21 * 28));
  const vowelIndex = Math.floor((syllableIndex % (21 * 28)) / 28);
  const finalIndex = syllableIndex % 28;

  const initials = ['\u3131', '\u3132', '\u3134', '\u3137', '\u3138', '\u3139', '\u3141', '\u3142', '\u3143', '\u3145', '\u3146', '\u3147', '\u3148', '\u3149', '\u314a', '\u314b', '\u314c', '\u314d', '\u314e'];
  const vowelChars = ['\u314f', '\u3150', '\u3151', '\u3152', '\u3153', '\u3154', '\u3155', '\u3156', '\u3157', '\u3158', '\u3159', '\u315a', '\u315b', '\u315c', '\u315d', '\u315e', '\u315f', '\u3160', '\u3161', '\u3162', '\u3163'];
  const finalChars = ['', '\u3131', '\u3132', '\u3133', '\u3134', '\u3135', '\u3136', '\u3137', '\u3139', '\u313a', '\u313b', '\u313c', '\u313d', '\u313e', '\u313f', '\u3140', '\u3141', '\u3142', '\u3143', '\u3145', '\u3146', '\u3147', '\u3148', '\u314a', '\u314b', '\u314c', '\u314d', '\u314e'];

  const initial = INITIAL_CONSONANTS[initials[initialIndex]] || '';
  const vowel = VOWELS[vowelChars[vowelIndex]] || '';
  const final = FINAL_CONSONANTS[finalChars[finalIndex]] || '';

  return initial + vowel + final;
}

/**
 * Name romanization pipeline with D1 database lookup and caching
 */
export async function romanizeName(
  db: D1Database,
  nameKo: string,
  affiliationKo?: string
): Promise<{
  nameEn: string;
  affiliationEn?: string;
  verified: boolean;
  source: string;
}> {
  // Step 1: D1 lookup
  const cached = await db.prepare(
    'SELECT name_en, affiliation_en, verified, verified_source FROM name_mappings WHERE name_ko = ?'
  ).bind(nameKo).first<{
    name_en: string;
    affiliation_en: string | null;
    verified: boolean;
    verified_source: string | null;
  }>();

  if (cached) {
    return {
      nameEn: cached.name_en,
      affiliationEn: cached.affiliation_en || undefined,
      verified: !!cached.verified,
      source: cached.verified_source || 'database',
    };
  }

  // Step 2: Fallback to Korean romanization rules
  const romanized = romanizeKoreanName(nameKo);

  // Step 3: Save to DB for future lookups (unverified)
  try {
    await db.prepare(`
      INSERT INTO name_mappings (name_ko, name_en, affiliation_ko, verified, verified_source)
      VALUES (?, ?, ?, 0, 'auto-romanization')
    `).bind(nameKo, romanized, affiliationKo || null).run();
  } catch {
    // Ignore duplicate insert errors
  }

  return {
    nameEn: romanized,
    verified: false,
    source: 'auto-romanization',
  };
}

/**
 * Update a name mapping (for manual override from admin UI)
 */
export async function updateNameMapping(
  db: D1Database,
  nameKo: string,
  nameEn: string,
  options?: {
    affiliationKo?: string;
    affiliationEn?: string;
    specialty?: string;
    verified?: boolean;
    verifiedSource?: string;
  }
): Promise<void> {
  const existing = await db.prepare(
    'SELECT id FROM name_mappings WHERE name_ko = ?'
  ).bind(nameKo).first();

  if (existing) {
    await db.prepare(`
      UPDATE name_mappings SET
        name_en = ?,
        affiliation_ko = COALESCE(?, affiliation_ko),
        affiliation_en = COALESCE(?, affiliation_en),
        specialty = COALESCE(?, specialty),
        verified = ?,
        verified_source = ?,
        updated_at = datetime('now')
      WHERE name_ko = ?
    `).bind(
      nameEn,
      options?.affiliationKo || null,
      options?.affiliationEn || null,
      options?.specialty || null,
      options?.verified ? 1 : 0,
      options?.verifiedSource || null,
      nameKo
    ).run();
  } else {
    await db.prepare(`
      INSERT INTO name_mappings (name_ko, name_en, affiliation_ko, affiliation_en, specialty, verified, verified_source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      nameKo,
      nameEn,
      options?.affiliationKo || null,
      options?.affiliationEn || null,
      options?.specialty || null,
      options?.verified ? 1 : 0,
      options?.verifiedSource || null
    ).run();
  }
}
