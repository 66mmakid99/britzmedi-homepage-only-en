// Chinese (Simplified) translations
import type { TranslationKeys } from './en';

export const zh: TranslationKeys = {
  // Navigation
  nav: {
    products: '产品',
    about: '关于我们',
    certifications: '认证',
    resources: '资源',
    blog: '博客',
    faq: '常见问题',
    contact: '联系我们',
    contactUs: '联系我们',
  },

  // Common
  common: {
    learnMore: '了解更多',
    viewDetails: '查看详情',
    downloadBrochure: '下载手册',
    getQuote: '获取报价',
    contactSales: '联系销售',
    readMore: '阅读更多',
    viewAll: '查看全部',
    backTo: '返回',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    submit: '提交',
    cancel: '取消',
    close: '关闭',
    search: '搜索',
    filter: '筛选',
    sort: '排序',
    all: '全部',
    upcoming: '即将推出',
    appliedTo: '适用产品',
  },

  // Home page
  home: {
    hero: {
      title: '创新美容医疗解决方案',
      subtitle: 'FDA 510(k) 认证 | ISO 13485 认证 | GMP 生产',
      cta: '探索我们的产品',
      ctaSecondary: '成为经销商',
    },
    features: {
      title: '为什么选择 BRITZMEDI',
      subtitle: '受到全球专业人士的信赖',
    },
    products: {
      title: '我们的产品',
      subtitle: '为美容专业人士提供先进的医疗设备',
    },
    certifications: {
      title: '全球认证',
      subtitle: '符合最高国际标准',
    },
  },

  // Products
  products: {
    title: '产品',
    subtitle: '创新医疗设备',
    category: {
      all: '所有产品',
      medicalDevice: '医疗设备',
      cosmetic: '化妆品',
    },
    status: {
      available: '在售',
      comingSoon: '即将推出',
    },
    details: {
      overview: '概述',
      keyTechnologies: '核心技术',
      indications: '适应症',
      specifications: '规格',
      certifications: '认证',
      clinicalBenefits: '临床效果',
      handpieces: '手柄',
      gallery: '图片展示',
      productImages: '产品图片',
      technology: '技术',
      clinicalUse: '临床应用',
      technicalData: '技术参数',
      accessories: '配件',
      handpieceConfig: '手柄配置',
      benefits: '优势',
      tipSize: '探头尺寸',
      depth: '深度',
      flagshipProduct: '旗舰产品',
      comingH22026: '2026年下半年上市',
      medicalDevice: '医疗设备',
      medicalCosmetic: '医学美容',
      model: '型号',
      requestQuote: '获取报价',
      requestDemo: '申请演示',
      interestedIn: '对这个产品感兴趣吗？',
      contactCta: '如需报价、演示安排或技术咨询，请联系我们的销售团队。',
      viewAllProducts: '查看全部产品',
      home: '首页',
    },
  },

  // About page
  about: {
    title: '关于 BRITZMEDI',
    subtitle: '来自韩国的领先美容医疗设备制造商',
    hero: {
      label: '关于 BRITZMEDI',
      title1: '引领美容医疗',
      title2: '创新',
    },
    overview: {
      title: '公司概况',
      companyName: '公司名称',
      ceo: '首席执行官',
      appointed: '任命',
      established: '成立',
      headquarters: '总部及工厂',
      businessType: '业务类型',
    },
    philosophy: {
      title: '经营理念',
      text: '超越美容设备的开发，我们致力于研究日常生活中的可持续之美。',
    },
    ip: {
      title: '知识产权',
      registeredPatents: '注册专利',
      trademarks: '商标',
      domesticPatents: '国内专利',
      internationalPatents: '国际专利',
    },
    history: {
      label: '发展历程',
      title: '公司历史与里程碑',
      subtitle: '从专业研发机构成长为获得FDA批准的全球医疗器械制造商。',
    },
    milestones: {
      '2017': {
        title: '公司成立',
        description: 'BRITZMEDI株式会社成立，获得企业附属研究所认定',
      },
      '2021': {
        title: 'GMP认证',
        description: '获得食品药品安全部GMP认证',
      },
      '2022': {
        title: 'FDA批准与ISO认证',
        description: '获得TORR RF FDA 510(k)批准（K212561）及ISO 13485:2016认证',
      },
      '2025': {
        title: '创业企业重新认定',
        description: '重新认定为创业企业（研发型），有效期至2028年6月',
      },
      '2026': {
        title: 'LUMINO WAVE发布',
        description: '计划发布下一代LUMINO WAVE设备（2026年下半年）',
      },
    },
    rnd: {
      label: '研发能力',
      title: '研究与开发能力',
      subtitle: 'BRITZMEDI是一家技术密集型企业，专注于知识产权以确保在美容医疗领域的竞争优势。',
      points: {
        research: '2017年起获得企业附属研究所认定',
        venture: '创业企业（研发型）认证，有效期至2028年6月',
        patents: '自主研发的融合技术专利',
        inventors: '核心发明人引领先进技术专利申请',
      },
    },
    tech: {
      title: '核心技术',
      convergence: {
        name: '融合疗法',
        description: '结合超声波和激光技术以最大化皮肤渗透',
      },
      multiwave: {
        name: '多波射频技术',
        description: '采用分段电极设计的专利射频热系统',
      },
      transdermal: {
        name: '经皮给药',
        description: '利用声学空化技术实现皮肤深层吸收',
      },
    },
    manufacturing: {
      label: '制造',
      title: '制造与OEM/ODM能力',
      subtitle: 'BRITZMEDI拥有完整的制造周期能力，为全球合作伙伴提供开发服务。',
      infrastructure: {
        title: '制造基础设施',
        description: '我公司在华城市运营经食品药品安全部授权的专用制造设施。',
        mfdsLicense: 'MFDS许可证号',
        gmpCertified: 'GMP认证制造',
        isoCertified: 'ISO 13485:2016认证',
      },
      oem: {
        title: 'OEM/ODM准备',
        description: '已在美国FDA正式注册为合同制造商，验证了我们生产符合美国标准的医疗器械的能力。',
        fdaRegistered: 'FDA注册合同制造商',
        ownerOperator: 'Owner/Operator编号',
        e2eSupport: '端到端产品开发支持',
      },
      cta: '洽谈合作机会',
    },
    mission: {
      title: '我们的使命',
      description: '为全球专业人士提供创新、安全、有效的美容医疗解决方案。',
    },
    team: {
      title: '领导团队',
    },
  },

  // Blog
  blog: {
    title: '博客 - 医疗器械行业洞察与RF技术',
    subtitle: 'BRITZMEDI关于RF技术、FDA审批流程和美容医疗趋势的专业见解。',
    heroLabel: '博客与洞察',
    heroTitle: '行业洞察与更新',
    heroDescription: '了解美容医疗器械行业的最新新闻、技术洞察和教育内容。',
    featured: '精选',
    featuredArticles: '精选文章',
    allArticles: '所有文章',
    readMore: '阅读更多',
    backToBlog: '返回博客',
    share: '分享',
    faq: '常见问题',
    home: '首页',
    categories: {
      all: '所有文章',
      industryNews: '行业新闻',
      productUpdates: '产品更新',
      technology: '技术',
      clinicalStudies: '临床研究',
      education: '教育',
    },
  },

  // Contact / Lead Form
  contact: {
    title: '联系我们',
    subtitle: '与我们的团队取得联系',
    responseTime: '我们将在24-48小时内回复您。',
    hero: {
      label: '联系我们',
      title1: '让我们开始',
      title2: '对话',
      description: '无论您对我们的产品感兴趣、正在探索合作机会，还是需要技术支持，我们的团队随时为您提供帮助。',
    },
    getInTouch: '联系我们',
    form: {
      title: '索取信息',
      description: '请填写以下表格，我们将在1-2个工作日内回复您。',
      companyName: '公司名称',
      companyWebsite: '公司网站',
      yourName: '您的姓名',
      jobTitle: '职位',
      businessEmail: '商务邮箱',
      country: '国家',
      interestedIn: '感兴趣的产品',
      selectAtLeastOne: '请至少选择一项',
      message: '留言',
      privacy: '我同意收集和使用我的个人信息以回复我的咨询。',
      submit: '提交咨询',
      submitting: '提交中...',
      distributionPartnership: '分销合作',
      oemOdm: 'OEM/ODM咨询',
    },
    placeholders: {
      companyName: '您的公司名称',
      companyWebsite: 'www.example.com',
      yourName: '张三',
      jobTitle: 'CEO / 总监 / 经理',
      businessEmail: 'you@company.com',
      selectCountry: '请选择您的国家',
    },
    hints: {
      businessEmail: '请使用您的公司电子邮箱',
    },
    validation: {
      required: '此字段为必填项',
      companyNameMin: '公司名称为必填项（至少2个字符）。',
      yourNameMin: '您的姓名为必填项（至少2个字符）。',
      jobTitleRequired: '职位为必填项。',
      countryRequired: '请选择您的国家。',
      invalidEmail: '请输入有效的电子邮件地址。',
      businessEmailRequired: '请使用您的商务邮箱。不接受个人邮箱（Gmail、Yahoo等）。',
      tempEmailNotAccepted: '不接受临时电子邮件地址。',
      invalidUrl: '请输入有效的网址。',
      companyWebsiteRequired: '公司网站为必填项。',
      businessWebsiteRequired: '请输入有效的企业网站URL。',
      selectAtLeastOne: '请至少选择一项产品或服务。',
    },
    success: {
      title: '咨询提交成功！',
      message: '感谢您的咨询。我们将在1-2个工作日内回复您。',
    },
    error: {
      title: '提交失败',
      duplicateEmail: '此电子邮件已提交过咨询。我们将尽快与您联系。',
      generic: '请稍后重试或通过电子邮件直接联系我们：contact@britzmedi.co.kr',
    },
    info: {
      title: '联系信息',
      headquarters: '总部及工厂',
      address: '地址',
      phone: '电话',
      email: '邮箱',
      website: '网站',
    },
    map: {
      location: '韩国京畿道华城市',
    },
  },

  // FAQ
  faq: {
    title: '常见问题',
    subtitle: '查找常见问题的答案',
    heroLabel: '支持',
    heroDescription: '查找关于我们产品、公司、订购流程、技术支持和认证的常见问题解答。',
    stillHaveQuestions: '还有其他问题吗？',
    stillHaveQuestionsDesc: '找不到您要找的答案？我们的团队随时为您提供帮助。联系我们，我们将在1-2个工作日内回复您。',
    contactUs: '联系我们',
    emailUs: '发送邮件',
    categories: {
      products: '产品',
      company: '公司',
      ordering: '订购与分销',
      technical: '技术支持',
      certifications: '认证',
    },
    items: {
      'what-is-torr-rf': {
        question: 'TORR RF是什么？主要用途是什么？',
        answer: 'TORR RF是我们获得FDA 510(k)批准的旗舰医疗设备，采用创新的多波射频技术将热能传递到真皮层和皮下组织。主要用于皮肤紧致、减少皱纹和身体塑形等非侵入性美容治疗。该设备采用专利的分段电极设计，可实现精准的能量传递。',
      },
      'torr-rf-fda-cleared': {
        question: 'TORR RF获得FDA批准了吗？',
        answer: '是的，TORR RF于2022年获得FDA 510(k)批准（K212561）。该批准确认该设备符合美国食品药品监督管理局要求的安全性和有效性标准，可在美国市场销售。',
      },
      'ulblanc-features': {
        question: 'ULBLANC与其他超声波设备有何不同？',
        answer: 'ULBLANC是一款综合护肤工作站，将双频超声波技术与用于经皮给药的声学空化（i-Booster技术）相结合。这种独特的组合既能实现皮肤紧致效果，又能增强护肤品的吸收，成为美容诊所的多功能解决方案。',
      },
      'newchae-shot-home-use': {
        question: 'NEWCHAE SHOT可以在家使用吗？',
        answer: '是的，NEWCHAE SHOT专为家用设计，是一款3合1个人美容设备。它将专业级医疗技术集成到紧凑、易用的设计中，具有多通道能量传递功能，让消费者在家也能获得专业级的护肤效果。',
      },
      'lumino-wave-availability': {
        question: 'LUMINO WAVE什么时候上市？',
        answer: 'LUMINO WAVE计划于2026年下半年发布。这款新一代设备采用我们创新的融合疗法技术，结合超声波和激光以最大化皮肤渗透。如需获取上市通知，请联系我们的销售团队。',
      },
      'company-history': {
        question: 'BRITZMEDI是什么时候成立的？',
        answer: 'BRITZMEDI株式会社于2017年10月23日在韩国成立。我们从企业附属研究所起步，已发展成为获得FDA批准、ISO 13485认证和创业企业认定的全球医疗器械制造商。',
      },
      'company-location': {
        question: 'BRITZMEDI位于哪里？',
        answer: '我们的总部和制造设施位于大韩民国京畿道城南市中原区屯村大路388号1211室（邮编：13403）。我们运营着具有综合研发能力的GMP认证制造设施。',
      },
      'rd-capabilities': {
        question: 'BRITZMEDI有自己的研发能力吗？',
        answer: '是的，BRITZMEDI运营着配备专业研发人员的企业附属研究所。我们已注册11项以上专利（国内10项，国际1项）和5个商标。研发型创业企业认定确认了我们对美容医疗技术创新的承诺。',
      },
      'become-distributor': {
        question: '如何成为BRITZMEDI的经销商？',
        answer: '我们欢迎全球合格经销商的合作咨询。如需成为经销商，请通过Contact页面向我们的销售团队提供贵公司信息、感兴趣的区域以及医疗器械分销相关经验。我们将审核您的申请并安排咨询。',
      },
      'minimum-order': {
        question: '最小订购量是多少？',
        answer: '最小订购量因产品和市场而异。请联系我们的销售团队，根据您的区域和需求获取具体的MOQ信息。我们为合格经销商提供灵活的条件，也可以讨论评估用样品事宜。',
      },
      'shipping-international': {
        question: '你们提供国际配送吗？',
        answer: '是的，我们向全球经销商和合作伙伴配送。产品在韩国的GMP认证设施制造，按照国际医疗器械运输标准发货。配送条款和物流将在合作谈判中讨论。',
      },
      'oem-odm-services': {
        question: '你们提供OEM/ODM服务吗？',
        answer: '是的，BRITZMEDI是FDA注册的合同制造商（Owner Operator Number: 10088936），提供全面的OEM/ODM服务。我们利用GMP认证设施和经验丰富的研发团队，提供从设计到制造的端到端开发服务。如需讨论具体需求，请联系我们。',
      },
      'training-provided': {
        question: '你们提供设备培训吗？',
        answer: '是的，我们为所有医疗设备提供全面的培训计划。培训包括设备操作、治疗方案、安全程序和维护。培训可以在现场、韩国设施或通过我们的数字培训平台进行。培训安排请联系当地经销商或我们的支持团队。',
      },
      'warranty-policy': {
        question: '保修政策是什么？',
        answer: 'BRITZMEDI产品附带标准制造商保修。保修条款和范围因产品和地区而异。保修涵盖制造缺陷并包括技术支持。还提供延长保修选项。具体保修信息请参阅购买文件或联系我们的支持团队。',
      },
      'technical-support': {
        question: '如何获得技术支持？',
        answer: '技术支持通过多种渠道提供：1）联系当地授权经销商，2）发送电子邮件至contact@britzmedi.co.kr联系我们的支持团队，3）在工作时间（周一至周五上午9点至下午6点韩国时间）致电+82-70-4348-7244。我们的目标是在1-2个工作日内回复所有咨询。',
      },
      'iso-certification': {
        question: 'BRITZMEDI获得ISO认证了吗？',
        answer: '是的，BRITZMEDI获得了ISO 13485:2016认证，这是医疗器械质量管理体系的国际标准。该认证证明了我们在医疗器械的设计、开发和制造方面对一致质量和法规合规的承诺。',
      },
      'gmp-certified': {
        question: '你们的制造设施获得GMP认证了吗？',
        answer: '是的，我们的制造设施获得了韩国食品药品安全部（MFDS）的GMP（良好生产规范）认证。我们于2021年获得该认证，确保产品按照质量标准持续生产和控制。',
      },
      'regulatory-approvals': {
        question: '你们的产品获得了哪些法规批准？',
        answer: '我们的产品根据市场持有各种法规批准。TORR RF获得了美国市场的FDA 510(k)批准和韩国MFDS批准。所有产品都获得了韩国MFDS批准。我们正在不断扩大法规组合，可根据要求提供目标市场的具体认证信息。',
      },
    },
  },

  // Certifications page
  certifications: {
    title: '认证',
    subtitle: '质量与法规状态',
    heroLabel: '质量与合规',
    heroTitle1: '认证 &',
    heroTitle2: '法规状态',
    qualityTitle: '质量与法规认证',
    qualitySubtitle: '我们的综合认证展示了对质量和患者安全的承诺。',
    technicalLabel: '合规',
    technicalTitle: '技术安全标准',
    technicalSubtitle: '我们的设备经过设计和测试，符合FDA 510(k)和MFDS审查过程中验证的严格国际安全标准。',
    powerRequirements: '电源要求',
    voltage: '电压',
    protectionClass: '保护等级',
    roadmapLabel: '全球扩展',
    roadmapTitle: '法规路线图',
    roadmapSubtitle: '我们正在努力将BRITZMEDI产品推向全球市场。',
    tableRegion: '地区 / 机构',
    tableProduct: '产品',
    tableStatus: '状态',
    tableNotes: '备注',
    fdaNote: '关于FDA批准的重要说明',
    ctaTitle: '需要认证文件吗？',
    ctaSubtitle: '请联系我们索取证书副本、测试报告或详细的法规信息。',
    ctaRequest: '申请文件',
    ctaViewProducts: '查看产品',
    status: {
      certified: '已认证',
      cleared: '已批准',
      registered: '已注册',
      inPreparation: '准备中',
      planned: '计划中',
    },
    certificateNo: '证书编号',
    validUntil: '有效期至',
    products: '产品:',
  },

  // Resources page
  resources: {
    title: '资源',
    subtitle: '资源中心',
    heroLabel: '下载',
    heroTitle1: '资源',
    heroTitle2: '中心',
    heroDescription: '访问产品手册、技术文档、营销材料、证书和视频。所有资源均可下载。',
    allResources: '所有资源',
    categories: {
      productBrochure: '产品手册',
      technicalDocs: '技术文档',
      marketing: '营销材料',
      certificates: '证书',
      videos: '产品视频',
    },
    download: '下载',
    noResults: '未找到资源',
    noResultsDesc: '请尝试选择其他类别。',
    ctaTitle: '需要其他材料吗？',
    ctaSubtitle: '正在寻找特定文档、定制演示文稿或本地化材料？请联系我们的团队，我们将为您准备所需的资源。',
    ctaRequest: '申请材料',
  },

  // Privacy page
  privacy: {
    title: '隐私政策',
    heroLabel: '法律',
    lastUpdated: '最后更新：2025年1月',
    intro: {
      title: '引言',
      p1: 'BRITZMEDI株式会社（以下简称"公司"、"我们"）运营britzmedi.com网站及相关服务。本隐私政策说明了当您访问我们的网站和使用我们的服务时，我们如何收集、使用、披露和保护您的信息。',
      p2: '请仔细阅读本隐私政策。如果您不同意我们的政策和做法，请不要使用我们的服务。',
    },
    collection: {
      title: '1. 我们收集的信息',
      personalTitle: '您提供的个人信息',
      personalDesc: '我们可能会收集您自愿提供的个人信息，包括：',
      autoTitle: '自动收集的信息',
      autoDesc: '当您访问我们的网站时，我们会自动收集以下信息：',
    },
    contactTitle: '联系信息',
    contactDesc: '如果您对本隐私政策或我们的隐私做法有任何疑问，请联系我们：',
  },

  // Terms page
  terms: {
    title: '服务条款',
    heroLabel: '法律',
    lastUpdated: '最后更新：2025年1月',
    intro: {
      title: '引言',
      p1: '本服务条款（以下简称"条款"）规定您对BRITZMEDI株式会社（以下简称"公司"、"我们"）提供的britzmedi.com网站及所有相关服务、内容和产品的访问和使用。',
      p2: '通过访问和使用我们的网站，即表示您同意受本条款的约束。如果您不同意本条款，请不要使用我们的网站或服务。',
    },
    contactTitle: '联系信息',
    contactDesc: '如果您对本服务条款有任何疑问或需要报告违规行为，请联系我们：',
  },

  // Footer
  footer: {
    description: '凭借FDA批准技术，引领韩国美容医疗创新。',
    products: '产品',
    company: '公司',
    resources: '资源',
    contact: '联系我们',
    support: '支持',
    legal: '法律',
    links: {
      aboutUs: '关于我们',
      certifications: '认证',
      faq: '常见问题',
      resourceCenter: '资源中心',
      productBrochures: '产品手册',
      technicalDocs: '技术文档',
      certificates: '证书',
    },
    badges: {
      fdaCleared: 'FDA 510(k)批准',
      iso: 'ISO 13485',
      gmp: 'GMP认证',
    },
    privacyPolicy: '隐私政策',
    termsOfService: '服务条款',
    copyright: '© {year} BRITZMEDI Co., Ltd. 保留所有权利。',
  },

  // 404
  notFound: {
    title: '页面未找到',
    message: '您要查找的页面不存在。',
    backHome: '返回首页',
  },
};
