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
    categories: {
      products: '제품',
      company: '회사',
      ordering: '주문 및 유통',
      technical: '기술 지원',
      certifications: '인증',
    },
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
