export const BRITZMEDI_PRODUCTS = {
  "TORR RF": {
    name: "TORR RF",
    category: "professional_medical_device",
    classification: "FDA 510(k) cleared medical device",
    target_user: "Licensed aesthetic clinics, dermatology clinics, medical spas",
    technology: "Multi-wave radiofrequency (mono-polar, bi-polar, multi-polar switching)",
    indications: [
      "Skin tightening",
      "Body contouring",
      "Cellulite treatment",
      "Wrinkle reduction",
      "Collagen remodeling"
    ],
    key_features: [
      "Multi-wave RF technology (switch between mono/bi/multi-polar modes)",
      "Integrated cooling system",
      "Real-time impedance monitoring",
      "Multiple handpiece options for face and body"
    ],
    certifications: ["FDA 510(k)", "CE", "ISO 13485", "GMP (KGMP)"],
    regulatory_note: "Professional use only. Must be operated by licensed medical professionals.",
    is_medical_device: true,
    is_personal_device: false
  },
  "ULBLANC": {
    name: "ULBLANC",
    category: "professional_medical_device",
    classification: "Professional aesthetic device",
    target_user: "Licensed aesthetic clinics, dermatology clinics",
    technology: "Advanced skin rejuvenation system",
    indications: [
      "Skin rejuvenation",
      "Skin tone improvement"
    ],
    key_features: [
      "Multiple energy modalities for skin rejuvenation"
    ],
    certifications: ["CE", "ISO 13485"],
    regulatory_note: "Professional use only.",
    is_medical_device: true,
    is_personal_device: false
  },
  "NEWCHAE SHOT": {
    name: "NEWCHAE SHOT",
    category: "personal_beauty_device",
    classification: "Personal home-use beauty device (NOT a medical device)",
    target_user: "General consumers, individuals for home use",
    technology: "RF technology adapted from TORR RF handpiece technology for personal use",
    indications: [
      "At-home skin care",
      "Personal beauty treatment"
    ],
    key_features: [
      "TORR RF handpiece technology adapted for consumer use",
      "Safe for home use without medical supervision",
      "Compact personal device"
    ],
    certifications: [],
    regulatory_note: "Personal beauty device. NOT FDA cleared as medical device. NOT for clinical use. Does NOT require medical professional to operate.",
    is_medical_device: false,
    is_personal_device: true,
    CRITICAL_WARNINGS: [
      "NEVER describe as medical device, injection system, mesotherapy device, micro-injection/needle-based system, microneedling device, or LED/phototherapy device",
      "NEVER claim FDA clearance for this product",
      "NEVER say it requires medical professional to operate",
      "NEVER list clinical indications (it is NOT a clinical device)",
      "NEVER list it among clinical/professional combination treatments (it is home-use only, not a clinic add-on to RF microneedling, LED therapy, PRP, etc.)",
      "ALWAYS clarify it is a PERSONAL/HOME-USE beauty device (RF/EMS/Electroporation) based on TORR RF technology"
    ]
  },
  "LUMINO WAVE": {
    name: "LUMINO WAVE",
    category: "professional_device",
    classification: "LED therapy device",
    target_user: "Aesthetic clinics, medical spas",
    technology: "LED phototherapy with multiple wavelengths",
    indications: [
      "Phototherapy treatments",
      "Skin rejuvenation support"
    ],
    key_features: [
      "Multiple LED wavelengths"
    ],
    certifications: [],
    regulatory_note: "Professional LED device.",
    is_medical_device: false,
    is_personal_device: false
  }
} as const;

export type ProductKey = keyof typeof BRITZMEDI_PRODUCTS;
export type Product = typeof BRITZMEDI_PRODUCTS[ProductKey];

export const BRITZMEDI_COMPANY = {
  name: "BRITZMEDI Co., Ltd.",
  ceo: "이신재 (Shinjae Lee)",
  cmo: "이성호 (Sungho Lee)",
  cmo_email: "sh.lee@britzmedi.com",
  headquarters: "1211, 388, Dunchon-daero, Jungwon-gu, Seongnam-si, Gyeonggi-do, Republic of Korea",
  website: "https://britzmedi.com",
  phone: "+82-70-4348-7244",
  founded_country: "South Korea",
  certifications: ["ISO 13485", "GMP (KGMP)", "FDA 510(k) (for TORR RF)"],
  speciality: "Radiofrequency (RF) technology for aesthetic medical devices",
  flagship: "TORR RF"
} as const;

// 제품 정보를 프롬프트용 텍스트로 변환
export function getProductContext(): string {
  let context = `BRITZMEDI OFFICIAL PRODUCT INFORMATION (DO NOT DEVIATE FROM THIS):\n\n`;
  context += `Company: ${BRITZMEDI_COMPANY.name}, headquartered in ${BRITZMEDI_COMPANY.headquarters}\n`;
  context += `CEO: ${BRITZMEDI_COMPANY.ceo}\n`;
  context += `Website: ${BRITZMEDI_COMPANY.website}\n`;
  context += `Specialty: ${BRITZMEDI_COMPANY.speciality}\n\n`;

  for (const [, product] of Object.entries(BRITZMEDI_PRODUCTS)) {
    context += `--- ${product.name} ---\n`;
    context += `Category: ${product.classification}\n`;
    context += `Target User: ${product.target_user}\n`;
    context += `Technology: ${product.technology}\n`;
    context += `Is Medical Device: ${product.is_medical_device ? 'YES' : 'NO'}\n`;
    context += `Is Personal Device: ${product.is_personal_device ? 'YES' : 'NO'}\n`;
    if (product.indications.length > 0) {
      context += `Indications: ${product.indications.join(', ')}\n`;
    }
    if (product.certifications.length > 0) {
      context += `Certifications: ${product.certifications.join(', ')}\n`;
    }
    context += `Regulatory: ${product.regulatory_note}\n`;
    if ('CRITICAL_WARNINGS' in product && product.CRITICAL_WARNINGS) {
      context += `⚠️ CRITICAL: ${(product.CRITICAL_WARNINGS as readonly string[]).join(' | ')}\n`;
    }
    context += `\n`;
  }

  return context;
}

export const CONTENT_STRATEGY_RULES = {
  // BRITZMEDI 핵심 기술
  core_technology: 'radiofrequency (RF)',

  // 경쟁 기술 목록 — 이 기술들은 단독 가이드 금지
  competitor_technologies: [
    'ultrasound', 'HIFU', 'laser', 'cryolipolysis', 'coolsculpting',
    'ultrasonic cavitation', 'electromagnetic', 'EMS', 'HIFEM'
  ],

  // 콘텐츠 전략 규칙
  rules: [
    'NEVER publish a standalone guide about a competitor technology on BRITZMEDI blog',
    'Competitor technologies MUST be covered in comparison format: "RF vs [Competitor]"',
    'RF technology must always be presented as a primary option, with fair but favorable comparison',
    'Every article must have a strategic connection to BRITZMEDI products',
    'If an article topic does not relate to RF technology, skin tightening, body contouring, or aesthetic devices — do not write it'
  ],

  // 허용/금지 글 유형
  allowed_topics: [
    'RF skin tightening (any angle)',
    'RF body contouring (any angle)',
    'RF vs [competitor technology] comparison',
    'Multi-wave RF technology deep dive',
    'Aesthetic device buying guide (with RF featured)',
    'Clinical evidence for RF treatments',
    'Korean aesthetic device market (with BRITZMEDI context)',
    'Clinic ROI analysis for RF devices',
    'Patient education about RF treatments',
    'FDA clearance process for aesthetic devices'
  ],

  banned_topics: [
    'Standalone ultrasound/HIFU guide (without RF comparison)',
    'Standalone laser treatment guide (without RF comparison)',
    'Standalone cryotherapy guide (without RF comparison)',
    'Any guide that promotes a competitor technology without comparing to RF',
    'Topics unrelated to aesthetic devices or BRITZMEDI market'
  ],

  // 글 길이 규칙
  word_count: {
    min: 1500,
    max: 2500,
    ideal: 2000,
    rule: 'Over 2500 words causes high bounce rate. Keep focused and concise.'
  },

  // CTA 규칙
  cta_rules: {
    minimum_count: 2,
    positions: ['after_first_major_section (around 500 words)', 'end_of_article'],
    format: 'Subtle inline CTA, not aggressive banner. Example: "Learn more about multi-wave RF technology at [britzmedi.com/products/torr-rf](https://britzmedi.com/products/torr-rf)"',
    never: 'Never use aggressive sales language like "Buy now" or "Order today"'
  }
};

// 특정 제품 정보만 가져오기
export function getProductInfo(productName: string): Product | null {
  const normalized = productName.toUpperCase().replace(/\s+/g, ' ').trim();
  for (const [key, product] of Object.entries(BRITZMEDI_PRODUCTS)) {
    if (key.toUpperCase() === normalized || product.name.toUpperCase() === normalized) {
      return product;
    }
  }
  return null;
}
