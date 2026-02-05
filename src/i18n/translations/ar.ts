// Arabic translations
import type { TranslationKeys } from './en';

export const ar: TranslationKeys = {
  // Navigation
  nav: {
    products: 'المنتجات',
    about: 'عن الشركة',
    certifications: 'الشهادات',
    resources: 'الموارد',
    faq: 'الأسئلة الشائعة',
    contact: 'اتصل بنا',
    contactUs: 'اتصل بنا',
  },

  // Common
  common: {
    learnMore: 'اعرف المزيد',
    viewDetails: 'عرض التفاصيل',
    downloadBrochure: 'تحميل الكتيب',
    getQuote: 'طلب عرض سعر',
    contactSales: 'اتصل بالمبيعات',
    readMore: 'اقرأ المزيد',
    viewAll: 'عرض الكل',
    backTo: 'العودة إلى',
    loading: 'جار التحميل...',
    error: 'خطأ',
    success: 'نجاح',
    submit: 'إرسال',
    cancel: 'إلغاء',
    close: 'إغلاق',
    search: 'بحث',
    filter: 'تصفية',
    sort: 'ترتيب',
    all: 'الكل',
    upcoming: 'قريباً',
    appliedTo: 'ينطبق على',
  },

  // Home page
  home: {
    hero: {
      title: 'حلول طبية تجميلية مبتكرة',
      subtitle: 'موافقة FDA 510(k) | شهادة ISO 13485 | تصنيع GMP',
      cta: 'استكشف منتجاتنا',
      ctaSecondary: 'كن موزعاً',
    },
    features: {
      title: 'لماذا تختار BRITZMEDI',
      subtitle: 'موثوق به من قبل المتخصصين حول العالم',
    },
    products: {
      title: 'منتجاتنا',
      subtitle: 'أجهزة طبية متقدمة لمتخصصي التجميل',
    },
    certifications: {
      title: 'الشهادات العالمية',
      subtitle: 'تلبية أعلى المعايير الدولية',
    },
  },

  // Products
  products: {
    title: 'المنتجات',
    subtitle: 'أجهزة طبية مبتكرة',
    category: {
      all: 'جميع المنتجات',
      medicalDevice: 'الأجهزة الطبية',
      cosmetic: 'مستحضرات التجميل',
    },
    status: {
      available: 'متوفر',
      comingSoon: 'قريباً',
    },
    details: {
      overview: 'نظرة عامة',
      keyTechnologies: 'التقنيات الرئيسية',
      indications: 'دواعي الاستعمال',
      specifications: 'المواصفات',
      certifications: 'الشهادات',
      clinicalBenefits: 'الفوائد السريرية',
      handpieces: 'القبضات اليدوية',
    },
  },

  // About page
  about: {
    title: 'عن BRITZMEDI',
    subtitle: 'الشركة الرائدة في تصنيع الأجهزة الطبية التجميلية من كوريا',
    hero: {
      label: 'عن BRITZMEDI',
      title1: 'ريادة الابتكار',
      title2: 'الطبي التجميلي',
    },
    overview: {
      title: 'نظرة عامة على الشركة',
      companyName: 'اسم الشركة',
      ceo: 'الرئيس التنفيذي',
      appointed: 'تم تعيينه',
      established: 'تأسست',
      headquarters: 'المقر الرئيسي والمصنع',
      businessType: 'نوع العمل',
    },
    philosophy: {
      title: 'فلسفتنا',
      text: 'بما يتجاوز تطوير أجهزة التجميل، نلتزم بالبحث في الجمال المستدام للحياة اليومية.',
    },
    ip: {
      title: 'الملكية الفكرية',
      registeredPatents: 'براءات الاختراع المسجلة',
      trademarks: 'العلامات التجارية',
      domesticPatents: 'براءات الاختراع المحلية',
      internationalPatents: 'براءات الاختراع الدولية',
    },
    history: {
      label: 'رحلتنا',
      title: 'تاريخ الشركة وإنجازاتها',
      subtitle: 'من معهد بحث وتطوير متخصص إلى مصنع عالمي للأجهزة الطبية معتمد من FDA.',
    },
    milestones: {
      '2017': {
        title: 'تأسيس الشركة',
        description: 'تأسيس شركة BRITZMEDI المحدودة والاعتماد كمعهد بحثي تابع للشركة',
      },
      '2021': {
        title: 'شهادة GMP',
        description: 'الحصول على شهادة GMP (ممارسات التصنيع الجيدة) من MFDS',
      },
      '2022': {
        title: 'موافقة FDA وشهادة ISO',
        description: 'الحصول على موافقة FDA 510(k) لجهاز TORR RF (K212561) وشهادة ISO 13485:2016',
      },
      '2025': {
        title: 'إعادة تصنيف كمؤسسة ناشئة',
        description: 'إعادة التصنيف كمؤسسة ناشئة (نوع البحث والتطوير)، صالحة حتى يونيو 2028',
      },
      '2026': {
        title: 'إطلاق LUMINO WAVE',
        description: 'الإطلاق المخطط لجهاز LUMINO WAVE من الجيل التالي (النصف الثاني 2026)',
      },
    },
    rnd: {
      label: 'التميز في البحث والتطوير',
      title: 'قدرات البحث والتطوير',
      subtitle: 'تعمل BRITZMEDI كشركة كثيفة التكنولوجيا مع تركيز قوي على الملكية الفكرية لضمان المزايا التنافسية في مجال الطب التجميلي.',
      points: {
        research: 'معهد بحثي تابع للشركة معتمد منذ 2017',
        venture: 'شهادة مؤسسة ناشئة (نوع البحث والتطوير) صالحة حتى يونيو 2028',
        patents: 'تطوير داخلي لتقنيات التقارب الحاصلة على براءات اختراع',
        inventors: 'المخترعون الأساسيون يقودون طلبات براءات الاختراع للتقنيات المتقدمة',
      },
    },
    tech: {
      title: 'التقنيات الأساسية',
      convergence: {
        name: 'العلاج بالتقارب',
        description: 'تقنية تجمع بين الموجات فوق الصوتية والليزر لتحقيق أقصى اختراق للجلد',
      },
      multiwave: {
        name: 'تقنية RF متعددة الموجات',
        description: 'أنظمة حرارية RF حاصلة على براءة اختراع مع تصميمات أقطاب مجزأة',
      },
      transdermal: {
        name: 'التوصيل عبر الجلد',
        description: 'تقنية التجويف الصوتي للامتصاص العميق في الجلد',
      },
    },
    manufacturing: {
      label: 'التصنيع',
      title: 'قدرات التصنيع وOEM/ODM',
      subtitle: 'تمتلك BRITZMEDI قدرات تصنيع شاملة وتقدم خدمات التطوير للشركاء العالميين.',
      infrastructure: {
        title: 'البنية التحتية للتصنيع',
        description: 'تدير شركتنا منشأة تصنيع مخصصة في هواسونج-سي، مرخصة من وزارة سلامة الغذاء والدواء.',
        mfdsLicense: 'رقم ترخيص MFDS',
        gmpCertified: 'تصنيع معتمد GMP',
        isoCertified: 'معتمد ISO 13485:2016',
      },
      oem: {
        title: 'جاهزية OEM/ODM',
        description: 'مسجلة رسمياً لدى FDA الأمريكية كمصنع متعاقد، مما يثبت قدرتنا على إنتاج أجهزة طبية تلبي المعايير الأمريكية الصارمة.',
        fdaRegistered: 'مصنع متعاقد مسجل لدى FDA',
        ownerOperator: 'رقم المالك/المشغل',
        e2eSupport: 'دعم شامل لتطوير المنتجات',
      },
      cta: 'مناقشة فرص الشراكة',
    },
    mission: {
      title: 'مهمتنا',
      description: 'توفير حلول طبية تجميلية مبتكرة وآمنة وفعالة للمتخصصين في جميع أنحاء العالم.',
    },
    team: {
      title: 'فريق القيادة',
    },
  },

  // Contact / Lead Form
  contact: {
    title: 'اتصل بنا',
    subtitle: 'تواصل مع فريقنا',
    responseTime: 'نرد خلال 24-48 ساعة.',
    form: {
      companyName: 'اسم الشركة',
      companyWebsite: 'موقع الشركة',
      yourName: 'اسمك',
      jobTitle: 'المسمى الوظيفي',
      businessEmail: 'البريد الإلكتروني للعمل',
      country: 'الدولة',
      interestedIn: 'مهتم بـ',
      message: 'الرسالة',
      privacy: 'أوافق على سياسة الخصوصية',
      submit: 'إرسال الاستفسار',
      submitting: 'جار الإرسال...',
    },
    validation: {
      required: 'هذا الحقل مطلوب',
      invalidEmail: 'الرجاء إدخال عنوان بريد إلكتروني صالح',
      businessEmailRequired: 'الرجاء استخدام بريدك الإلكتروني للعمل',
      invalidUrl: 'الرجاء إدخال عنوان URL صالح',
      selectAtLeastOne: 'الرجاء تحديد خيار واحد على الأقل',
    },
    success: {
      title: 'شكراً لك!',
      message: 'لقد استلمنا استفسارك وسنرد عليك خلال 24-48 ساعة.',
    },
    info: {
      title: 'معلومات الاتصال',
      address: 'العنوان',
      phone: 'الهاتف',
      email: 'البريد الإلكتروني',
    },
  },

  // FAQ
  faq: {
    title: 'الأسئلة الشائعة',
    subtitle: 'اعثر على إجابات للأسئلة الشائعة',
    heroLabel: 'الدعم',
    heroDescription: 'اعثر على إجابات للأسئلة الشائعة حول منتجاتنا والشركة وعملية الطلب والدعم الفني والشهادات.',
    stillHaveQuestions: 'لا تزال لديك أسئلة؟',
    stillHaveQuestionsDesc: 'لم تجد ما تبحث عنه؟ فريقنا هنا للمساعدة. اتصل بنا وسنرد عليك خلال 1-2 يوم عمل.',
    contactUs: 'اتصل بنا',
    emailUs: 'راسلنا عبر البريد الإلكتروني',
    categories: {
      products: 'المنتجات',
      company: 'الشركة',
      ordering: 'الطلب والتوزيع',
      technical: 'الدعم الفني',
      certifications: 'الشهادات',
    },
  },

  // Certifications page
  certifications: {
    title: 'الشهادات',
    subtitle: 'الجودة والوضع التنظيمي',
    heroLabel: 'الجودة والامتثال',
    heroTitle1: 'الشهادات و',
    heroTitle2: 'الوضع التنظيمي',
    qualityTitle: 'شهادات الجودة والتنظيم',
    qualitySubtitle: 'تُظهر شهاداتنا الشاملة التزامنا بالجودة وسلامة المرضى.',
    technicalLabel: 'الامتثال',
    technicalTitle: 'معايير السلامة الفنية',
    technicalSubtitle: 'تم تصميم أجهزتنا واختبارها لتلبية معايير السلامة الدولية الصارمة، كما تم التحقق منها خلال عمليات مراجعة FDA 510(k) وMFDS.',
    powerRequirements: 'متطلبات الطاقة',
    voltage: 'الجهد',
    protectionClass: 'فئة الحماية',
    roadmapLabel: 'التوسع العالمي',
    roadmapTitle: 'خارطة الطريق التنظيمية',
    roadmapSubtitle: 'جهودنا المستمرة لتقديم منتجات BRITZMEDI للأسواق العالمية.',
    tableRegion: 'المنطقة / الوكالة',
    tableProduct: 'المنتج',
    tableStatus: 'الحالة',
    tableNotes: 'ملاحظات',
    fdaNote: 'ملاحظة مهمة حول موافقة FDA',
    ctaTitle: 'هل تحتاج إلى مستندات الشهادات؟',
    ctaSubtitle: 'اتصل بنا لطلب نسخ من الشهادات أو تقارير الاختبار أو معلومات تنظيمية مفصلة.',
    ctaRequest: 'طلب المستندات',
    ctaViewProducts: 'عرض المنتجات',
    status: {
      certified: 'معتمد',
      cleared: 'موافق عليه',
      registered: 'مسجل',
      inPreparation: 'قيد التحضير',
      planned: 'مخطط له',
    },
    certificateNo: 'رقم الشهادة',
    validUntil: 'صالح حتى',
    products: 'المنتجات:',
  },

  // Resources page
  resources: {
    title: 'الموارد',
    subtitle: 'مركز الموارد',
    heroLabel: 'التحميلات',
    heroDescription: 'الوصول إلى كتيبات المنتجات والمستندات الفنية ومواد التسويق والشهادات ومقاطع الفيديو. جميع الموارد متاحة للتحميل.',
    allResources: 'جميع الموارد',
    download: 'تحميل',
    noResults: 'لم يتم العثور على موارد',
    noResultsDesc: 'حاول اختيار فئة مختلفة.',
    ctaTitle: 'هل تحتاج إلى مواد إضافية؟',
    ctaSubtitle: 'تبحث عن مستندات محددة أو عروض تقديمية مخصصة أو مواد مترجمة؟ اتصل بفريقنا وسنقوم بإعداد الموارد التي تحتاجها.',
    ctaRequest: 'طلب المواد',
  },

  // Privacy page
  privacy: {
    title: 'سياسة الخصوصية',
    heroLabel: 'قانوني',
    lastUpdated: 'آخر تحديث: يناير 2025',
    intro: {
      title: 'مقدمة',
      p1: 'تدير شركة BRITZMEDI Co., Ltd. ("الشركة"، "نحن") موقع britzmedi.com والخدمات ذات الصلة. توضح سياسة الخصوصية هذه كيفية جمع واستخدام والكشف عن وحماية معلوماتك عند زيارة موقعنا واستخدام خدماتنا.',
      p2: 'يرجى قراءة سياسة الخصوصية هذه بعناية. إذا كنت لا توافق على سياساتنا وممارساتنا، يرجى عدم استخدام خدماتنا.',
    },
    collection: {
      title: '1. المعلومات التي نجمعها',
      personalTitle: 'المعلومات الشخصية التي تقدمها',
      personalDesc: 'قد نجمع معلومات شخصية تقدمها طواعية، بما في ذلك:',
      autoTitle: 'المعلومات المجمعة تلقائياً',
      autoDesc: 'عند زيارة موقعنا، نجمع تلقائياً معلومات معينة:',
    },
    contactTitle: 'معلومات الاتصال',
    contactDesc: 'إذا كانت لديك أسئلة حول سياسة الخصوصية هذه أو ممارسات الخصوصية لدينا، يرجى الاتصال بنا:',
  },

  // Terms page
  terms: {
    title: 'شروط الخدمة',
    heroLabel: 'قانوني',
    lastUpdated: 'آخر تحديث: يناير 2025',
    intro: {
      title: 'مقدمة',
      p1: 'تحكم شروط الخدمة هذه ("الشروط") وصولك إلى واستخدامك لموقع britzmedi.com وجميع الخدمات والمحتوى والمنتجات ذات الصلة المقدمة من BRITZMEDI Co., Ltd. ("الشركة"، "نحن").',
      p2: 'بالوصول إلى موقعنا واستخدامه، فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام موقعنا أو خدماتنا.',
    },
    contactTitle: 'معلومات الاتصال',
    contactDesc: 'إذا كانت لديك أسئلة حول شروط الخدمة هذه أو تحتاج إلى الإبلاغ عن انتهاك، يرجى الاتصال بنا:',
  },

  // Footer
  footer: {
    description: 'قيادة الابتكار في الطب التجميلي بتقنية معتمدة من FDA من كوريا.',
    products: 'المنتجات',
    company: 'الشركة',
    resources: 'الموارد',
    contact: 'اتصل بنا',
    support: 'الدعم',
    legal: 'قانوني',
    links: {
      aboutUs: 'عن الشركة',
      certifications: 'الشهادات',
      faq: 'الأسئلة الشائعة',
      resourceCenter: 'مركز الموارد',
      productBrochures: 'كتيبات المنتجات',
      technicalDocs: 'المستندات الفنية',
      certificates: 'الشهادات',
    },
    badges: {
      fdaCleared: 'معتمد FDA 510(k)',
      iso: 'ISO 13485',
      gmp: 'معتمد GMP',
    },
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الخدمة',
    copyright: '© {year} BRITZMEDI Co., Ltd. جميع الحقوق محفوظة.',
  },

  // 404
  notFound: {
    title: 'الصفحة غير موجودة',
    message: 'الصفحة التي تبحث عنها غير موجودة.',
    backHome: 'العودة للرئيسية',
  },
};
