// Japanese translations
import type { TranslationKeys } from './en';

export const ja: TranslationKeys = {
  // Navigation
  nav: {
    products: '製品',
    about: '会社概要',
    certifications: '認証',
    resources: 'リソース',
    blog: 'ブログ',
    news: 'ニュース',
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
      gallery: 'ギャラリー',
      productImages: '製品画像',
      technology: 'テクノロジー',
      clinicalUse: '臨床使用',
      technicalData: '技術データ',
      accessories: 'アクセサリー',
      handpieceConfig: 'ハンドピース構成',
      benefits: '効果',
      tipSize: 'チップサイズ',
      depth: '深度',
      flagshipProduct: 'フラッグシップ製品',
      comingH22026: '2026年下半期発売予定',
      medicalDevice: '医療機器',
      medicalCosmetic: 'メディカルコスメ',
      model: 'モデル',
      requestQuote: '見積もり依頼',
      requestDemo: 'デモ依頼',
      interestedIn: 'この製品にご興味がありますか？',
      contactCta: '価格、デモスケジュール、技術的なご質問は営業チームにお問い合わせください。',
      viewAllProducts: '全製品を見る',
      home: 'ホーム',
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

  // Blog
  blog: {
    title: 'ブログ - 医療機器業界の洞察とRF技術',
    subtitle: 'BRITZMEDIによるRF技術、FDA認可プロセス、美容医療のトレンドに関する専門的な洞察。',
    heroLabel: 'ブログ＆インサイト',
    heroTitle: '業界の洞察とアップデート',
    heroDescription: '美容医療機器業界の最新ニュース、技術的洞察、教育コンテンツをご覧ください。',
    featured: '注目',
    featuredArticles: '注目の記事',
    allArticles: 'すべての記事',
    readMore: '続きを読む',
    backToBlog: 'ブログに戻る',
    share: '共有',
    faq: 'よくある質問',
    home: 'ホーム',
    categories: {
      all: 'すべての投稿',
      industryNews: '業界ニュース',
      productUpdates: '製品アップデート',
      technology: 'テクノロジー',
      clinicalStudies: '臨床研究',
      education: '教育',
      medicalDevices: '医療機器',
    },
    posts: {
      'fda-510k-clearance-process': {
        title: 'FDA 510(k)認可：医療機器ディストリビューターのための完全ガイド',
        description: 'FDA 510(k)認可について、プロセスの手順やコストからビジネスへの影響まで、ディストリビューターが知っておくべきすべてのこと。',
      },
      'rf-technology-aesthetic-medicine': {
        title: '美容医療におけるRF技術：クリニックがRFデバイスでROIを最大化する方法',
        description: 'クリニックオーナーとデバイスバイヤーのためのRF技術総合ガイド。',
      },
      'korean-beauty-device-market': {
        title: '韓国美容機器市場：世界のディストリビューターが韓国メーカーと提携する理由',
        description: '韓国美容機器業界の市場データ、規制環境、パートナーシップの機会。',
      },
    },
    contentNotice: 'この記事は英語で書かれています。',
    readInEnglish: '英語で読む',
    pagination: {
      previous: '前へ',
      next: '次へ',
      page: 'ページ',
    },
    noPostsFound: 'このカテゴリーには記事がありません。',
  },

  // Contact / Lead Form
  contact: {
    title: 'お問い合わせ',
    subtitle: '私たちのチームにご連絡ください',
    responseTime: '24〜48時間以内にご返答いたします。',
    hero: {
      label: 'お問い合わせ',
      title1: '会話を',
      title2: '始めましょう',
      description: '製品にご興味がある方、パートナーシップの機会を探している方、技術サポートが必要な方、私たちのチームがお手伝いします。',
    },
    getInTouch: 'お問い合わせ',
    form: {
      title: '情報をリクエスト',
      description: '以下のフォームにご記入ください。1〜2営業日以内にご連絡いたします。',
      companyName: '会社名',
      companyWebsite: '会社ウェブサイト',
      yourName: 'お名前',
      jobTitle: '役職',
      businessEmail: 'ビジネスメール',
      country: '国',
      interestedIn: '興味のある製品',
      selectAtLeastOne: '1つ以上選択してください',
      optional: '任意',
      message: 'メッセージ',
      privacy: '私の問い合わせに対応するため、個人情報の収集および使用に同意します。',
      submit: 'お問い合わせを送信',
      submitting: '送信中...',
      distributionPartnership: '販売代理店パートナーシップ',
      oemOdm: 'OEM/ODMに関するお問い合わせ',
      howDidYouHear: '弊社をどのようにお知りになりましたか？',
      emailWarningTitle: '会社のメールアドレスを推奨。',
      emailWarningBody: '無料メール（Gmail、Yahooなど）はご対応の優先度が下がる場合があります。迅速なご返答のため、会社のメールアドレスのご使用をお勧めします。',
      softEmailWarning: '迅速なご返答のため、会社のメールアドレスのご使用をお勧めします。',
    },
    placeholders: {
      companyName: '貴社名',
      companyWebsite: 'www.example.com',
      yourName: '山田 太郎',
      jobTitle: 'CEO / 取締役 / マネージャー',
      businessEmail: 'you@company.com',
      selectCountry: '国を選択してください',
      message: 'ご要望をお聞かせください...',
      selectOption: 'オプションを選択してください',
    },
    referral: {
      googleSearch: 'Google検索',
      tradeShow: '業界イベント / 展示会',
      referral: '紹介',
      socialMedia: 'ソーシャルメディア',
      articleBlog: 'オンライン記事 / ブログ',
      aiAssistant: 'AIアシスタント（ChatGPTなど）',
      other: 'その他',
    },
    hints: {
      businessEmail: '会社のメールアドレスをご使用ください',
    },
    validation: {
      required: 'この項目は必須です',
      companyNameMin: '会社名は必須です（2文字以上）。',
      yourNameMin: 'お名前は必須です（2文字以上）。',
      jobTitleRequired: '役職は必須です。',
      countryRequired: '国を選択してください。',
      invalidEmail: '有効なメールアドレスを入力してください。',
      businessEmailRequired: 'ビジネスメールをご使用ください。個人メール（Gmail、Yahooなど）は受け付けておりません。',
      tempEmailNotAccepted: '一時的なメールアドレスは受け付けておりません。',
      invalidUrl: '有効なウェブサイトURLを入力してください。',
      companyWebsiteRequired: '会社ウェブサイトは必須です。',
      businessWebsiteRequired: '有効なビジネスウェブサイトURLを入力してください。',
      selectAtLeastOne: '少なくとも1つの製品またはサービスを選択してください。',
    },
    success: {
      title: 'お問い合わせが正常に送信されました！',
      message: 'お問い合わせありがとうございます。1〜2営業日以内にご連絡いたします。',
    },
    error: {
      title: '送信に失敗しました',
      duplicateEmail: 'このメールアドレスでのお問い合わせは既に送信されています。まもなくご連絡いたします。',
      generic: '後でもう一度お試しいただくか、sh.lee@britzmedi.com まで直接メールでお問い合わせください。',
    },
    info: {
      title: '連絡先情報',
      headquarters: '本社・工場',
      address: '住所',
      phone: '電話',
      email: 'メール',
      website: 'ウェブサイト',
    },
    map: {
      location: '大韓民国 京畿道 華城市',
    },
  },

  // FAQ
  faq: {
    title: 'よくある質問',
    subtitle: 'よくある質問への回答をご覧ください',
    heroLabel: 'サポート',
    heroDescription: '製品、会社、注文プロセス、技術サポート、認証に関するよくある質問の回答をご覧ください。',
    stillHaveQuestions: 'まだご質問がありますか？',
    stillHaveQuestionsDesc: 'お探しの回答が見つかりませんか？私たちのチームがお手伝いします。お問い合わせいただければ、1-2営業日以内にご連絡いたします。',
    contactUs: 'お問い合わせ',
    emailUs: 'メールで問い合わせ',
    categories: {
      products: '製品',
      company: '会社',
      ordering: '注文・販売',
      technical: '技術サポート',
      certifications: '認証',
    },
    items: {
      'what-is-torr-rf': {
        question: 'TORR RFとは何ですか？主な用途は何ですか？',
        answer: 'TORR RFは、FDA 510(k)承認を取得した当社の主力医療機器です。革新的なマルチウェーブ高周波技術を使用して、真皮層および皮下組織に熱エネルギーを送達します。主に皮膚の引き締め、シワの軽減、ボディコンタリングを含む非侵襲的な美容治療に使用されます。精密なエネルギー送達のための特許取得済みの分割電極設計が特徴です。',
      },
      'torr-rf-fda-cleared': {
        question: 'TORR RFはFDA承認を取得していますか？',
        answer: 'はい、TORR RFは2022年にFDA 510(k)承認（K212561）を取得しています。この承認は、当該機器が米国食品医薬品局が要求する安全性および有効性基準を満たし、米国内での販売が可能であることを確認しています。',
      },
      'ulblanc-features': {
        question: 'ULBLANCは他の超音波機器とどう違いますか？',
        answer: 'ULBLANCは、デュアル周波数超音波技術と経皮薬物送達のための音響キャビテーション（i-Booster技術）を組み合わせた総合スキンケアワークステーションです。この独自の組み合わせにより、皮膚の引き締め効果とスキンケア製品の吸収向上の両方が可能となり、美容クリニック向けの多用途ソリューションとなっています。',
      },
      'newchae-shot-home-use': {
        question: 'NEWCHAE SHOTは家庭で使用できますか？',
        answer: 'はい、NEWCHAE SHOTはホームケア用の3-in-1パーソナル美容デバイスとして特別に設計されています。マルチチャンネルエネルギー送達機能を備えたコンパクトで使いやすい形状に、プロフェッショナルグレードの医療技術を統合し、消費者が自宅でプロレベルのスキンケア結果を得ることができます。',
      },
      'lumino-wave-availability': {
        question: 'LUMINO WAVEはいつ発売されますか？',
        answer: 'LUMINO WAVEは2026年下半期に発売予定です。この次世代デバイスは、超音波とレーザーを組み合わせて皮膚浸透を最大化する革新的な融合セラピー技術を搭載しています。発売のお知らせを受け取るには、営業チームにお問い合わせください。',
      },
      'company-history': {
        question: 'BRITZMEDIはいつ設立されましたか？',
        answer: 'BRITZMEDI株式会社は2017年10月23日に韓国で設立されました。企業付設研究所としてスタートし、FDA承認、ISO 13485認証、ベンチャー企業指定を取得したグローバル医療機器メーカーに成長しました。',
      },
      'company-location': {
        question: 'BRITZMEDIはどこにありますか？',
        answer: '本社と製造施設は、大韓民国京畿道城南市中院区屯村大路388、1211号（郵便番号：13403）にあります。統合R&D機能を備えたGMP認証製造施設を運営しています。',
      },
      'rd-capabilities': {
        question: 'BRITZMEDIは独自のR&D能力を持っていますか？',
        answer: 'はい、BRITZMEDIは専任のR&Dスタッフを擁する企業付設研究所を運営しています。11件以上の特許（国内10件、海外1件）と5件の商標を登録しています。R&D型ベンチャー企業指定は、美容医療技術の革新への当社の取り組みを確認するものです。',
      },
      'become-distributor': {
        question: 'BRITZMEDIの販売代理店になるにはどうすればよいですか？',
        answer: '世界中の資格のある販売代理店からのパートナーシップのお問い合わせを歓迎しています。販売代理店になるには、Contactページから御社の情報、関心のある地域、医療機器販売に関連する経験を営業チームにお問い合わせください。申請を審査し、相談を手配いたします。',
      },
      'minimum-order': {
        question: '最小注文数量はいくらですか？',
        answer: '最小注文数量は製品と市場によって異なります。お客様の地域と要件に基づいた具体的なMOQ情報については、営業チームにお問い合わせください。資格のある販売代理店には柔軟な条件を提供し、評価用のサンプルユニットについても相談可能です。',
      },
      'shipping-international': {
        question: '海外配送は可能ですか？',
        answer: 'はい、世界中の販売代理店およびパートナーに配送しています。製品は韓国のGMP認証施設で製造され、国際医療機器配送基準に従って出荷されます。配送条件と物流はパートナーシップ交渉時に協議します。',
      },
      'oem-odm-services': {
        question: 'OEM/ODMサービスを提供していますか？',
        answer: 'はい、BRITZMEDIはFDA登録契約製造業者（Owner Operator Number: 10088936）として、包括的なOEM/ODMサービスを提供しています。GMP認証施設と経験豊富なR&Dチームを活用し、設計から製造までのエンドツーエンドの開発サービスを提供しています。具体的なご要件についてはお問い合わせください。',
      },
      'training-provided': {
        question: 'デバイスのトレーニングは提供されますか？',
        answer: 'はい、すべての医療機器について包括的なトレーニングプログラムを提供しています。トレーニングには、デバイスの操作、治療プロトコル、安全手順、メンテナンスが含まれます。トレーニングは現地、韓国の施設、またはデジタルトレーニングプラットフォームを通じて実施できます。トレーニングの手配については、地域の販売代理店またはサポートチームにお問い合わせください。',
      },
      'warranty-policy': {
        question: '保証ポリシーはどのようになっていますか？',
        answer: 'BRITZMEDI製品には標準的なメーカー保証が付いています。保証条件と範囲は製品と地域によって異なります。保証は製造上の欠陥をカバーし、テクニカルサポートが含まれます。延長保証オプションもご利用いただけます。具体的な保証情報については、購入書類を参照するか、サポートチームにお問い合わせください。',
      },
      'technical-support': {
        question: 'テクニカルサポートはどのように受けられますか？',
        answer: 'テクニカルサポートは複数のチャネルで提供されています：1）地域の公認販売代理店にご連絡、2）sh.lee@britzmedi.comにメールでサポートチームに問い合わせ、3）営業時間内（月〜金曜日の午前9時〜午後6時KST）に+82-70-4348-7244に電話。すべてのお問い合わせに1-2営業日以内に回答することを目指しています。',
      },
      'iso-certification': {
        question: 'BRITZMEDIはISO認証を取得していますか？',
        answer: 'はい、BRITZMEDIは医療機器品質マネジメントシステムの国際規格であるISO 13485:2016認証を取得しています。この認証は、医療機器の設計、開発、製造における一貫した品質と規制遵守への当社の取り組みを示しています。',
      },
      'gmp-certified': {
        question: '製造施設はGMP認証を取得していますか？',
        answer: 'はい、当社の製造施設は韓国食品医薬品安全処（MFDS）からGMP（医薬品適正製造基準）認証を取得しています。2021年にこの認証を取得し、製品が品質基準に従って一貫して生産・管理されていることを保証しています。',
      },
      'regulatory-approvals': {
        question: '製品はどのような規制承認を取得していますか？',
        answer: '当社製品は市場に応じてさまざまな規制承認を取得しています。TORR RFは米国市場向けのFDA 510(k)承認と韓国MFDS承認を取得しています。すべての製品が韓国MFDS承認を取得しています。規制ポートフォリオを継続的に拡大しており、ご要望に応じてターゲット市場向けの具体的な認証情報を提供いたします。',
      },
    },
  },

  // Certifications page
  certifications: {
    title: '認証',
    subtitle: '品質と規制状況',
    heroLabel: '品質とコンプライアンス',
    heroTitle1: '認証 &',
    heroTitle2: '規制状況',
    qualityTitle: '品質・規制認証',
    qualitySubtitle: '当社の包括的な認証は、品質と患者安全への取り組みを示しています。',
    technicalLabel: 'コンプライアンス',
    technicalTitle: '技術安全規格',
    technicalSubtitle: '当社の機器は、FDA 510(k)およびMFDS審査プロセスで検証された厳格な国際安全基準を満たすよう設計・試験されています。',
    powerRequirements: '電力要件',
    voltage: '電圧',
    protectionClass: '保護クラス',
    roadmapLabel: 'グローバル展開',
    roadmapTitle: '規制ロードマップ',
    roadmapSubtitle: 'BRITZMEDI製品を世界市場に展開するための継続的な取り組み。',
    tableRegion: '地域 / 機関',
    tableProduct: '製品',
    tableStatus: 'ステータス',
    tableNotes: '備考',
    fdaNote: 'FDA承認に関する重要なお知らせ',
    ctaTitle: '認証書類が必要ですか？',
    ctaSubtitle: '証明書のコピー、試験報告書、または詳細な規制情報をリクエストするには、お問い合わせください。',
    ctaRequest: '書類をリクエスト',
    ctaViewProducts: '製品を見る',
    status: {
      certified: '認証済み',
      cleared: '承認済み',
      registered: '登録済み',
      inPreparation: '準備中',
      planned: '計画中',
    },
    certificateNo: '証明書番号',
    validUntil: '有効期限',
    products: '製品:',
  },

  // Resources page
  resources: {
    title: 'リソース',
    subtitle: 'リソースセンター',
    heroLabel: 'ダウンロード',
    heroTitle1: 'リソース',
    heroTitle2: 'センター',
    heroDescription: '製品パンフレット、技術文書、マーケティング資料、証明書、ビデオにアクセスできます。すべてのリソースがダウンロード可能です。',
    allResources: 'すべてのリソース',
    categories: {
      productBrochure: '製品パンフレット',
      technicalDocs: '技術文書',
      marketing: 'マーケティング資料',
      certificates: '証明書',
      videos: '製品動画',
    },
    download: 'ダウンロード',
    noResults: 'リソースが見つかりません',
    noResultsDesc: '別のカテゴリを選択してください。',
    ctaTitle: '追加資料が必要ですか？',
    ctaSubtitle: '特定の文書、カスタムプレゼンテーション、またはローカライズされた資料をお探しですか？チームにお問い合わせいただければ、必要な資料を準備いたします。',
    ctaRequest: '資料をリクエスト',
  },

  // Privacy page
  privacy: {
    title: 'プライバシーポリシー',
    heroLabel: '法的情報',
    lastUpdated: '最終更新: 2025年1月',
    intro: {
      title: 'はじめに',
      p1: 'BRITZMEDI株式会社（以下「当社」）は、britzmedi.comウェブサイトおよび関連サービスを運営しています。このプライバシーポリシーは、当社のウェブサイトを訪問し、サービスを利用する際に収集、使用、開示、保護する情報について説明しています。',
      p2: 'このプライバシーポリシーをよくお読みください。当社のポリシーおよび慣行に同意されない場合は、サービスを利用しないでください。',
    },
    collection: {
      title: '1. 収集する情報',
      personalTitle: 'お客様が提供する個人情報',
      personalDesc: '以下を含む、自発的に提供される個人情報を収集する場合があります:',
      autoTitle: '自動収集情報',
      autoDesc: 'ウェブサイト訪問時に、以下の情報が自動的に収集されます:',
    },
    contactTitle: 'お問い合わせ',
    contactDesc: 'このプライバシーポリシーまたは当社のプライバシー慣行についてご質問がある場合は、お問い合わせください:',
  },

  // Terms page
  terms: {
    title: '利用規約',
    heroLabel: '法的情報',
    lastUpdated: '最終更新: 2025年1月',
    intro: {
      title: 'はじめに',
      p1: 'この利用規約（以下「本規約」）は、BRITZMEDI株式会社（以下「当社」）が提供するbritzmedi.comウェブサイトおよびすべての関連サービス、コンテンツ、製品へのアクセスおよび使用を規定します。',
      p2: 'ウェブサイトにアクセスし使用することで、お客様は本規約に同意したものとみなされます。本規約に同意されない場合は、ウェブサイトまたはサービスを利用しないでください。',
    },
    contactTitle: 'お問い合わせ',
    contactDesc: 'この利用規約についてご質問がある場合、または違反を報告する場合は、お問い合わせください:',
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
    newsletter: {
      title: 'BRITZMEDIの最新情報をお届け',
      subtitle: '最新の製品ニュースと業界インサイトをお届けします。',
      placeholder: 'メールアドレス',
      subscribe: '登録',
      privacy: 'プライバシーを尊重します。いつでも配信停止できます。',
      msgInvalid: '有効なメールアドレスを入力してください。',
      msgSubscribing: '登録中...',
      msgSuccess: 'ご登録ありがとうございます！',
      msgError: '問題が発生しました。もう一度お試しください。',
      msgNetwork: 'ネットワークエラーが発生しました。もう一度お試しください。',
    },
  },

  // 404
  notFound: {
    title: 'ページが見つかりません',
    message: 'お探しのページは存在しません。',
    backHome: 'ホームに戻る',
  },
};
