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
      gallery: '갤러리',
      productImages: '제품 이미지',
      technology: '기술',
      clinicalUse: '임상 사용',
      technicalData: '기술 데이터',
      accessories: '액세서리',
      handpieceConfig: '핸드피스 구성',
      benefits: '효과',
      tipSize: '팁 크기',
      depth: '깊이',
      flagshipProduct: '대표 제품',
      comingH22026: '2026년 하반기 출시',
      medicalDevice: '의료기기',
      medicalCosmetic: '메디컬 코스메틱',
      model: '모델',
      requestQuote: '견적 요청',
      requestDemo: '데모 요청',
      interestedIn: '이 제품에 관심이 있으신가요?',
      contactCta: '가격, 데모 일정 또는 기술 문의는 영업팀에 문의하세요.',
      viewAllProducts: '전체 제품 보기',
      home: '홈',
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
    hero: {
      label: '문의하기',
      title1: '대화를',
      title2: '시작해 보세요',
      description: '제품에 관심이 있으시거나, 파트너십 기회를 모색 중이시거나, 기술 지원이 필요하시면 저희 팀이 도와드리겠습니다.',
    },
    getInTouch: '연락처',
    form: {
      title: '정보 요청',
      description: '아래 양식을 작성해 주시면 1-2영업일 내에 답변 드리겠습니다.',
      companyName: '회사명',
      companyWebsite: '회사 웹사이트',
      yourName: '이름',
      jobTitle: '직책',
      businessEmail: '비즈니스 이메일',
      country: '국가',
      interestedIn: '관심 제품',
      selectAtLeastOne: '최소 하나 선택',
      message: '메시지',
      privacy: '문의 응대를 위한 개인정보 수집 및 이용에 동의합니다.',
      submit: '문의 제출',
      submitting: '제출 중...',
      distributionPartnership: '총판 파트너십',
      oemOdm: 'OEM/ODM 문의',
    },
    placeholders: {
      companyName: '회사명을 입력하세요',
      companyWebsite: 'www.example.com',
      yourName: '홍길동',
      jobTitle: '대표 / 이사 / 매니저',
      businessEmail: 'you@company.com',
      selectCountry: '국가를 선택하세요',
    },
    hints: {
      businessEmail: '회사 이메일 주소를 사용해 주세요',
    },
    validation: {
      required: '필수 항목입니다',
      companyNameMin: '회사명은 필수입니다 (최소 2자).',
      yourNameMin: '이름은 필수입니다 (최소 2자).',
      jobTitleRequired: '직책은 필수입니다.',
      countryRequired: '국가를 선택해 주세요.',
      invalidEmail: '올바른 이메일 주소를 입력해주세요.',
      businessEmailRequired: '회사 이메일을 사용해 주세요. 개인 이메일(Gmail, Yahoo 등)은 허용되지 않습니다.',
      tempEmailNotAccepted: '임시 이메일 주소는 허용되지 않습니다.',
      invalidUrl: '올바른 웹사이트 URL을 입력해주세요.',
      companyWebsiteRequired: '회사 웹사이트는 필수입니다.',
      businessWebsiteRequired: '올바른 비즈니스 웹사이트 URL을 입력해주세요.',
      selectAtLeastOne: '최소 하나의 제품 또는 서비스를 선택해주세요.',
    },
    success: {
      title: '문의가 성공적으로 제출되었습니다!',
      message: '문의해 주셔서 감사합니다. 1-2영업일 내에 답변 드리겠습니다.',
    },
    error: {
      title: '제출 실패',
      duplicateEmail: '이 이메일로 이미 문의가 접수되었습니다. 곧 연락 드리겠습니다.',
      generic: '나중에 다시 시도하시거나 contact@britzmedi.co.kr로 직접 이메일을 보내주세요.',
    },
    info: {
      title: '연락처 정보',
      headquarters: '본사 및 공장',
      address: '주소',
      phone: '전화',
      email: '이메일',
      website: '웹사이트',
    },
    map: {
      location: '경기도 화성시, 대한민국',
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
    items: {
      'what-is-torr-rf': {
        question: 'TORR RF란 무엇이며 주요 용도는 무엇인가요?',
        answer: 'TORR RF는 FDA 510(k) 승인을 받은 당사의 주력 의료기기로, 혁신적인 멀티웨이브 고주파 기술을 사용하여 진피층과 피하층에 열에너지를 전달합니다. 피부 탄력 강화, 주름 감소, 바디 컨투어링을 포함한 비침습적 미용 치료에 주로 사용됩니다. 정밀한 에너지 전달을 위한 특허 받은 분할 전극 설계가 특징입니다.',
      },
      'torr-rf-fda-cleared': {
        question: 'TORR RF는 FDA 승인을 받았나요?',
        answer: '네, TORR RF는 2022년에 FDA 510(k) 승인(K212561)을 받았습니다. 이 승인은 해당 기기가 미국 식품의약국이 요구하는 안전성 및 유효성 기준을 충족하여 미국 내 판매가 가능함을 확인합니다.',
      },
      'ulblanc-features': {
        question: 'ULBLANC은 다른 초음파 기기와 어떻게 다른가요?',
        answer: 'ULBLANC은 이중 주파수 초음파 기술과 경피 약물 전달을 위한 음향 캐비테이션(i-Booster 기술)을 결합한 종합 스킨케어 워크스테이션입니다. 이러한 독특한 조합으로 피부 탄력 효과와 스킨케어 제품의 향상된 흡수가 가능하여 미용 클리닉을 위한 다용도 솔루션이 됩니다.',
      },
      'newchae-shot-home-use': {
        question: 'NEWCHAE SHOT은 가정에서 사용할 수 있나요?',
        answer: '네, NEWCHAE SHOT은 가정용 3-in-1 개인 미용기기로 특별히 설계되었습니다. 전문가급 의료 기술을 멀티 채널 에너지 전달 기능을 갖춘 컴팩트하고 사용하기 쉬운 형태로 통합하여 소비자가 가정에서 전문가 수준의 스킨케어 결과를 얻을 수 있습니다.',
      },
      'lumino-wave-availability': {
        question: 'LUMINO WAVE는 언제 출시되나요?',
        answer: 'LUMINO WAVE는 2026년 하반기 출시 예정입니다. 이 차세대 기기는 피부 침투를 극대화하기 위해 초음파와 레이저를 결합한 당사의 혁신적인 융합 테라피 기술을 탑재하고 있습니다. 출시 알림을 받으시려면 영업팀에 문의해 주세요.',
      },
      'company-history': {
        question: 'BRITZMEDI는 언제 설립되었나요?',
        answer: '(주)브리츠메디는 2017년 10월 23일 대한민국에서 설립되었습니다. 기업부설연구소로 시작하여 FDA 승인, ISO 13485 인증, 벤처기업 지정을 받은 글로벌 의료기기 제조사로 성장했습니다.',
      },
      'company-location': {
        question: 'BRITZMEDI는 어디에 위치해 있나요?',
        answer: '본사와 제조시설은 경기도 성남시 중원구 둔촌대로 388, 1211호 (우편번호: 13403)에 위치해 있습니다. 통합 R&D 역량을 갖춘 GMP 인증 제조시설을 운영하고 있습니다.',
      },
      'rd-capabilities': {
        question: 'BRITZMEDI는 자체 R&D 역량을 보유하고 있나요?',
        answer: '네, BRITZMEDI는 전담 R&D 인력을 갖춘 기업부설연구소를 운영하고 있습니다. 11건 이상의 특허(국내 10건, 해외 1건)와 5건의 상표를 등록했습니다. R&D형 벤처기업 지정은 미용의료 기술 혁신에 대한 당사의 헌신을 확인합니다.',
      },
      'become-distributor': {
        question: 'BRITZMEDI 총판이 되려면 어떻게 해야 하나요?',
        answer: '전 세계 자격을 갖춘 총판의 파트너십 문의를 환영합니다. 총판이 되시려면 Contact 페이지를 통해 귀사 정보, 관심 지역 및 의료기기 유통 관련 경험을 영업팀에 문의해 주세요. 신청서를 검토하고 상담을 진행하겠습니다.',
      },
      'minimum-order': {
        question: '최소 주문 수량은 얼마인가요?',
        answer: '최소 주문 수량은 제품과 시장에 따라 다릅니다. 귀하의 지역 및 요구 사항에 맞는 구체적인 MOQ 정보는 영업팀에 문의해 주세요. 자격을 갖춘 총판을 위한 유연한 조건을 제공하며 평가용 샘플 유닛에 대해서도 상담 가능합니다.',
      },
      'shipping-international': {
        question: '해외 배송이 가능한가요?',
        answer: '네, 전 세계 총판 및 파트너에게 배송합니다. 제품은 한국의 GMP 인증 시설에서 제조되어 국제 의료기기 배송 기준에 따라 배송됩니다. 배송 조건과 물류는 파트너십 협상 시 논의됩니다.',
      },
      'oem-odm-services': {
        question: 'OEM/ODM 서비스를 제공하나요?',
        answer: '네, BRITZMEDI는 FDA 등록 계약 제조업체(Owner Operator Number: 10088936)로서 종합적인 OEM/ODM 서비스를 제공합니다. GMP 인증 시설과 경험 많은 R&D 팀을 활용하여 설계부터 제조까지 전 과정 개발 서비스를 제공합니다. 구체적인 요구 사항을 논의하시려면 문의해 주세요.',
      },
      'training-provided': {
        question: '기기 교육을 제공하나요?',
        answer: '네, 모든 의료기기에 대한 종합적인 교육 프로그램을 제공합니다. 교육에는 기기 작동, 치료 프로토콜, 안전 절차 및 유지보수가 포함됩니다. 교육은 현장, 한국 본사 시설 또는 디지털 교육 플랫폼을 통해 진행할 수 있습니다. 교육 일정은 현지 총판이나 지원팀에 문의해 주세요.',
      },
      'warranty-policy': {
        question: '보증 정책은 어떻게 되나요?',
        answer: 'BRITZMEDI 제품에는 표준 제조사 보증이 제공됩니다. 보증 조건과 범위는 제품 및 지역에 따라 다릅니다. 보증은 제조 결함을 포함하며 기술 지원이 포함됩니다. 연장 보증 옵션도 제공됩니다. 구체적인 보증 정보는 구매 서류를 참조하거나 지원팀에 문의해 주세요.',
      },
      'technical-support': {
        question: '기술 지원은 어떻게 받을 수 있나요?',
        answer: '기술 지원은 여러 채널을 통해 제공됩니다: 1) 현지 공인 총판에 연락, 2) contact@britzmedi.co.kr로 지원팀에 이메일, 3) 업무 시간(월-금 오전 9시~오후 6시 KST) 중 +82-70-4348-7244로 전화. 모든 문의에 1-2영업일 내 답변을 목표로 합니다.',
      },
      'iso-certification': {
        question: 'BRITZMEDI는 ISO 인증을 받았나요?',
        answer: '네, BRITZMEDI는 의료기기 품질경영시스템의 국제 표준인 ISO 13485:2016 인증을 받았습니다. 이 인증은 의료기기의 설계, 개발 및 제조에서 일관된 품질과 규제 준수에 대한 당사의 헌신을 보여줍니다.',
      },
      'gmp-certified': {
        question: '제조시설은 GMP 인증을 받았나요?',
        answer: '네, 당사 제조시설은 식품의약품안전처(MFDS)로부터 GMP(우수의약품 제조관리기준) 인증을 받았습니다. 2021년에 이 인증을 취득했으며, 제품이 품질 기준에 따라 일관되게 생산 및 관리됨을 보장합니다.',
      },
      'regulatory-approvals': {
        question: '제품은 어떤 규제 승인을 받았나요?',
        answer: '당사 제품은 시장에 따라 다양한 규제 승인을 보유하고 있습니다. TORR RF는 미국 시장을 위한 FDA 510(k) 승인과 한국 MFDS 승인을 받았습니다. 모든 제품이 한국 MFDS 승인을 받았습니다. 규제 포트폴리오를 지속적으로 확대하고 있으며 목표 시장에 대한 구체적인 인증 정보를 요청하시면 제공해 드립니다.',
      },
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
    heroTitle1: '자료',
    heroTitle2: '센터',
    heroDescription: '제품 브로슈어, 기술 문서, 마케팅 자료, 인증서 및 비디오에 접근하세요. 모든 자료를 다운로드할 수 있습니다.',
    allResources: '전체 자료',
    categories: {
      productBrochure: '제품 브로슈어',
      technicalDocs: '기술 문서',
      marketing: '마케팅 자료',
      certificates: '인증서',
      videos: '제품 비디오',
    },
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
