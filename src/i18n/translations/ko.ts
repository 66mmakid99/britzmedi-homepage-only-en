// Korean translations
import type { TranslationKeys } from './en';

export const ko: TranslationKeys = {
  // Navigation
  nav: {
    products: '제품',
    about: '회사소개',
    certifications: '인증',
    resources: '자료실',
    faq: 'FAQ',
    contact: '문의',
    contactUs: '문의하기',
  },

  // Common
  common: {
    learnMore: '자세히 보기',
    viewDetails: '상세 보기',
    downloadBrochure: '브로슈어 다운로드',
    getQuote: '견적 요청',
    contactSales: '영업팀 연락',
    readMore: '더 읽기',
    viewAll: '전체 보기',
    backTo: '돌아가기',
    loading: '로딩 중...',
    error: '오류',
    success: '성공',
    submit: '제출',
    cancel: '취소',
    close: '닫기',
    search: '검색',
    filter: '필터',
    sort: '정렬',
    all: '전체',
    upcoming: '예정',
    appliedTo: '적용 제품',
  },

  // Home page
  home: {
    hero: {
      title: '혁신적인 미용의료 솔루션',
      subtitle: 'FDA 510(k) 승인 | ISO 13485 인증 | GMP 제조',
      cta: '제품 살펴보기',
      ctaSecondary: '파트너 신청',
    },
    features: {
      title: '왜 BRITZMEDI인가',
      subtitle: '전 세계 전문가들의 신뢰',
    },
    products: {
      title: '제품 라인업',
      subtitle: '미용 전문가를 위한 첨단 의료기기',
    },
    certifications: {
      title: '글로벌 인증',
      subtitle: '국제 최고 기준 충족',
    },
  },

  // Products
  products: {
    title: '제품',
    subtitle: '혁신적인 의료기기',
    category: {
      all: '전체 제품',
      medicalDevice: '의료기기',
      cosmetic: '화장품',
    },
    status: {
      available: '판매중',
      comingSoon: '출시 예정',
    },
    details: {
      overview: '개요',
      keyTechnologies: '핵심 기술',
      indications: '적응증',
      specifications: '사양',
      certifications: '인증',
      clinicalBenefits: '임상 효과',
      handpieces: '핸드피스',
    },
  },

  // About page
  about: {
    title: 'BRITZMEDI 소개',
    subtitle: '대한민국의 선도적인 미용의료기기 제조사',
    hero: {
      label: 'BRITZMEDI 소개',
      title1: '미용의료의',
      title2: '혁신을 선도하다',
    },
    overview: {
      title: '회사 개요',
      companyName: '회사명',
      ceo: '대표이사',
      appointed: '취임',
      established: '설립',
      headquarters: '본사 및 공장',
      businessType: '사업 유형',
    },
    philosophy: {
      title: '경영 철학',
      text: '미용 기기 개발을 넘어 일상 속 지속 가능한 아름다움을 연구합니다.',
    },
    ip: {
      title: '지식재산권',
      registeredPatents: '등록 특허',
      trademarks: '상표',
      domesticPatents: '국내 특허',
      internationalPatents: '해외 특허',
    },
    history: {
      label: '회사 연혁',
      title: '회사 연혁 및 주요 성과',
      subtitle: '전문 R&D 연구소에서 FDA 승인을 받은 글로벌 의료기기 제조사로 성장했습니다.',
    },
    milestones: {
      '2017': {
        title: '회사 설립',
        description: '(주)브리츠메디 설립 및 기업부설연구소 인정',
      },
      '2021': {
        title: 'GMP 인증',
        description: '식품의약품안전처 GMP 인증 취득',
      },
      '2022': {
        title: 'FDA 승인 & ISO 인증',
        description: 'TORR RF FDA 510(k) 승인(K212561) 및 ISO 13485:2016 인증 취득',
      },
      '2025': {
        title: '벤처기업 재지정',
        description: '벤처기업(연구개발형) 재지정, 2028년 6월까지 유효',
      },
      '2026': {
        title: 'LUMINO WAVE 출시',
        description: '차세대 LUMINO WAVE 기기 출시 예정 (2026년 하반기)',
      },
    },
    rnd: {
      label: 'R&D 역량',
      title: '연구개발 역량',
      subtitle: 'BRITZMEDI는 미용의료 분야에서 경쟁 우위를 확보하기 위해 지식재산권에 중점을 둔 기술 집약적 기업입니다.',
      points: {
        research: '2017년부터 기업부설연구소 인정',
        venture: '벤처기업(연구개발형) 인증, 2028년 6월까지 유효',
        patents: '자체 개발 융합 기술 특허 보유',
        inventors: '핵심 발명가들이 첨단 기술 특허 출원 주도',
      },
    },
    tech: {
      title: '핵심 기술',
      convergence: {
        name: '융합 테라피',
        description: '초음파와 레이저를 결합하여 피부 침투를 극대화하는 기술',
      },
      multiwave: {
        name: '멀티웨이브 RF 기술',
        description: '분할 전극 설계의 특허 RF 열 시스템',
      },
      transdermal: {
        name: '경피 전달',
        description: '음향 캐비테이션 기술을 활용한 피부 깊숙한 흡수',
      },
    },
    manufacturing: {
      label: '제조',
      title: '제조 및 OEM/ODM 역량',
      subtitle: 'BRITZMEDI는 전체 제조 사이클을 보유하고 글로벌 파트너를 위한 개발 서비스를 제공합니다.',
      infrastructure: {
        title: '제조 인프라',
        description: '식품의약품안전처 인가를 받은 화성시 전용 제조시설을 운영합니다.',
        mfdsLicense: 'MFDS 허가번호',
        gmpCertified: 'GMP 인증 제조',
        isoCertified: 'ISO 13485:2016 인증',
      },
      oem: {
        title: 'OEM/ODM 준비',
        description: '미국 FDA에 계약 제조업체로 공식 등록되어 미국 기준에 부합하는 의료기기 생산 역량을 검증받았습니다.',
        fdaRegistered: 'FDA 등록 계약 제조업체',
        ownerOperator: 'Owner/Operator 번호',
        e2eSupport: '제품 개발 전 과정 지원',
      },
      cta: '파트너십 문의',
    },
    mission: {
      title: '미션',
      description: '전 세계 전문가들에게 혁신적이고 안전하며 효과적인 미용의료 솔루션을 제공합니다.',
    },
    team: {
      title: '경영진',
    },
  },

  // Contact / Lead Form
  contact: {
    title: '문의하기',
    subtitle: '담당자에게 연락하세요',
    responseTime: '24-48시간 내에 답변드리겠습니다.',
    form: {
      companyName: '회사명',
      companyWebsite: '회사 웹사이트',
      yourName: '이름',
      jobTitle: '직책',
      businessEmail: '비즈니스 이메일',
      country: '국가',
      interestedIn: '관심 제품',
      message: '메시지',
      privacy: '개인정보처리방침에 동의합니다',
      submit: '문의 제출',
      submitting: '제출 중...',
    },
    validation: {
      required: '필수 항목입니다',
      invalidEmail: '올바른 이메일 주소를 입력해주세요',
      businessEmailRequired: '비즈니스 이메일을 사용해주세요',
      invalidUrl: '올바른 URL을 입력해주세요',
      selectAtLeastOne: '최소 하나를 선택해주세요',
    },
    success: {
      title: '감사합니다!',
      message: '문의가 접수되었습니다. 24-48시간 내에 답변 드리겠습니다.',
    },
    info: {
      title: '연락처 정보',
      address: '주소',
      phone: '전화',
      email: '이메일',
    },
  },

  // FAQ
  faq: {
    title: '자주 묻는 질문',
    subtitle: '궁금한 점을 확인하세요',
    heroLabel: '고객지원',
    heroDescription: '제품, 회사, 주문, 기술 지원, 인증에 대한 자주 묻는 질문의 답변을 확인하세요.',
    stillHaveQuestions: '더 궁금한 점이 있으신가요?',
    stillHaveQuestionsDesc: '찾으시는 답변이 없으신가요? 저희 팀이 도와드리겠습니다. 문의해 주시면 1-2영업일 내에 답변 드리겠습니다.',
    contactUs: '문의하기',
    emailUs: '이메일로 문의',
    categories: {
      products: '제품',
      company: '회사',
      ordering: '주문 및 유통',
      technical: '기술 지원',
      certifications: '인증',
    },
  },

  // Certifications page
  certifications: {
    title: '인증',
    subtitle: '품질 및 규제 현황',
    heroLabel: '품질 및 규정 준수',
    heroTitle1: '인증 &',
    heroTitle2: '규제 현황',
    qualityTitle: '품질 및 규제 인증',
    qualitySubtitle: '당사의 종합적인 인증은 품질과 환자 안전에 대한 헌신을 보여줍니다.',
    technicalLabel: '규정 준수',
    technicalTitle: '기술 안전 표준',
    technicalSubtitle: '당사 기기는 FDA 510(k) 및 MFDS 심사 과정에서 검증된 엄격한 국제 안전 표준을 충족하도록 설계 및 테스트되었습니다.',
    powerRequirements: '전력 요구사항',
    voltage: '전압',
    protectionClass: '보호 등급',
    roadmapLabel: '글로벌 확장',
    roadmapTitle: '규제 로드맵',
    roadmapSubtitle: 'BRITZMEDI 제품을 전 세계 시장에 출시하기 위한 진행 상황입니다.',
    tableRegion: '지역 / 기관',
    tableProduct: '제품',
    tableStatus: '상태',
    tableNotes: '비고',
    fdaNote: 'FDA 승인에 대한 중요 안내',
    ctaTitle: '인증 문서가 필요하신가요?',
    ctaSubtitle: '인증서 사본, 시험 보고서 또는 상세 규제 정보를 요청하시려면 문의해 주세요.',
    ctaRequest: '문서 요청',
    ctaViewProducts: '제품 보기',
    status: {
      certified: '인증됨',
      cleared: '승인됨',
      registered: '등록됨',
      inPreparation: '준비 중',
      planned: '계획됨',
    },
    certificateNo: '인증서 번호',
    validUntil: '유효 기간',
    products: '제품:',
  },

  // Resources page
  resources: {
    title: '자료실',
    subtitle: '자료 센터',
    heroLabel: '다운로드',
    heroDescription: '제품 브로슈어, 기술 문서, 마케팅 자료, 인증서 및 비디오에 접근하세요. 모든 자료를 다운로드할 수 있습니다.',
    allResources: '전체 자료',
    download: '다운로드',
    noResults: '자료를 찾을 수 없습니다',
    noResultsDesc: '다른 카테고리를 선택해 보세요.',
    ctaTitle: '추가 자료가 필요하신가요?',
    ctaSubtitle: '특정 문서, 맞춤 프레젠테이션 또는 현지화된 자료를 찾고 계신가요? 담당자에게 문의하시면 필요한 자료를 준비해 드리겠습니다.',
    ctaRequest: '자료 요청',
  },

  // Privacy page
  privacy: {
    title: '개인정보처리방침',
    heroLabel: '법적 고지',
    lastUpdated: '최종 업데이트: 2025년 1월',
    intro: {
      title: '소개',
      p1: '(주)브리츠메디("회사", "당사")는 britzmedi.com 웹사이트 및 관련 서비스를 운영합니다. 본 개인정보처리방침은 귀하가 당사 웹사이트를 방문하고 서비스를 이용할 때 수집, 사용, 공개 및 보호하는 정보에 대해 설명합니다.',
      p2: '본 개인정보처리방침을 주의 깊게 읽어주세요. 당사의 정책 및 관행에 동의하지 않으시면 서비스를 이용하지 마세요.',
    },
    collection: {
      title: '1. 수집하는 정보',
      personalTitle: '귀하가 제공하는 개인정보',
      personalDesc: '다음을 포함하여 자발적으로 제공하는 개인정보를 수집할 수 있습니다:',
      autoTitle: '자동 수집 정보',
      autoDesc: '웹사이트 방문 시 다음 정보가 자동으로 수집됩니다:',
    },
    contactTitle: '연락처 정보',
    contactDesc: '본 개인정보처리방침 또는 당사의 개인정보 관행에 대해 질문이 있으시면 연락해 주세요:',
  },

  // Terms page
  terms: {
    title: '이용약관',
    heroLabel: '법적 고지',
    lastUpdated: '최종 업데이트: 2025년 1월',
    intro: {
      title: '소개',
      p1: '본 이용약관("약관")은 (주)브리츠메디("회사", "당사")가 제공하는 britzmedi.com 웹사이트 및 모든 관련 서비스, 콘텐츠 및 제품에 대한 접근 및 이용을 규율합니다.',
      p2: '웹사이트에 접근하고 이용함으로써 귀하는 본 약관에 동의하게 됩니다. 본 약관에 동의하지 않으시면 웹사이트나 서비스를 이용하지 마세요.',
    },
    contactTitle: '연락처 정보',
    contactDesc: '본 이용약관에 대한 질문이 있거나 위반 사항을 신고하려면 연락해 주세요:',
  },

  // Footer
  footer: {
    description: '대한민국에서 FDA 승인 기술로 미용의료의 혁신을 선도합니다.',
    products: '제품',
    company: '회사',
    resources: '자료실',
    contact: '연락처',
    support: '지원',
    legal: '법적 고지',
    links: {
      aboutUs: '회사소개',
      certifications: '인증',
      faq: 'FAQ',
      resourceCenter: '자료실',
      productBrochures: '제품 브로슈어',
      technicalDocs: '기술 문서',
      certificates: '인증서',
    },
    badges: {
      fdaCleared: 'FDA 510(k) 승인',
      iso: 'ISO 13485',
      gmp: 'GMP 인증',
    },
    privacyPolicy: '개인정보처리방침',
    termsOfService: '이용약관',
    copyright: '© {year} (주)브리츠메디. All rights reserved.',
  },

  // 404
  notFound: {
    title: '페이지를 찾을 수 없습니다',
    message: '요청하신 페이지가 존재하지 않습니다.',
    backHome: '홈으로 돌아가기',
  },
};
