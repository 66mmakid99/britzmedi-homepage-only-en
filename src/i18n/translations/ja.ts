// Japanese translations
import type { TranslationKeys } from './en';

export const ja: TranslationKeys = {
  // Navigation
  nav: {
    products: '製品',
    about: '会社概要',
    certifications: '認証',
    resources: 'リソース',
    faq: 'よくある質問',
    contact: 'お問い合わせ',
    contactUs: 'お問い合わせ',
  },

  // Common
  common: {
    learnMore: '詳しく見る',
    viewDetails: '詳細を見る',
    downloadBrochure: 'パンフレットをダウンロード',
    getQuote: '見積もりを取得',
    contactSales: '営業に連絡',
    readMore: '続きを読む',
    viewAll: 'すべて見る',
    backTo: '戻る',
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    submit: '送信',
    cancel: 'キャンセル',
    close: '閉じる',
    search: '検索',
    filter: 'フィルター',
    sort: '並べ替え',
    all: 'すべて',
    upcoming: '近日公開',
    appliedTo: '適用製品',
  },

  // Home page
  home: {
    hero: {
      title: '革新的な美容医療ソリューション',
      subtitle: 'FDA 510(k) 認可 | ISO 13485 認証 | GMP 製造',
      cta: '製品を見る',
      ctaSecondary: 'ディストリビューターになる',
    },
    features: {
      title: 'なぜBRITZMEDIを選ぶのか',
      subtitle: '世界中の専門家から信頼されています',
    },
    products: {
      title: '製品ラインナップ',
      subtitle: '美容専門家のための先進医療機器',
    },
    certifications: {
      title: 'グローバル認証',
      subtitle: '最高の国際基準を満たしています',
    },
  },

  // Products
  products: {
    title: '製品',
    subtitle: '革新的な医療機器',
    category: {
      all: 'すべての製品',
      medicalDevice: '医療機器',
      cosmetic: '化粧品',
    },
    status: {
      available: '販売中',
      comingSoon: '近日発売',
    },
    details: {
      overview: '概要',
      keyTechnologies: '主要技術',
      indications: '適応症',
      specifications: '仕様',
      certifications: '認証',
      clinicalBenefits: '臨床効果',
      handpieces: 'ハンドピース',
    },
  },

  // About page
  about: {
    title: 'BRITZMEDIについて',
    subtitle: '韓国発の美容医療機器メーカー',
    hero: {
      label: 'BRITZMEDIについて',
      title1: '美容医療の',
      title2: 'イノベーションを先導',
    },
    overview: {
      title: '会社概要',
      companyName: '会社名',
      ceo: '代表取締役',
      appointed: '就任',
      established: '設立',
      headquarters: '本社・工場',
      businessType: '事業形態',
    },
    philosophy: {
      title: '経営理念',
      text: '美容機器の開発を超えて、日常における持続可能な美しさを研究しています。',
    },
    ip: {
      title: '知的財産',
      registeredPatents: '登録特許',
      trademarks: '商標',
      domesticPatents: '国内特許',
      internationalPatents: '海外特許',
    },
    history: {
      label: '沿革',
      title: '会社の歩みとマイルストーン',
      subtitle: '専門R&D研究所からFDA認可を取得したグローバル医療機器メーカーへ成長しました。',
    },
    milestones: {
      '2017': {
        title: '会社設立',
        description: 'BRITZMEDI株式会社設立、企業付設研究所認定取得',
      },
      '2021': {
        title: 'GMP認証',
        description: '食品医薬品安全処GMP認証取得',
      },
      '2022': {
        title: 'FDA承認・ISO認証',
        description: 'TORR RF FDA 510(k)承認（K212561）およびISO 13485:2016認証取得',
      },
      '2025': {
        title: 'ベンチャー企業再指定',
        description: 'ベンチャー企業（研究開発型）再指定、2028年6月まで有効',
      },
      '2026': {
        title: 'LUMINO WAVE発売',
        description: '次世代LUMINO WAVEデバイス発売予定（2026年下半期）',
      },
    },
    rnd: {
      label: 'R&D力',
      title: '研究開発力',
      subtitle: 'BRITZMEDIは美容医療分野で競争優位を確保するため、知的財産に重点を置いた技術集約型企業として運営しています。',
      points: {
        research: '2017年より企業付設研究所認定',
        venture: 'ベンチャー企業（研究開発型）認証、2028年6月まで有効',
        patents: '自社開発の融合技術特許保有',
        inventors: 'コア発明者が先端技術特許出願をリード',
      },
    },
    tech: {
      title: 'コア技術',
      convergence: {
        name: '融合セラピー',
        description: '超音波とレーザーを組み合わせて皮膚浸透を最大化する技術',
      },
      multiwave: {
        name: 'マルチウェーブRF技術',
        description: '分割電極設計を採用した特許RF熱システム',
      },
      transdermal: {
        name: '経皮デリバリー',
        description: '音響キャビテーション技術による深部皮膚吸収',
      },
    },
    manufacturing: {
      label: '製造',
      title: '製造およびOEM/ODM能力',
      subtitle: 'BRITZMEDIは製造の全サイクルを保有し、グローバルパートナー向けの開発サービスを提供しています。',
      infrastructure: {
        title: '製造インフラ',
        description: '食品医薬品安全処の認可を受けた華城市の専用製造施設を運営しています。',
        mfdsLicense: 'MFDS許可番号',
        gmpCertified: 'GMP認証製造',
        isoCertified: 'ISO 13485:2016認証',
      },
      oem: {
        title: 'OEM/ODM対応',
        description: '米国FDAに契約製造業者として正式登録されており、米国基準に適合した医療機器の製造能力が検証されています。',
        fdaRegistered: 'FDA登録契約製造業者',
        ownerOperator: 'Owner/Operator番号',
        e2eSupport: '製品開発の全工程をサポート',
      },
      cta: 'パートナーシップについてお問い合わせ',
    },
    mission: {
      title: 'ミッション',
      description: '世界中の専門家に革新的で安全かつ効果的な美容医療ソリューションを提供します。',
    },
    team: {
      title: '経営陣',
    },
  },

  // Contact / Lead Form
  contact: {
    title: 'お問い合わせ',
    subtitle: '私たちのチームにご連絡ください',
    responseTime: '24〜48時間以内にご返答いたします。',
    form: {
      companyName: '会社名',
      companyWebsite: '会社ウェブサイト',
      yourName: 'お名前',
      jobTitle: '役職',
      businessEmail: 'ビジネスメール',
      country: '国',
      interestedIn: '興味のある製品',
      message: 'メッセージ',
      privacy: 'プライバシーポリシーに同意します',
      submit: 'お問い合わせを送信',
      submitting: '送信中...',
    },
    validation: {
      required: 'この項目は必須です',
      invalidEmail: '有効なメールアドレスを入力してください',
      businessEmailRequired: 'ビジネスメールをご使用ください',
      invalidUrl: '有効なURLを入力してください',
      selectAtLeastOne: '少なくとも1つ選択してください',
    },
    success: {
      title: 'ありがとうございます！',
      message: 'お問い合わせを受け付けました。24-48時間以内にご連絡いたします。',
    },
    info: {
      title: '連絡先情報',
      address: '住所',
      phone: '電話',
      email: 'メール',
    },
  },

  // FAQ
  faq: {
    title: 'よくある質問',
    subtitle: 'よくある質問への回答をご覧ください',
    categories: {
      products: '製品',
      company: '会社',
      ordering: '注文・販売',
      technical: '技術サポート',
      certifications: '認証',
    },
  },

  // Footer
  footer: {
    description: 'FDA認可技術を持つ韓国発の美容医療イノベーションをリードしています。',
    products: '製品',
    company: '会社',
    resources: 'リソース',
    contact: 'お問い合わせ',
    support: 'サポート',
    legal: '法的情報',
    links: {
      aboutUs: '会社概要',
      certifications: '認証',
      faq: 'よくある質問',
      resourceCenter: 'リソースセンター',
      productBrochures: '製品パンフレット',
      technicalDocs: '技術文書',
      certificates: '証明書',
    },
    badges: {
      fdaCleared: 'FDA 510(k)認可',
      iso: 'ISO 13485',
      gmp: 'GMP認証',
    },
    privacyPolicy: 'プライバシーポリシー',
    termsOfService: '利用規約',
    copyright: '© {year} BRITZMEDI Co., Ltd. All rights reserved.',
  },

  // 404
  notFound: {
    title: 'ページが見つかりません',
    message: 'お探しのページは存在しません。',
    backHome: 'ホームに戻る',
  },
};
