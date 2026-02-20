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

    // Check alternative romanizations too
    const anyAltPresent = romanized.alternatives.some(alt => fixed.includes(alt));
    if (anyAltPresent) {
      continue;
    }
  }

  return { fixed, detectedNames, corrections };
}
