// Product content translations for all non-English languages
// English content comes directly from src/content/products.ts (source of truth)

export interface ProductTranslation {
  tagline: string;
  overview: string;
  description: string;
  keyTechnologies: { name: string; description: string }[];
  indications?: string[];
  specLabels?: Record<string, string>;
  specNotes?: Record<string, string>;
  handpieces?: { name: string; feature: string }[];
  clinicalBenefits?: string[];
  differentiators?: { feature: string; description: string }[];
  /** 의료기기 필수 표시문구 등 규제 고지 (페이지 하단 렌더, 현재 ko 전용) */
  regulatoryNotice?: string[];
}

type ProductTranslations = Record<string, Record<string, ProductTranslation>>;

const translations: ProductTranslations = {
  // ═══════════════════════════════════════
  // KOREAN (ko)
  // ═══════════════════════════════════════
  ko: {
    'torr-rf': {
      // 국내영업 3단 리플렛(광고심의필 52025-ET1-49-8725, ~2029.01.06) 기반 카피.
      // 효능 단정·비교광고·FDA 적응증 나열 금지 — 설계 특성 중심 서술 유지할 것.
      tagline: '깊게, 그리고 부드럽게',
      overview: 'TORR RF는 고주파 전류를 사용하여 조직의 응고에 사용하는 범용전기수술기입니다. 발생한 고주파 에너지는 설정된 출력 조건에 따라 체표면을 균일하게 가열하도록 설계되었으며, 전극 표면 온도는 실시간으로 감지되어 기준 온도에 도달하면 자동으로 출력이 차단됩니다.',
      description: '자극은 줄이고, 편안함은 높이고. TORR RF는 표면 온도 모니터링, 출력 차단 알고리즘, 핸드피스 구조 설계를 기반으로 일정한 시술 조건을 유지하도록 제작되어, 시술자가 보다 균일한 조건을 확보하는 데 도움을 줍니다. 미국 FDA 510(k) 인증(Clearance, K212561)을 받은 제품입니다. 국내 허가 사용목적은 페이지 하단 필수 표시문구를 참조하십시오.',
      keyTechnologies: [
        {
          name: '자동 원형 모션 헤드',
          description: '핸드피스 헤드가 자동으로 회전하며 고주파 에너지를 균일하게 분배하도록 설계되었습니다. 넓은 부위 시술 시 안정적인 운용을 돕습니다.',
        },
        {
          name: '실시간 온도 모니터링',
          description: '전극 표면 온도를 실시간으로 감지하여 기준 온도에 도달하면 자동으로 출력이 차단되도록 설계되었습니다. 시술 중 온도 편차를 줄여 안정적인 시술 운영을 돕습니다.',
        },
        {
          name: '진동(Vibro) 기능',
          description: '대형 핸드피스에 적용된 진동(Vibro)과 모션헤드 기능으로 시술 시 편의를 제공합니다.',
        },
      ],
      indications: [
        'TORR RF는 "범용전기수술기"로, 고주파 전류를 사용하여 조직의 응고에 사용하는 기구입니다. (국내 허가 사용목적)',
      ],
      specLabels: {
        'Frequency': '주파수',
        'Max Output Power': '최대 출력',
        'Operation Modes': '동작 모드',
        'Treatment Depth': '열전달 깊이(설계 사양)',
        'Temperature Control': '온도 제어',
        'User Interface': '사용자 인터페이스',
        'Dimensions': '외형 치수',
        'Weight': '중량',
        'Power': '전원',
        'Safety Class': '안전 등급',
      },
      specNotes: {
        'Stable deep heating frequency': '안정적인 가열 주파수',
        'Low power, high efficiency': '저출력 설계',
        'Selectable via GUI': 'GUI에서 선택 가능',
        'Adjustable Low/Deep Mode': 'Low/Deep 모드 조절 가능',
        'Real-time monitoring & Auto-cut off': '실시간 모니터링 & 자동 차단',
        'Intuitive GUI with Preset Memory': '프리셋 메모리를 갖춘 직관적인 GUI',
      },
      handpieces: [
        { name: '대형 핸드피스(바디)', feature: '피부와 지방층이 두터운 부위를 위한 핸드피스로, 진동(Vibro)과 모션헤드 기능으로 시술 시 편의를 제공합니다.' },
        { name: '소형 핸드피스(페이스)', feature: '멀티펄스 모드로 넓은 부위에 고르고 안정적으로 고주파 에너지를 전달합니다.' },
        { name: '미세형 핸드피스(아이/섬세 부위)', feature: '피부층이 얇고 굴곡이 있는 부위에 정교한 시술이 가능하도록 설계되었습니다.' },
      ],
      clinicalBenefits: [
        '별도의 마취 과정 없이 바로 시술이 가능합니다',
        '소요 시간은 부위·시술 조건에 따라 의료진 판단으로 달라질 수 있으나 대체로 10~15분 이내에 진행됩니다',
        '체표면을 가열하는 방식으로, 시술 후 일상생활 복귀는 의료진이 개인별 피부 상태에 맞춰 안내합니다',
        '소모품 카트리지 없이 운용하는 핸드피스 구성입니다',
      ],
      differentiators: [
        {
          feature: 'FIT THE MOMENT — 상황에 맞춘 섬세한 설정',
          description: '출력 강도(Level)와 시술 시간을 세밀하게 조절할 수 있도록 설계되어, 다양한 시술 환경에서 안정적인 조건을 유지하는 데 도움이 됩니다.',
        },
        {
          feature: 'FIT WITH TRUST — 기술이 만든 안정적인 설계',
          description: '표면 온도 모니터링, 출력 차단 알고리즘, 핸드피스 구조 설계를 기반으로 일정한 시술 조건을 유지하도록 제작되었습니다.',
        },
        {
          feature: 'FIT TO SHAPE — 구조의 정교함',
          description: '전극 배치와 크기 차이에 기반한 핸드피스 구조로, 전극 크기와 적용 면적이 달라 의료진이 시술 목적에 맞게 선택할 수 있습니다.',
        },
      ],
      regulatoryNotice: [
        'TORR RF는 "범용전기수술기"로, 고주파 전류를 사용하여 조직의 응고에 사용하는 기구입니다.',
        '이 제품은 "의료기기"이며, "사용상의 주의사항"과 "사용방법"을 잘 읽고 사용하십시오.',
      ],
    },
    'ulblanc': {
      tagline: '멀티 주파수 초음파 워크스테이션',
      overview: 'ULBLANC은 듀얼 주파수 초음파 타이트닝과 음향 캐비테이션 기반 경피 약물 전달을 결합한 토탈 스킨케어 워크스테이션입니다.',
      description: '피부 표면 손상 없이 효과적인 시술이 가능하며, 표피와 심부 조직을 모두 케어하는 다이내믹 듀얼 웨이브 기술을 탑재했습니다.',
      keyTechnologies: [
        {
          name: 'Sono-I(다이내믹 듀얼 웨이브™)',
          description: '서로 다른 초음파 주파수를 교차 적용하여 표피와 진피를 동시에 타깃합니다. 1/3 MHz로 진피 깊은 층을 타이트닝하고, 3/10 MHz로 표피를 진정시킵니다.',
        },
        {
          name: 'i-Booster(소노포레시스)',
          description: '28kHz 초음파로 음향 캐비테이션(마이크로젯 효과)을 발생시켜, 유효 성분의 심부 경피 전달을 위한 미세 통로를 열어줍니다.',
        },
      ],
      indications: [
        '피부 탄력 강화 및 타이트닝',
        '주름 개선',
        '유효 성분 흡수 촉진',
        '피부 진정(여드름/홍조 피부에 적합)',
      ],
      specLabels: {
        'Sono-I Frequency': 'Sono-I 주파수',
        'i-Booster Frequency': 'i-Booster 주파수',
        'Output Power': '출력',
        'Treatment Modes': '시술 모드',
        'Display': '디스플레이',
        'Dimensions': '외형 치수',
        'Weight': '중량',
      },
      specNotes: {
        'Dual frequency modes': '듀얼 주파수 모드',
        'For sonophoresis': '소노포레시스용',
        'Adjustable intensity': '강도 조절 가능',
      },
      clinicalBenefits: [
        '피부 표면 손상 없이 진행되는 시술',
        '시술 주기와 횟수는 의료진 판단에 따라 안내됩니다',
        '시술 목적에 따라 의료진이 모드를 선택할 수 있습니다',
        'i-Booster 초음파 모드 기반의 시술 설계',
      ],
    },
    'newchae-shot': {
      tagline: '3-in-1 퍼스널 뷰티 디바이스',
      overview: 'NEWCHAE SHOT은 전문가급 의료 기술을 컴팩트한 디자인에 통합한 홈케어 뷰티 디바이스입니다.',
      description: 'RF 타이트닝, EMS 컨투어링, ELP 스킨 부스트 기술을 하나로 결합하여 집에서도 클리닉 수준의 결과를 제공합니다.',
      keyTechnologies: [
        {
          name: 'RF 모드(타이트닝)',
          description: '멀티채널 RF 스택 기술이 진피 깊은 층까지 열을 전달하여 콜라겐 재생을 촉진합니다.',
        },
        {
          name: 'EMS 모드(V라인)',
          description: '전기 근육 자극으로 얼굴 윤곽을 정돈하고 탄력을 끌어올립니다.',
        },
        {
          name: 'ELP 모드(스킨 부스트)',
          description: '일렉트로포레이션 기술로 스킨케어 제품의 흡수를 높여줍니다.',
        },
      ],
      specLabels: {
        'Product Name': '제품명',
        'Model': '모델',
        'Rating': '정격',
        'RF Frequency / Power': 'RF 주파수 / 출력',
        'EMS Frequency': 'EMS 주파수',
        'ELP Frequency': 'ELP 주파수',
        'Modes / Levels': '모드 / 단계',
        'Vibration': '진동',
        'Usage Time': '사용 시간',
        'Battery': '배터리',
        'Dimensions': '외형 치수',
        'Weight': '중량',
        'Certifications': '인증',
      },
      specNotes: {
        'Multi-channel concentrated energy shot': '멀티채널 집중 에너지 샷',
        'Electroporation multi-frequency': '일렉트로포레이션 멀티 주파수',
        'Mode-specific patterns': '모드별 진동 패턴',
        'Alert every 2 min 30 sec': '2분 30초마다 알림',
        'Samsung SDI cell / USB-C charging / 5-6 uses per charge': '삼성SDI 셀 / USB-C 충전 / 1회 충전 시 5~6회 사용',
      },
      clinicalBenefits: [
        '피부 밀도 128.48% 개선',
        '모공 크기 26.74% 감소',
        '표면 및 심부 탄력 개선',
        '피부 광채 향상',
      ],
      differentiators: [
        {
          feature: '오토샷 시스템',
          description: '에너지 출력을 집중시켜 정밀하게 전달',
        },
        {
          feature: '3D 바이브레이션',
          description: '분당 10,000회 진동으로 에너지 침투를 보조',
        },
      ],
    },
    'lumino-wave': {
      tagline: '차세대 융복합(Convergence) 디바이스',
      overview: 'LUMINO WAVE는 초음파와 레이저 에너지를 결합하여 시술 효과를 극대화하도록 설계된 차세대 에스테틱 디바이스입니다.',
      description: '초음파로 유도한 마이크로버블이 레이저의 피부 침투 깊이를 높이는 원리를 활용한 LUMINO WAVE는 융복합 테라피(Convergence Therapy)의 차세대 진화를 보여줍니다. 현재 MFDS(식약처) 인증 절차를 진행 중이며, 2026년 하반기 출시 예정입니다.',
      keyTechnologies: [
        {
          name: '초음파 + 레이저 융복합',
          description: '초음파 진동과 레이저 조사가 동시에 이루어지는 융복합 테라피입니다. 초음파 효과로 빛의 산란이 최소화되어 레이저가 더 깊은 층까지 효율적으로 도달합니다.',
        },
      ],
      clinicalBenefits: [
        '더 낮은 출력/에너지로 치료 효과 구현',
        '피부 자극과 부작용 최소화',
        '리프팅 및 재생 효과 극대화',
        '진피층까지 레이저 침투력 향상',
      ],
    },
  },

  // ═══════════════════════════════════════
  // JAPANESE (ja)
  // ═══════════════════════════════════════
  ja: {
    'torr-rf': {
      tagline: '革新的マルチウェーブRFワークステーション',
      overview: 'TORR RFは、特殊なマルチウェーブ高周波(RF)技術を活用して、真皮および皮下組織層に熱エネルギーを伝達する非侵襲的医療機器です。',
      description: 'TORR RFの核心的な臨床的意義は、低出力で目的の深さまで強力かつ安全なエネルギーを均一に伝達し、表面火傷を防止しながら深部組織の加熱を最大化する能力にあります。FDA 510(k)承認済み（K212561）。皮膚のタイトニング、ボディコントアリング、疼痛緩和向けに設計されています。',
      keyTechnologies: [
        {
          name: '自動円形モーションヘッド（特許取得）',
          description: 'ハンドピースのヘッドが自動回転（68rpm）し、「トロイダル」熱場を形成。RFエネルギーをホットスポットなく均一に分配し、施術者の疲労を軽減します。',
        },
        {
          name: 'リアルタイム温度制御',
          description: '内蔵センサーが皮膚温度を継続的にモニタリング。設定された安全限界値（30°C〜50°C調整可能）を超えるとRF出力を自動遮断し、火傷を防止します。',
        },
        {
          name: 'バイブロコンフォートモード',
          description: '3D振動技術（毎分10,000回）が神経学的分散効果（ゲートコントロール理論）により熱感を緩和。熱に敏感な患者様も快適に施術を受けられます。',
        },
      ],
      indications: [
        'リフティング＆スキンタイトニング - 真皮深層に熱エネルギーを伝達しコラーゲンリモデリングを促進',
        'ボディコントアリング＆セルライト - セルライトの外観の一時的な軽減についてFDA承認済み',
        '血管（循環） - 局所血液循環の一時的な改善について承認済み',
        '疼痛管理 - 軽度の筋肉痛、痛み、筋痙攣の緩和',
      ],
      specLabels: {
        'Frequency': '周波数',
        'Max Output Power': '最大出力',
        'Operation Modes': '動作モード',
        'Treatment Depth': '施術深度',
        'Temperature Control': '温度制御',
        'User Interface': 'ユーザーインターフェース',
        'Dimensions': '外形寸法',
        'Weight': '重量',
        'Power': '電源',
        'Safety Class': '安全分類',
      },
      specNotes: {
        'Stable deep heating frequency': '安定した深部加熱周波数',
        'Low power, high efficiency': '低出力・高効率',
        'Selectable via GUI': 'GUIで選択可能',
        'Adjustable Low/Deep Mode': 'Low/Deepモード調整可能',
        'Real-time monitoring & Auto-cut off': 'リアルタイムモニタリング＆自動遮断',
        'Intuitive GUI with Preset Memory': 'プリセットメモリ機能付き直感的GUI',
      },
      handpieces: [
        { name: 'ラージハンドピース（ボディ）', feature: '広範囲コントアリング用自動円形モーション（68rpm）' },
        { name: 'スモールハンドピース（フェイス）', feature: 'フェイシャルタイトニングと頬のコントアリングに最適化' },
        { name: 'マイクロハンドピース（アイ/デリケート）', feature: '眼周囲やシワ部位の精密ケア' },
      ],
      clinicalBenefits: [
        'バイブロコンフォートモードによる無痛施術',
        '均一なエネルギー伝達で施術者の疲労を防止',
        'リアルタイム安全モニタリングで火傷を防止',
        '消耗カートリッジ不要 - 低ランニングコスト',
      ],
      differentiators: [
        {
          feature: 'オートモーション技術',
          description: '従来の固定式アプリケーターと異なり、回転ヘッド（68rpm）が広い施術範囲に均一なエネルギー分配を実現',
        },
        {
          feature: '低出力・高効率',
          description: '競合製品が最大150Wを必要とする中、55Wで効果的な加熱を実現し安全性を向上',
        },
        {
          feature: '非消耗ハンドピース',
          description: '高額なカートリッジ交換不要の長期使用設計',
        },
      ],
    },
    'ulblanc': {
      tagline: 'マルチ周波数超音波ワークステーション',
      overview: 'ULBLANCは、デュアル周波数超音波によるタイトニングと音響キャビテーションによる経皮ドラッグデリバリーを統合した総合スキンケアワークステーションです。',
      description: '皮膚表面を損傷することなく効果的な施術が可能で、表皮と深部組織の両方に対応するダイナミックデュアルウェーブ技術を搭載しています。',
      keyTechnologies: [
        {
          name: 'Sono-I（ダイナミックデュアルウェーブ™）',
          description: '異なる超音波周波数を交互に使用して表皮と真皮を同時にターゲット。1/3 MHzで真皮深部タイトニング、3/10 MHzで表皮鎮静。',
        },
        {
          name: 'i-Booster（ソノフォレシス）',
          description: '28kHz超音波を活用して音響キャビテーション（マイクロジェット効果）を生成し、活性成分の深部経皮伝達のためのマイクロ経路を開通。',
        },
      ],
      indications: [
        '肌の引き締め・タイトニング',
        'シワ軽減',
        '有効成分の吸収促進',
        '肌の鎮静（アクネ/紅潮に適合）',
      ],
      specLabels: {
        'Sono-I Frequency': 'Sono-I 周波数',
        'i-Booster Frequency': 'i-Booster 周波数',
      },
      specNotes: {
        'Dual frequency modes': 'デュアル周波数モード',
        'For sonophoresis': 'ソノフォレシス用',
      },
      clinicalBenefits: [
        'ダウンタイムなし - 無痛・無感染',
        '毎日の使用が可能',
        '鎮静からリフティングまで多彩な施術範囲',
        '製品吸収効率の向上',
      ],
    },
    'newchae-shot': {
      tagline: '3-in-1パーソナルビューティーデバイス',
      overview: 'NEWCHAE SHOTは、プロフェッショナルグレードの医療技術をコンパクトなフォームファクターに統合したホームケアビューティーデバイスです。',
      description: 'RFタイトニング、EMSコントアリング、ELPスキンブースト技術を統合し、自宅でクリニックレベルの結果を提供します。',
      keyTechnologies: [
        {
          name: 'RFモード（タイトニング）',
          description: 'マルチチャネルRFスタック技術が真皮深部に熱を伝達し、コラーゲン再生を促進。',
        },
        {
          name: 'EMSモード（Vライン）',
          description: '電気筋肉刺激によるフェイシャルコントアリングとトーニング。',
        },
        {
          name: 'ELPモード（スキンブースト）',
          description: 'エレクトロポレーション技術でスキンケア製品の吸収を促進。',
        },
      ],
      clinicalBenefits: [
        '肌密度128.48%改善',
        '毛穴サイズ26.74%縮小',
        '表面および深部の弾力性向上',
        '肌の輝き向上',
      ],
      differentiators: [
        {
          feature: 'オートショットシステム',
          description: '精密な伝達のためにエネルギー出力を集中',
        },
        {
          feature: '3Dバイブレーション',
          description: '毎分10,000回の振動でエネルギー浸透を補助',
        },
      ],
    },
    'lumino-wave': {
      tagline: '次世代コンバージェンスデバイス',
      overview: 'LUMINO WAVEは、超音波とレーザーエネルギーを組み合わせて施術効果を最大化するよう設計された先進美容機器です。',
      description: '超音波によるマイクロバブルがレーザーの皮膚浸透深度を向上させる原理を活用。LUMINO WAVEはコンバージェンス療法の次世代進化を代表します。現在MFDS承認審査中、2026年下半期発売予定。',
      keyTechnologies: [
        {
          name: '超音波＋レーザーコンバージェンス',
          description: '超音波振動とレーザー照射が同時に行われるコンバージェンス療法。超音波効果により光散乱が最小化され、レーザーがより深い層まで効率的に到達します。',
        },
      ],
      clinicalBenefits: [
        'より低い出力/エネルギーで治療効果を実現',
        '皮膚刺激と副作用の最小化',
        'リフティングと再生効果の最大化',
        '真皮層までのレーザー浸透の向上',
      ],
    },
  },

  // ═══════════════════════════════════════
  // CHINESE SIMPLIFIED (zh)
  // ═══════════════════════════════════════
  zh: {
    'torr-rf': {
      tagline: '创新多波段RF工作站',
      overview: 'TORR RF是一款利用专利多波段射频(RF)技术将热能传递到真皮和皮下组织层的非侵入性医疗设备。',
      description: 'TORR RF的核心临床意义在于能够以低功率将强大而安全的能量均匀传递到所需深度，在防止表面灼伤的同时最大化深层组织加热。已获FDA 510(k)批准（K212561），专为皮肤紧致、身体塑形和疼痛缓解而设计。',
      keyTechnologies: [
        {
          name: '自动圆周运动头（专利）',
          description: '手柄头部自动旋转（68rpm），形成"环形"热场，确保RF能量无热点均匀分布，减少操作者疲劳。',
        },
        {
          name: '实时温度控制',
          description: '集成传感器持续监测皮肤温度。当温度超过设定的安全限值（可调30°C-50°C）时，系统自动切断RF输出，防止灼伤。',
        },
        {
          name: '振动舒适模式',
          description: '3D振动技术（每分钟10,000次）通过神经学分散效应（闸门控制理论）减轻热感，让对热敏感的患者也能舒适接受治疗。',
        },
      ],
      indications: [
        '提升和皮肤紧致 - 向深层真皮传递热能以刺激胶原蛋白重塑',
        '身体塑形和橘皮组织 - FDA批准用于暂时减少橘皮组织外观',
        '血管（循环） - 批准用于暂时改善局部血液循环',
        '疼痛管理 - 缓解轻微肌肉酸痛、疼痛和肌肉痉挛',
      ],
      specLabels: {
        'Frequency': '频率',
        'Max Output Power': '最大输出功率',
        'Operation Modes': '工作模式',
        'Treatment Depth': '治疗深度',
        'Temperature Control': '温度控制',
        'User Interface': '用户界面',
        'Dimensions': '尺寸',
        'Weight': '重量',
        'Power': '电源',
        'Safety Class': '安全等级',
      },
      specNotes: {
        'Stable deep heating frequency': '稳定的深部加热频率',
        'Low power, high efficiency': '低功率，高效率',
        'Selectable via GUI': '通过GUI选择',
        'Adjustable Low/Deep Mode': '可调Low/Deep模式',
        'Real-time monitoring & Auto-cut off': '实时监测和自动切断',
        'Intuitive GUI with Preset Memory': '带预设记忆的直观GUI',
      },
      handpieces: [
        { name: '大型手柄（身体）', feature: '用于大面积塑形的自动圆周运动（68rpm）' },
        { name: '小型手柄（面部）', feature: '专为面部紧致和面颊塑形设计' },
        { name: '微型手柄（眼部/精细）', feature: '眼周区域和皱纹的精准护理' },
      ],
      clinicalBenefits: [
        '振动舒适模式实现无痛治疗',
        '均匀能量传递防止操作者疲劳',
        '实时安全监测防止灼伤',
        '无消耗品卡匣 - 低运行成本',
      ],
      differentiators: [
        {
          feature: '自动运动技术',
          description: '与传统固定式探头不同，旋转头（68rpm）确保在大面积治疗区域均匀分配能量',
        },
        {
          feature: '更低功率，更高效能',
          description: '以55W实现有效加热，而竞品需要高达150W，安全性更高',
        },
        {
          feature: '非消耗性手柄',
          description: '耐用手柄设计用于长期使用，无需昂贵的卡匣更换',
        },
      ],
    },
    'ulblanc': {
      tagline: '多频超声工作站',
      overview: 'ULBLANC是一款综合皮肤护理工作站，结合双频超声紧致和声学空化经皮药物递送技术。',
      description: '该系统可在不损伤皮肤表面的情况下进行有效治疗，搭载动态双波技术用于表皮和深层组织治疗。',
      keyTechnologies: [
        {
          name: 'Sono-I（动态双波™）',
          description: '交替使用不同超声频率同时针对表皮和真皮。1/3 MHz用于深层真皮紧致，3/10 MHz用于表皮舒缓。',
        },
        {
          name: 'i-Booster（超声导入）',
          description: '利用28kHz超声产生声学空化（微射流效应），开辟微通道实现活性成分的深层经皮递送。',
        },
      ],
      indications: [
        '皮肤紧致和收紧',
        '减少皱纹',
        '促进活性成分吸收',
        '皮肤舒缓（适用于痤疮/潮红）',
      ],
      specLabels: {
        'Sono-I Frequency': 'Sono-I 频率',
        'i-Booster Frequency': 'i-Booster 频率',
      },
      specNotes: {
        'Dual frequency modes': '双频模式',
        'For sonophoresis': '用于超声导入',
      },
      clinicalBenefits: [
        '无恢复期 - 无痛、无感染',
        '适合日常使用',
        '从舒缓到提升的多功能治疗范围',
        '提高产品吸收效率',
      ],
    },
    'newchae-shot': {
      tagline: '三合一个人美容仪',
      overview: 'NEWCHAE SHOT是一款将专业级医疗技术整合到紧凑外形中的家用美容设备，具有多通道能量传递功能。',
      description: '结合RF紧致、EMS塑形和ELP皮肤促进技术，NEWCHAE SHOT在家中即可实现专业级效果。',
      keyTechnologies: [
        {
          name: 'RF模式（紧致）',
          description: '多通道RF堆叠技术将热量传递到真皮深处，促进胶原蛋白再生。',
        },
        {
          name: 'EMS模式（V-Line）',
          description: '电肌肉刺激用于面部轮廓塑形和紧致。',
        },
        {
          name: 'ELP模式（皮肤促进）',
          description: '电穿孔技术增强护肤品吸收。',
        },
      ],
      clinicalBenefits: [
        '皮肤密度提升128.48%',
        '毛孔大小减少26.74%',
        '表面和深层弹性改善',
        '皮肤光泽度提升',
      ],
      differentiators: [
        {
          feature: '自动射频系统',
          description: '集中能量输出实现精准递送',
        },
        {
          feature: '3D振动',
          description: '每分钟10,000次振动辅助能量渗透',
        },
      ],
    },
    'lumino-wave': {
      tagline: '下一代融合设备',
      overview: 'LUMINO WAVE是一款先进美容设备，旨在通过结合超声波和激光能量来最大化治疗效果。',
      description: '利用超声波产生的微气泡增强激光对皮肤的穿透深度，LUMINO WAVE代表了融合治疗的下一代进化。目前正在进行MFDS审批，计划于2026年下半年上市。',
      keyTechnologies: [
        {
          name: '超声波+激光融合',
          description: '超声振动和激光照射同时进行的融合疗法。超声效应使光散射最小化，激光能更有效地到达更深层。',
        },
      ],
      clinicalBenefits: [
        '以更低的功率/能量实现治疗效果',
        '最大限度减少皮肤刺激和副作用',
        '最大化提升和再生效果',
        '增强激光对真皮层的穿透',
      ],
    },
  },

  // ═══════════════════════════════════════
  // SPANISH (es)
  // ═══════════════════════════════════════
  es: {
    'torr-rf': {
      tagline: 'Estación de Trabajo RF Multi-Onda Innovadora',
      overview: 'TORR RF es un dispositivo médico no invasivo que utiliza tecnología de radiofrecuencia (RF) multi-onda especializada para entregar energía térmica en las capas dérmicas y subcutáneas.',
      description: 'La importancia clínica central de TORR RF radica en su capacidad para entregar energía potente pero segura de manera uniforme a la profundidad deseada usando baja potencia, previniendo quemaduras superficiales mientras maximiza el calentamiento profundo. Con aprobación FDA 510(k) (K212561), diseñado para tensado cutáneo, contorno corporal y alivio del dolor.',
      keyTechnologies: [
        {
          name: 'Cabezal de Movimiento Circular Automático (Patentado)',
          description: 'El cabezal del aplicador rota automáticamente (68 rpm), creando un campo térmico "toroidal" que asegura una distribución uniforme de la energía RF sin puntos calientes y reduce la fatiga del operador.',
        },
        {
          name: 'Control de Temperatura en Tiempo Real',
          description: 'Sensores integrados monitorizan la temperatura de la piel continuamente. El sistema corta automáticamente la salida RF si la temperatura supera el límite de seguridad (ajustable 30°C–50°C).',
        },
        {
          name: 'Modo Vibro-Comfort',
          description: 'La tecnología de vibración 3D (10.000 veces/min) mitiga la sensación de calor mediante distracción neurológica (Teoría del Control de Puerta), permitiendo tratamientos cómodos.',
        },
      ],
      indications: [
        'Lifting y Tensado Cutáneo - Entrega energía térmica a la dermis profunda para estimular la remodelación del colágeno',
        'Contorno Corporal y Celulitis - Aprobado por FDA para reducción temporal de la apariencia de celulitis',
        'Vascular (Circulación) - Aprobado para mejora temporal de la circulación sanguínea local',
        'Manejo del Dolor - Alivio de dolores musculares menores y espasmos',
      ],
      specLabels: {
        'Frequency': 'Frecuencia',
        'Max Output Power': 'Potencia Máxima de Salida',
        'Operation Modes': 'Modos de Operación',
        'Treatment Depth': 'Profundidad de Tratamiento',
        'Temperature Control': 'Control de Temperatura',
        'User Interface': 'Interfaz de Usuario',
        'Dimensions': 'Dimensiones',
        'Weight': 'Peso',
        'Power': 'Alimentación',
        'Safety Class': 'Clase de Seguridad',
      },
      specNotes: {
        'Stable deep heating frequency': 'Frecuencia estable de calentamiento profundo',
        'Low power, high efficiency': 'Baja potencia, alta eficiencia',
        'Selectable via GUI': 'Seleccionable vía GUI',
        'Adjustable Low/Deep Mode': 'Modo Low/Deep ajustable',
        'Real-time monitoring & Auto-cut off': 'Monitorización en tiempo real y corte automático',
        'Intuitive GUI with Preset Memory': 'GUI intuitiva con memoria de preajustes',
      },
      handpieces: [
        { name: 'Aplicador Grande (Cuerpo)', feature: 'Movimiento circular automático (68 rpm) para contorno de áreas grandes' },
        { name: 'Aplicador Pequeño (Cara)', feature: 'Diseñado para tensado facial y contorno de mejillas' },
        { name: 'Micro Aplicador (Ojos/Delicado)', feature: 'Cuidado de precisión para zonas perioculares y arrugas' },
      ],
      clinicalBenefits: [
        'Tratamientos sin dolor con Modo Vibro-Comfort',
        'Entrega uniforme de energía sin fatiga del operador',
        'Monitorización de seguridad en tiempo real previniendo quemaduras',
        'Sin cartuchos consumibles - bajos costos operativos',
      ],
      differentiators: [
        {
          feature: 'Tecnología Auto-Motion',
          description: 'A diferencia de los aplicadores estacionarios tradicionales, el cabezal rotatorio (68 rpm) asegura distribución uniforme de energía en áreas amplias',
        },
        {
          feature: 'Menor Potencia, Mayor Eficacia',
          description: 'Logra calentamiento efectivo con 55W en comparación con competidores que requieren hasta 150W',
        },
        {
          feature: 'Aplicadores No Consumibles',
          description: 'Aplicadores duraderos diseñados para uso prolongado sin costosos reemplazos de cartuchos',
        },
      ],
    },
    'ulblanc': {
      tagline: 'Estación de Trabajo de Ultrasonido Multi-Frecuencia',
      overview: 'ULBLANC es una estación integral de cuidado de la piel que combina ultrasonido de doble frecuencia para tensado con cavitación acústica para administración transdérmica.',
      description: 'El sistema permite un tratamiento efectivo sin dañar la superficie cutánea, con tecnología Dynamic Dual Wave para tratamiento superficial y profundo.',
      keyTechnologies: [
        {
          name: 'Sono-I (Dynamic Dual Wave™)',
          description: 'Alterna entre diferentes frecuencias de ultrasonido para tratar tanto epidermis como dermis. 1/3 MHz para tensado dérmico profundo, 3/10 MHz para calmado epidérmico.',
        },
        {
          name: 'i-Booster (Sonoforesis)',
          description: 'Utiliza ultrasonido de 28kHz para generar cavitación acústica, abriendo micro-vías para la administración transdérmica profunda de ingredientes activos.',
        },
      ],
      indications: [
        'Firmeza y tensado de la piel',
        'Reducción de arrugas',
        'Mayor absorción de ingredientes activos',
        'Calmado de la piel (apto para acné/enrojecimiento)',
      ],
      specLabels: {
        'Sono-I Frequency': 'Frecuencia Sono-I',
        'i-Booster Frequency': 'Frecuencia i-Booster',
      },
      specNotes: {
        'Dual frequency modes': 'Modos de doble frecuencia',
        'For sonophoresis': 'Para sonoforesis',
      },
      clinicalBenefits: [
        'Sin tiempo de inactividad - Sin dolor, sin infección',
        'Apto para uso diario',
        'Rango versátil de tratamiento desde calmado hasta lifting',
        'Mayor eficiencia en la absorción de productos',
      ],
    },
    'newchae-shot': {
      tagline: 'Dispositivo de Belleza Personal 3-en-1',
      overview: 'NEWCHAE SHOT es un dispositivo de belleza para el hogar que integra tecnologías médicas de grado profesional en un formato compacto con entrega de energía multicanal.',
      description: 'Combinando RF para tensado, EMS para contorno y tecnología ELP para potenciación cutánea, NEWCHAE SHOT ofrece resultados de nivel clínico para uso doméstico.',
      keyTechnologies: [
        {
          name: 'Modo RF (Tensado)',
          description: 'La tecnología Multi-Channel RF Stack entrega calor profundamente en la dermis, promoviendo la regeneración del colágeno.',
        },
        {
          name: 'Modo EMS (V-Line)',
          description: 'Estimulación eléctrica muscular para contorno y tonificación facial.',
        },
        {
          name: 'Modo ELP (Skin Boost)',
          description: 'Tecnología de electroporación que mejora la absorción de productos de cuidado de la piel.',
        },
      ],
      clinicalBenefits: [
        'Densidad de la piel mejorada en 128,48%',
        'Tamaño de poros reducido en 26,74%',
        'Mejora de la elasticidad superficial y profunda',
        'Mayor luminosidad de la piel',
      ],
      differentiators: [
        {
          feature: 'Sistema de Disparo Automatizado',
          description: 'Concentra la salida de energía para una entrega precisa',
        },
        {
          feature: 'Vibración 3D',
          description: 'Vibra 10.000 veces/min para asistir la penetración de energía',
        },
      ],
    },
    'lumino-wave': {
      tagline: 'Dispositivo de Convergencia de Nueva Generación',
      overview: 'LUMINO WAVE es un dispositivo estético avanzado diseñado para maximizar la eficacia del tratamiento combinando energías de ultrasonido y láser.',
      description: 'Utilizando microburbujas inducidas por ultrasonido para mejorar la profundidad de penetración del láser en la piel, LUMINO WAVE representa la próxima evolución en terapia de convergencia. Actualmente en proceso de aprobación MFDS con lanzamiento programado para H2 2026.',
      keyTechnologies: [
        {
          name: 'Convergencia Ultrasonido + Láser',
          description: 'Terapia de convergencia donde la vibración ultrasónica y la irradiación láser ocurren simultáneamente. La dispersión de la luz se minimiza, permitiendo que el láser alcance capas más profundas.',
        },
      ],
      clinicalBenefits: [
        'Logra resultados terapéuticos con menor potencia/energía',
        'Irritación y efectos secundarios minimizados',
        'Efectos de lifting y regeneración maximizados',
        'Mayor penetración del láser a capas dérmicas',
      ],
    },
  },

  // ═══════════════════════════════════════
  // FRENCH (fr)
  // ═══════════════════════════════════════
  fr: {
    'torr-rf': {
      tagline: 'Station de Travail RF Multi-Ondes Innovante',
      overview: 'TORR RF est un dispositif medical non invasif utilisant une technologie de radiofrequence (RF) multi-ondes specialisee pour delivrer de l\'energie thermique dans les couches dermiques et sous-cutanees.',
      description: 'L\'importance clinique fondamentale du TORR RF reside dans sa capacite a delivrer une energie puissante mais securisee de maniere uniforme a la profondeur souhaitee avec une faible puissance, en prevenant les brulures superficielles tout en maximisant le chauffage des tissus profonds. Approuve FDA 510(k) (K212561), concu pour le raffermissement cutane, le remodelage corporel et le soulagement de la douleur.',
      keyTechnologies: [
        {
          name: 'Tete a Mouvement Circulaire Automatique (Brevete)',
          description: 'La tete de la piece a main tourne automatiquement (68 rpm), creant un champ thermique "toroidal" assurant une distribution uniforme de l\'energie RF sans points chauds et reduisant la fatigue de l\'operateur.',
        },
        {
          name: 'Controle de Temperature en Temps Reel',
          description: 'Les capteurs integres surveillent en continu la temperature cutanee. Le systeme coupe automatiquement la sortie RF si la temperature depasse le seuil de securite (reglable 30°C-50°C), prevenant les brulures.',
        },
        {
          name: 'Mode Vibro-Comfort',
          description: 'La technologie de vibration 3D (10 000 fois/min) attenue la sensation de chaleur par distraction neurologique (Theorie du Controle de Porte), permettant des traitements confortables pour les patients sensibles a la chaleur.',
        },
      ],
      indications: [
        'Lifting et Raffermissement Cutane - Delivre de l\'energie thermique dans le derme profond pour stimuler le remodelage du collagene',
        'Remodelage Corporel et Cellulite - Approuve FDA pour la reduction temporaire de l\'apparence de la cellulite',
        'Vasculaire (Circulation) - Approuve pour l\'amelioration temporaire de la circulation sanguine locale',
        'Gestion de la Douleur - Soulagement des douleurs musculaires mineures et des spasmes',
      ],
      specLabels: {
        'Frequency': 'Frequence',
        'Max Output Power': 'Puissance de Sortie Maximale',
        'Operation Modes': 'Modes de Fonctionnement',
        'Treatment Depth': 'Profondeur de Traitement',
        'Temperature Control': 'Controle de Temperature',
        'User Interface': 'Interface Utilisateur',
        'Dimensions': 'Dimensions',
        'Weight': 'Poids',
        'Power': 'Alimentation',
        'Safety Class': 'Classe de Securite',
      },
      specNotes: {
        'Stable deep heating frequency': 'Frequence stable de chauffage profond',
        'Low power, high efficiency': 'Faible puissance, haute efficacite',
        'Selectable via GUI': 'Selectionnable via GUI',
        'Adjustable Low/Deep Mode': 'Mode Low/Deep reglable',
        'Real-time monitoring & Auto-cut off': 'Surveillance en temps reel et coupure automatique',
        'Intuitive GUI with Preset Memory': 'GUI intuitive avec memoire de preselections',
      },
      handpieces: [
        { name: 'Grande Piece a Main (Corps)', feature: 'Mouvement circulaire automatique (68 rpm) pour le remodelage de grandes zones' },
        { name: 'Petite Piece a Main (Visage)', feature: 'Concue pour le raffermissement facial et le remodelage des joues' },
        { name: 'Micro Piece a Main (Yeux/Delicat)', feature: 'Soin de precision pour les zones perioculaires et les rides' },
      ],
      clinicalBenefits: [
        'Traitements indolores avec le Mode Vibro-Comfort',
        'Delivrance uniforme d\'energie sans fatigue de l\'operateur',
        'Surveillance de securite en temps reel prevenant les brulures',
        'Pas de cartouches consommables - faibles couts operationnels',
      ],
      differentiators: [
        {
          feature: 'Technologie Auto-Motion',
          description: 'Contrairement aux applicateurs fixes traditionnels, la tete rotative (68 rpm) assure une distribution uniforme de l\'energie sur de larges zones de traitement',
        },
        {
          feature: 'Puissance Inferieure, Efficacite Superieure',
          description: 'Obtient un chauffage efficace a 55W compare aux concurrents qui necessitent jusqu\'a 150W, ameliorant la securite',
        },
        {
          feature: 'Pieces a Main Non Consommables',
          description: 'Pieces a main durables concues pour une utilisation prolongee sans remplacement couteux de cartouches',
        },
      ],
    },
    'ulblanc': {
      tagline: 'Station de Travail Ultrasonore Multi-Frequences',
      overview: 'ULBLANC est une station de soins cutanes complete combinant les ultrasons a double frequence pour le raffermissement avec la cavitation acoustique pour l\'administration transdermique.',
      description: 'Le systeme permet un traitement efficace sans endommager la surface cutanee, avec la technologie Dynamic Dual Wave pour le traitement superficiel et profond.',
      keyTechnologies: [
        {
          name: 'Sono-I (Dynamic Dual Wave™)',
          description: 'Alterne entre differentes frequences ultrasonores pour cibler a la fois l\'epiderme et le derme. 1/3 MHz pour le raffermissement dermique profond, 3/10 MHz pour l\'apaisement epidermique.',
        },
        {
          name: 'i-Booster (Sonophorese)',
          description: 'Utilise des ultrasons a 28kHz pour generer une cavitation acoustique, ouvrant des micro-voies pour l\'administration transdermique profonde des ingredients actifs.',
        },
      ],
      indications: [
        'Fermete et raffermissement de la peau',
        'Reduction des rides',
        'Absorption amelioree des ingredients actifs',
        'Apaisement cutane (adapte a l\'acne/rougeurs)',
      ],
      specLabels: {
        'Sono-I Frequency': 'Frequence Sono-I',
        'i-Booster Frequency': 'Frequence i-Booster',
      },
      specNotes: {
        'Dual frequency modes': 'Modes a double frequence',
        'For sonophoresis': 'Pour la sonophorese',
      },
      clinicalBenefits: [
        'Aucun temps d\'arret - Sans douleur, sans infection',
        'Adapte a un usage quotidien',
        'Gamme de traitements polyvalente de l\'apaisement au lifting',
        'Efficacite d\'absorption des produits amelioree',
      ],
    },
    'newchae-shot': {
      tagline: 'Appareil de Beaute Personnel 3-en-1',
      overview: 'NEWCHAE SHOT est un appareil de beaute domestique integrant des technologies medicales de grade professionnel dans un format compact avec une delivrance d\'energie multicanale.',
      description: 'Combinant la RF pour le raffermissement, l\'EMS pour le remodelage et la technologie ELP pour la stimulation cutanee, NEWCHAE SHOT offre des resultats de niveau clinique a domicile.',
      keyTechnologies: [
        {
          name: 'Mode RF (Raffermissement)',
          description: 'La technologie Multi-Channel RF Stack delivre la chaleur profondement dans le derme, favorisant la regeneration du collagene.',
        },
        {
          name: 'Mode EMS (V-Line)',
          description: 'Stimulation musculaire electrique pour le remodelage et la tonification du visage.',
        },
        {
          name: 'Mode ELP (Skin Boost)',
          description: 'La technologie d\'electroporation ameliore l\'absorption des produits de soins cutanes.',
        },
      ],
      clinicalBenefits: [
        'Densite cutanee amelioree de 128,48%',
        'Taille des pores reduite de 26,74%',
        'Amelioration de l\'elasticite superficielle et profonde',
        'Eclat de la peau ameliore',
      ],
      differentiators: [
        {
          feature: 'Systeme de Tir Automatise',
          description: 'Concentre la sortie d\'energie pour une delivrance precise',
        },
        {
          feature: 'Vibration 3D',
          description: 'Vibre 10 000 fois/min pour faciliter la penetration de l\'energie',
        },
      ],
    },
    'lumino-wave': {
      tagline: 'Dispositif de Convergence de Nouvelle Generation',
      overview: 'LUMINO WAVE est un dispositif esthetique avance concu pour maximiser l\'efficacite des traitements en combinant les energies ultrasonores et laser.',
      description: 'Utilisant des microbulles induites par ultrasons pour ameliorer la profondeur de penetration du laser dans la peau, LUMINO WAVE represente la prochaine evolution de la therapie par convergence. Actuellement en cours d\'approbation MFDS avec un lancement prevu au second semestre 2026.',
      keyTechnologies: [
        {
          name: 'Convergence Ultrasons + Laser',
          description: 'Therapie par convergence ou la vibration ultrasonore et l\'irradiation laser se produisent simultanement. La diffusion de la lumiere est minimisee par l\'effet ultrasonore, permettant au laser d\'atteindre les couches profondes plus efficacement.',
        },
      ],
      clinicalBenefits: [
        'Obtient des resultats therapeutiques avec une puissance/energie inferieure',
        'Irritation cutanee et effets secondaires minimises',
        'Effets de lifting et de regeneration maximises',
        'Penetration laser amelioree dans les couches dermiques',
      ],
    },
  },

  // ═══════════════════════════════════════
  // RUSSIAN (ru)
  // ═══════════════════════════════════════
  ru: {
    'torr-rf': {
      tagline: 'Инновационная мультиволновая RF рабочая станция',
      overview: 'TORR RF — это неинвазивное медицинское устройство, использующее специализированную мультиволновую радиочастотную (RF) технологию для доставки тепловой энергии в дермальные и подкожные слои.',
      description: 'Основное клиническое значение TORR RF заключается в способности равномерно доставлять мощную, но безопасную энергию на требуемую глубину при низкой мощности, предотвращая поверхностные ожоги и максимизируя глубинный нагрев тканей. Одобрен FDA 510(k) (K212561), предназначен для подтяжки кожи, коррекции фигуры и облегчения боли.',
      keyTechnologies: [
        {
          name: 'Автоматическая вращающаяся головка (запатентовано)',
          description: 'Головка манипулы автоматически вращается (68 об/мин), создавая «тороидальное» тепловое поле, обеспечивающее равномерное распределение RF-энергии без горячих точек и снижающее утомляемость оператора.',
        },
        {
          name: 'Контроль температуры в реальном времени',
          description: 'Встроенные датчики непрерывно контролируют температуру кожи. Система автоматически прекращает подачу RF при превышении порога безопасности (регулируемый 30°C–50°C), предотвращая ожоги.',
        },
        {
          name: 'Режим Vibro-Comfort',
          description: 'Технология 3D-вибрации (10 000 раз/мин) снижает ощущение тепла за счёт неврологического отвлечения (теория воротного контроля), обеспечивая комфортные процедуры для чувствительных пациентов.',
        },
      ],
      indications: [
        'Лифтинг и подтяжка кожи — доставка тепловой энергии в глубокие слои дермы для стимуляции ремоделирования коллагена',
        'Коррекция фигуры и целлюлит — одобрено FDA для временного уменьшения проявлений целлюлита',
        'Сосудистая (кровообращение) — одобрено для временного улучшения местного кровообращения',
        'Управление болью — облегчение незначительных мышечных болей и спазмов',
      ],
      specLabels: {
        'Frequency': 'Частота',
        'Max Output Power': 'Максимальная выходная мощность',
        'Operation Modes': 'Режимы работы',
        'Treatment Depth': 'Глубина воздействия',
        'Temperature Control': 'Контроль температуры',
        'User Interface': 'Пользовательский интерфейс',
        'Dimensions': 'Размеры',
        'Weight': 'Вес',
        'Power': 'Питание',
        'Safety Class': 'Класс безопасности',
      },
      specNotes: {
        'Stable deep heating frequency': 'Стабильная частота глубинного нагрева',
        'Low power, high efficiency': 'Низкая мощность, высокая эффективность',
        'Selectable via GUI': 'Выбирается через GUI',
        'Adjustable Low/Deep Mode': 'Регулируемый режим Low/Deep',
        'Real-time monitoring & Auto-cut off': 'Мониторинг в реальном времени и автоматическое отключение',
        'Intuitive GUI with Preset Memory': 'Интуитивный GUI с памятью предустановок',
      },
      handpieces: [
        { name: 'Большая манипула (тело)', feature: 'Автоматическое круговое движение (68 об/мин) для коррекции больших зон' },
        { name: 'Малая манипула (лицо)', feature: 'Предназначена для подтяжки лица и моделирования скул' },
        { name: 'Микро-манипула (глаза/деликатные зоны)', feature: 'Точный уход за периорбитальной зоной и морщинами' },
      ],
      clinicalBenefits: [
        'Безболезненные процедуры с режимом Vibro-Comfort',
        'Равномерная доставка энергии без утомления оператора',
        'Мониторинг безопасности в реальном времени предотвращает ожоги',
        'Без расходных картриджей — низкие эксплуатационные расходы',
      ],
      differentiators: [
        {
          feature: 'Технология Auto-Motion',
          description: 'В отличие от традиционных стационарных аппликаторов, вращающаяся головка (68 об/мин) обеспечивает равномерное распределение энергии по обширным зонам воздействия',
        },
        {
          feature: 'Меньшая мощность, большая эффективность',
          description: 'Обеспечивает эффективный нагрев при 55 Вт по сравнению с конкурентами, требующими до 150 Вт, повышая безопасность',
        },
        {
          feature: 'Нерасходуемые манипулы',
          description: 'Прочные манипулы, рассчитанные на длительное использование без дорогостоящей замены картриджей',
        },
      ],
    },
    'ulblanc': {
      tagline: 'Мультичастотная ультразвуковая рабочая станция',
      overview: 'ULBLANC — это комплексная станция ухода за кожей, сочетающая двухчастотный ультразвук для подтяжки с акустической кавитацией для трансдермальной доставки.',
      description: 'Система обеспечивает эффективное лечение без повреждения поверхности кожи, с технологией Dynamic Dual Wave для поверхностного и глубокого воздействия.',
      keyTechnologies: [
        {
          name: 'Sono-I (Dynamic Dual Wave™)',
          description: 'Чередование различных ультразвуковых частот для одновременного воздействия на эпидермис и дерму. 1/3 МГц для глубокой дермальной подтяжки, 3/10 МГц для эпидермального успокоения.',
        },
        {
          name: 'i-Booster (сонофорез)',
          description: 'Использует ультразвук 28 кГц для создания акустической кавитации, открывая микроканалы для глубокой трансдермальной доставки активных компонентов.',
        },
      ],
      indications: [
        'Укрепление и подтяжка кожи',
        'Уменьшение морщин',
        'Усиленное впитывание активных ингредиентов',
        'Успокоение кожи (подходит при акне/покраснениях)',
      ],
      specLabels: {
        'Sono-I Frequency': 'Частота Sono-I',
        'i-Booster Frequency': 'Частота i-Booster',
      },
      specNotes: {
        'Dual frequency modes': 'Двухчастотные режимы',
        'For sonophoresis': 'Для сонофореза',
      },
      clinicalBenefits: [
        'Без периода восстановления — безболезненно, без инфекций',
        'Подходит для ежедневного применения',
        'Универсальный спектр процедур от успокоения до лифтинга',
        'Повышенная эффективность впитывания продуктов',
      ],
    },
    'newchae-shot': {
      tagline: 'Персональное устройство красоты 3-в-1',
      overview: 'NEWCHAE SHOT — это домашнее косметологическое устройство, объединяющее профессиональные медицинские технологии в компактном формате с многоканальной доставкой энергии.',
      description: 'Сочетая RF для подтяжки, EMS для моделирования и технологию ELP для стимуляции кожи, NEWCHAE SHOT обеспечивает результаты клинического уровня в домашних условиях.',
      keyTechnologies: [
        {
          name: 'Режим RF (подтяжка)',
          description: 'Технология Multi-Channel RF Stack доставляет тепло глубоко в дерму, стимулируя регенерацию коллагена.',
        },
        {
          name: 'Режим EMS (V-Line)',
          description: 'Электрическая стимуляция мышц для моделирования и тонизации лица.',
        },
        {
          name: 'Режим ELP (Skin Boost)',
          description: 'Технология электропорации усиливает впитывание средств по уходу за кожей.',
        },
      ],
      clinicalBenefits: [
        'Плотность кожи улучшена на 128,48%',
        'Размер пор уменьшен на 26,74%',
        'Улучшение поверхностной и глубинной эластичности',
        'Повышенное сияние кожи',
      ],
      differentiators: [
        {
          feature: 'Система автоматического импульса',
          description: 'Концентрирует выходную энергию для точной доставки',
        },
        {
          feature: '3D-вибрация',
          description: 'Вибрация 10 000 раз/мин для улучшения проникновения энергии',
        },
      ],
    },
    'lumino-wave': {
      tagline: 'Конвергентное устройство нового поколения',
      overview: 'LUMINO WAVE — это передовое эстетическое устройство, предназначенное для максимизации эффективности лечения путём сочетания ультразвуковой и лазерной энергии.',
      description: 'Используя микропузырьки, индуцированные ультразвуком, для увеличения глубины проникновения лазера в кожу, LUMINO WAVE представляет собой следующую эволюцию конвергентной терапии. В настоящее время проходит одобрение MFDS, запуск запланирован на второе полугодие 2026 года.',
      keyTechnologies: [
        {
          name: 'Конвергенция ультразвука + лазера',
          description: 'Конвергентная терапия, при которой ультразвуковая вибрация и лазерное облучение происходят одновременно. Рассеяние света минимизируется за счёт ультразвукового эффекта, позволяя лазеру эффективнее достигать глубоких слоёв.',
        },
      ],
      clinicalBenefits: [
        'Достижение терапевтических результатов при меньшей мощности/энергии',
        'Минимизация раздражения кожи и побочных эффектов',
        'Максимизация эффектов лифтинга и регенерации',
        'Улучшенное проникновение лазера в дермальные слои',
      ],
    },
  },

  // ═══════════════════════════════════════
  // THAI (th)
  // ═══════════════════════════════════════
  th: {
    'torr-rf': {
      tagline: 'สถานีงาน RF แบบมัลติเวฟนวัตกรรม',
      overview: 'TORR RF เป็นอุปกรณ์ทางการแพทย์แบบไม่รุกรานที่ใช้เทคโนโลยีคลื่นวิทยุ (RF) แบบมัลติเวฟเฉพาะทางเพื่อส่งพลังงานความร้อนไปยังชั้นหนังแท้และชั้นใต้ผิวหนัง',
      description: 'ความสำคัญทางคลินิกหลักของ TORR RF คือความสามารถในการส่งพลังงานที่ทรงพลังแต่ปลอดภัยอย่างสม่ำเสมอไปยังความลึกที่ต้องการด้วยกำลังต่ำ ป้องกันการเผาไหม้ที่ผิวหนังขณะเพิ่มการให้ความร้อนเนื้อเยื่อลึกสูงสุด ผ่านการรับรอง FDA 510(k) (K212561)',
      keyTechnologies: [
        {
          name: 'หัวเคลื่อนที่แบบวงกลมอัตโนมัติ (จดสิทธิบัตร)',
          description: 'หัวแฮนด์พีชหมุนอัตโนมัติ (68 rpm) สร้างสนามความร้อนแบบ "Toroidal" ช่วยกระจายพลังงาน RF อย่างสม่ำเสมอโดยไม่มีจุดร้อนและลดความเมื่อยล้าของผู้ปฏิบัติงาน',
        },
        {
          name: 'ควบคุมอุณหภูมิแบบเรียลไทม์',
          description: 'เซนเซอร์ในตัวตรวจวัดอุณหภูมิผิวหนังอย่างต่อเนื่อง ระบบจะตัดเอาต์พุต RF โดยอัตโนมัติหากอุณหภูมิเกินขีดจำกัดความปลอดภัย (ปรับได้ 30°C–50°C)',
        },
        {
          name: 'โหมด Vibro-Comfort',
          description: 'เทคโนโลยีการสั่นสะเทือน 3D (10,000 ครั้ง/นาที) ลดความรู้สึกร้อนผ่านการรบกวนระบบประสาท (Gate Control Theory) ทำให้ผู้ป่วยรู้สึกสบายระหว่างการรักษา',
        },
      ],
      indications: [
        'ยกกระชับและกระชับผิว - ส่งพลังงานความร้อนไปยังชั้นหนังแท้ลึกเพื่อกระตุ้นการรีโมเดลลิ่งคอลลาเจน',
        'ปรับรูปร่างและเซลลูไลท์ - ได้รับอนุมัติจาก FDA สำหรับการลดรอยเซลลูไลท์ชั่วคราว',
        'หลอดเลือด (การไหลเวียน) - ได้รับอนุมัติสำหรับการปรับปรุงการไหลเวียนโลหิตชั่วคราว',
        'การจัดการความเจ็บปวด - บรรเทาอาการปวดกล้ามเนื้อเล็กน้อยและอาการเกร็ง',
      ],
      specLabels: {
        'Frequency': 'ความถี่',
        'Max Output Power': 'กำลังขาออกสูงสุด',
        'Operation Modes': 'โหมดการทำงาน',
        'Treatment Depth': 'ความลึกการรักษา',
        'Temperature Control': 'ควบคุมอุณหภูมิ',
        'User Interface': 'อินเทอร์เฟซผู้ใช้',
        'Dimensions': 'ขนาด',
        'Weight': 'น้ำหนัก',
        'Power': 'กำลังไฟ',
        'Safety Class': 'ระดับความปลอดภัย',
      },
      specNotes: {
        'Stable deep heating frequency': 'ความถี่ให้ความร้อนลึกที่เสถียร',
        'Low power, high efficiency': 'กำลังต่ำ ประสิทธิภาพสูง',
        'Selectable via GUI': 'เลือกได้ผ่าน GUI',
        'Adjustable Low/Deep Mode': 'ปรับโหมด Low/Deep ได้',
        'Real-time monitoring & Auto-cut off': 'ตรวจวัดเรียลไทม์ & ตัดอัตโนมัติ',
        'Intuitive GUI with Preset Memory': 'GUI ที่ใช้งานง่ายพร้อมหน่วยความจำพรีเซ็ต',
      },
      handpieces: [
        { name: 'แฮนด์พีชขนาดใหญ่ (ร่างกาย)', feature: 'เคลื่อนที่แบบวงกลมอัตโนมัติ (68 rpm) สำหรับการปรับรูปร่างพื้นที่กว้าง' },
        { name: 'แฮนด์พีชขนาดเล็ก (ใบหน้า)', feature: 'ออกแบบสำหรับการกระชับใบหน้าและปรับรูปแก้ม' },
        { name: 'ไมโครแฮนด์พีช (ตา/จุดบอบบาง)', feature: 'ดูแลอย่างแม่นยำสำหรับบริเวณรอบดวงตาและริ้วรอย' },
      ],
      clinicalBenefits: [
        'การรักษาไม่เจ็บปวดด้วยโหมด Vibro-Comfort',
        'ส่งพลังงานสม่ำเสมอป้องกันความเมื่อยล้าของผู้ปฏิบัติงาน',
        'ตรวจวัดความปลอดภัยเรียลไทม์ป้องกันการเผาไหม้',
        'ไม่มีตลับสิ้นเปลือง - ต้นทุนการดำเนินงานต่ำ',
      ],
      differentiators: [
        {
          feature: 'เทคโนโลยี Auto-Motion',
          description: 'แตกต่างจากหัวเครื่องแบบคงที่ หัวหมุน (68 rpm) ช่วยกระจายพลังงานอย่างสม่ำเสมอในพื้นที่รักษากว้าง',
        },
        {
          feature: 'กำลังต่ำกว่า ประสิทธิผลสูงกว่า',
          description: 'ให้ความร้อนได้อย่างมีประสิทธิภาพด้วย 55W เมื่อเทียบกับคู่แข่งที่ต้องใช้ถึง 150W',
        },
        {
          feature: 'แฮนด์พีชไม่สิ้นเปลือง',
          description: 'แฮนด์พีชทนทานออกแบบมาเพื่อใช้งานระยะยาวโดยไม่ต้องเปลี่ยนตลับที่มีราคาแพง',
        },
      ],
    },
    'ulblanc': {
      tagline: 'สถานีงานอัลตราซาวด์หลายความถี่',
      overview: 'ULBLANC เป็นสถานีดูแลผิวแบบครบวงจรที่ผสมผสานอัลตราซาวด์ความถี่คู่สำหรับการกระชับผิวกับอะคูสติกแควิเทชันสำหรับการนำส่งยาผ่านผิวหนัง',
      description: 'ระบบช่วยให้การรักษาได้ผลโดยไม่ทำลายผิวหนัง ด้วยเทคโนโลยี Dynamic Dual Wave สำหรับการรักษาทั้งผิวชั้นนอกและเนื้อเยื่อลึก',
      keyTechnologies: [
        {
          name: 'Sono-I (Dynamic Dual Wave™)',
          description: 'สลับระหว่างความถี่อัลตราซาวด์ต่างกันเพื่อเข้าถึงทั้งหนังกำพร้าและหนังแท้ 1/3 MHz สำหรับกระชับหนังแท้ลึก, 3/10 MHz สำหรับผ่อนคลายหนังกำพร้า',
        },
        {
          name: 'i-Booster (โซโนโฟเรซิส)',
          description: 'ใช้อัลตราซาวด์ 28kHz เพื่อสร้างอะคูสติกแควิเทชัน เปิดทางเดินเล็กๆ สำหรับการนำส่งสารออกฤทธิ์ผ่านผิวหนังลึก',
        },
      ],
      indications: [
        'กระชับและเฟิร์มผิว',
        'ลดริ้วรอย',
        'เพิ่มการดูดซึมสารออกฤทธิ์',
        'ผ่อนคลายผิว (เหมาะสำหรับสิว/หน้าแดง)',
      ],
      specLabels: {
        'Sono-I Frequency': 'ความถี่ Sono-I',
        'i-Booster Frequency': 'ความถี่ i-Booster',
      },
      specNotes: {
        'Dual frequency modes': 'โหมดความถี่คู่',
        'For sonophoresis': 'สำหรับโซโนโฟเรซิส',
      },
      clinicalBenefits: [
        'ไม่มีดาวน์ไทม์ - ไม่เจ็บ ไม่ติดเชื้อ',
        'เหมาะสำหรับใช้ทุกวัน',
        'ช่วงการรักษาหลากหลายตั้งแต่ผ่อนคลายถึงยกกระชับ',
        'เพิ่มประสิทธิภาพการดูดซึมผลิตภัณฑ์',
      ],
    },
    'newchae-shot': {
      tagline: 'อุปกรณ์ความงามส่วนบุคคล 3-in-1',
      overview: 'NEWCHAE SHOT เป็นอุปกรณ์ความงามสำหรับใช้ที่บ้านที่รวมเทคโนโลยีทางการแพทย์ระดับมืออาชีพไว้ในรูปแบบกะทัดรัดพร้อมการส่งพลังงานหลายช่องสัญญาณ',
      description: 'ผสมผสาน RF กระชับ, EMS ปรับรูปร่าง และเทคโนโลยี ELP เพิ่มประสิทธิภาพผิว NEWCHAE SHOT มอบผลลัพธ์ระดับคลินิกสำหรับการใช้งานที่บ้าน',
      keyTechnologies: [
        {
          name: 'โหมด RF (กระชับ)',
          description: 'เทคโนโลยี Multi-Channel RF Stack ส่งความร้อนลึกเข้าสู่ชั้นหนังแท้ กระตุ้นการสร้างคอลลาเจนใหม่',
        },
        {
          name: 'โหมด EMS (V-Line)',
          description: 'กระตุ้นกล้ามเนื้อด้วยไฟฟ้าสำหรับปรับรูปหน้าและกระชับ',
        },
        {
          name: 'โหมด ELP (Skin Boost)',
          description: 'เทคโนโลยีอิเล็กโตรโพเรชันเพิ่มการดูดซึมผลิตภัณฑ์ดูแลผิว',
        },
      ],
      clinicalBenefits: [
        'ความหนาแน่นผิวดีขึ้น 128.48%',
        'ขนาดรูขุมขนลดลง 26.74%',
        'ความยืดหยุ่นผิวชั้นนอกและชั้นลึกดีขึ้น',
        'ผิวเปล่งประกายมากขึ้น',
      ],
      differentiators: [
        {
          feature: 'ระบบยิงอัตโนมัติ',
          description: 'เข้มข้นเอาต์พุตพลังงานเพื่อการส่งมอบที่แม่นยำ',
        },
        {
          feature: 'การสั่นสะเทือน 3D',
          description: 'สั่น 10,000 ครั้ง/นาที เพื่อช่วยการซึมผ่านของพลังงาน',
        },
      ],
    },
    'lumino-wave': {
      tagline: 'อุปกรณ์คอนเวอร์เจนซ์รุ่นถัดไป',
      overview: 'LUMINO WAVE เป็นอุปกรณ์เสริมความงามขั้นสูงที่ออกแบบมาเพื่อเพิ่มประสิทธิภาพการรักษาสูงสุดโดยผสมผสานพลังงานอัลตราซาวด์และเลเซอร์',
      description: 'ใช้ไมโครบับเบิ้ลที่เกิดจากอัลตราซาวด์เพื่อเพิ่มความลึกในการทะลุผ่านผิวหนังของเลเซอร์ LUMINO WAVE เป็นตัวแทนของวิวัฒนาการรุ่นถัดไปในการบำบัดแบบคอนเวอร์เจนซ์ กำลังอยู่ระหว่างการอนุมัติ MFDS วางแผนเปิดตัวครึ่งหลังปี 2026',
      keyTechnologies: [
        {
          name: 'คอนเวอร์เจนซ์อัลตราซาวด์ + เลเซอร์',
          description: 'การบำบัดแบบคอนเวอร์เจนซ์ที่การสั่นสะเทือนอัลตราซาวด์และการฉายเลเซอร์เกิดขึ้นพร้อมกัน การกระเจิงของแสงถูกลดให้น้อยที่สุดด้วยเอฟเฟกต์อัลตราซาวด์ ทำให้เลเซอร์เข้าถึงชั้นลึกได้อย่างมีประสิทธิภาพ',
        },
      ],
      clinicalBenefits: [
        'บรรลุผลการรักษาด้วยกำลัง/พลังงานที่ต่ำกว่า',
        'ลดการระคายเคืองผิวหนังและผลข้างเคียง',
        'เพิ่มผลลัพธ์การยกกระชับและการฟื้นฟูสูงสุด',
        'เพิ่มการทะลุผ่านของเลเซอร์ไปยังชั้นหนังแท้',
      ],
    },
  },

  // ═══════════════════════════════════════
  // VIETNAMESE (vi)
  // ═══════════════════════════════════════
  vi: {
    'torr-rf': {
      tagline: 'Trạm Làm Việc RF Đa Sóng Đổi Mới',
      overview: 'TORR RF là thiết bị y tế không xâm lấn sử dụng công nghệ tần số vô tuyến (RF) đa sóng chuyên biệt để truyền năng lượng nhiệt vào các lớp hạ bì và dưới da.',
      description: 'Ý nghĩa lâm sàng cốt lõi của TORR RF nằm ở khả năng truyền năng lượng mạnh mẽ nhưng an toàn một cách đồng đều đến độ sâu mong muốn với công suất thấp, ngăn ngừa bỏng bề mặt trong khi tối đa hóa sưởi ấm mô sâu. Đã được FDA 510(k) cấp phép (K212561), được thiết kế cho săn chắc da, tạo hình cơ thể và giảm đau.',
      keyTechnologies: [
        {
          name: 'Đầu Chuyển Động Tròn Tự Động (Đã Cấp Bằng Sáng Chế)',
          description: 'Đầu tay cầm tự động xoay (68 rpm), tạo trường nhiệt "Toroidal" đảm bảo năng lượng RF phân bố đồng đều không có điểm nóng và giảm mệt mỏi cho người vận hành.',
        },
        {
          name: 'Kiểm Soát Nhiệt Độ Thời Gian Thực',
          description: 'Cảm biến tích hợp giám sát nhiệt độ da liên tục. Hệ thống tự động ngắt đầu ra RF nếu nhiệt độ vượt quá giới hạn an toàn (điều chỉnh 30°C–50°C), ngăn ngừa bỏng.',
        },
        {
          name: 'Chế Độ Vibro-Comfort',
          description: 'Công nghệ rung 3D (10.000 lần/phút) giảm thiểu cảm giác nóng thông qua phân tán thần kinh (Lý thuyết Kiểm soát Cổng), mang lại sự thoải mái cho bệnh nhân nhạy cảm với nhiệt.',
        },
      ],
      indications: [
        'Nâng cơ & Săn chắc da - Truyền năng lượng nhiệt vào lớp hạ bì sâu để kích thích tái tạo collagen',
        'Tạo hình cơ thể & Cellulite - FDA cấp phép cho giảm tạm thời biểu hiện cellulite',
        'Mạch máu (Tuần hoàn) - Được cấp phép cho cải thiện tạm thời tuần hoàn máu cục bộ',
        'Quản lý đau - Giảm đau cơ nhẹ, đau nhức và co thắt cơ',
      ],
      specLabels: {
        'Frequency': 'Tần số',
        'Max Output Power': 'Công suất đầu ra tối đa',
        'Operation Modes': 'Chế độ hoạt động',
        'Treatment Depth': 'Độ sâu điều trị',
        'Temperature Control': 'Kiểm soát nhiệt độ',
        'User Interface': 'Giao diện người dùng',
        'Dimensions': 'Kích thước',
        'Weight': 'Trọng lượng',
        'Power': 'Nguồn điện',
        'Safety Class': 'Cấp an toàn',
      },
      specNotes: {
        'Stable deep heating frequency': 'Tần số sưởi ấm sâu ổn định',
        'Low power, high efficiency': 'Công suất thấp, hiệu suất cao',
        'Selectable via GUI': 'Chọn qua GUI',
        'Adjustable Low/Deep Mode': 'Chế độ Low/Deep có thể điều chỉnh',
        'Real-time monitoring & Auto-cut off': 'Giám sát thời gian thực & Tự động ngắt',
        'Intuitive GUI with Preset Memory': 'GUI trực quan với bộ nhớ cài đặt sẵn',
      },
      handpieces: [
        { name: 'Tay cầm lớn (Cơ thể)', feature: 'Chuyển động tròn tự động (68 rpm) cho tạo hình vùng rộng' },
        { name: 'Tay cầm nhỏ (Mặt)', feature: 'Thiết kế cho săn chắc mặt và tạo hình má' },
        { name: 'Tay cầm siêu nhỏ (Mắt/Tinh tế)', feature: 'Chăm sóc chính xác cho vùng quanh mắt và nếp nhăn' },
      ],
      clinicalBenefits: [
        'Điều trị không đau với Chế độ Vibro-Comfort',
        'Truyền năng lượng đồng đều ngăn mệt mỏi người vận hành',
        'Giám sát an toàn thời gian thực ngăn bỏng',
        'Không có hộp mực tiêu hao - chi phí vận hành thấp',
      ],
      differentiators: [
        {
          feature: 'Công nghệ Auto-Motion',
          description: 'Khác với đầu dò cố định truyền thống, đầu xoay (68 rpm) đảm bảo phân bố năng lượng đồng đều trên vùng điều trị rộng',
        },
        {
          feature: 'Công suất thấp hơn, Hiệu quả cao hơn',
          description: 'Đạt được sưởi ấm hiệu quả với 55W so với đối thủ cạnh tranh cần đến 150W, tăng cường an toàn',
        },
        {
          feature: 'Tay cầm không tiêu hao',
          description: 'Tay cầm bền được thiết kế để sử dụng lâu dài mà không cần thay hộp mực đắt tiền',
        },
      ],
    },
    'ulblanc': {
      tagline: 'Trạm Làm Việc Siêu Âm Đa Tần Số',
      overview: 'ULBLANC là trạm chăm sóc da toàn diện kết hợp siêu âm tần số kép để săn chắc với sóng âm xâm thực để dẫn thuốc qua da.',
      description: 'Hệ thống cho phép điều trị hiệu quả mà không làm tổn thương bề mặt da, với công nghệ Dynamic Dual Wave cho điều trị cả lớp nông và sâu.',
      keyTechnologies: [
        {
          name: 'Sono-I (Dynamic Dual Wave™)',
          description: 'Xen kẽ giữa các tần số siêu âm khác nhau để nhắm mục tiêu cả biểu bì và hạ bì. 1/3 MHz cho săn chắc hạ bì sâu, 3/10 MHz cho làm dịu biểu bì.',
        },
        {
          name: 'i-Booster (Siêu âm dẫn thuốc)',
          description: 'Sử dụng siêu âm 28kHz tạo ra hiện tượng xâm thực âm thanh, mở các đường dẫn vi mô cho việc dẫn truyền hoạt chất sâu qua da.',
        },
      ],
      indications: [
        'Săn chắc và thắt chặt da',
        'Giảm nếp nhăn',
        'Tăng cường hấp thụ hoạt chất',
        'Làm dịu da (phù hợp cho mụn/đỏ mặt)',
      ],
      specLabels: {
        'Sono-I Frequency': 'Tần số Sono-I',
        'i-Booster Frequency': 'Tần số i-Booster',
      },
      specNotes: {
        'Dual frequency modes': 'Chế độ tần số kép',
        'For sonophoresis': 'Cho siêu âm dẫn thuốc',
      },
      clinicalBenefits: [
        'Không thời gian nghỉ - Không đau, không nhiễm trùng',
        'Phù hợp sử dụng hàng ngày',
        'Phạm vi điều trị đa dạng từ làm dịu đến nâng cơ',
        'Tăng hiệu suất hấp thụ sản phẩm',
      ],
    },
    'newchae-shot': {
      tagline: 'Thiết Bị Làm Đẹp Cá Nhân 3-trong-1',
      overview: 'NEWCHAE SHOT là thiết bị làm đẹp tại nhà tích hợp công nghệ y tế cấp chuyên nghiệp trong thiết kế nhỏ gọn với khả năng truyền năng lượng đa kênh.',
      description: 'Kết hợp công nghệ RF săn chắc, EMS tạo hình và ELP tăng cường da, NEWCHAE SHOT mang đến kết quả cấp lâm sàng tại nhà.',
      keyTechnologies: [
        {
          name: 'Chế độ RF (Săn chắc)',
          description: 'Công nghệ Multi-Channel RF Stack truyền nhiệt sâu vào lớp hạ bì, thúc đẩy tái tạo collagen.',
        },
        {
          name: 'Chế độ EMS (V-Line)',
          description: 'Kích thích cơ bằng điện cho tạo hình và săn chắc khuôn mặt.',
        },
        {
          name: 'Chế độ ELP (Skin Boost)',
          description: 'Công nghệ điện chuyển nang tăng cường hấp thụ sản phẩm chăm sóc da.',
        },
      ],
      clinicalBenefits: [
        'Mật độ da cải thiện 128,48%',
        'Kích thước lỗ chân lông giảm 26,74%',
        'Cải thiện độ đàn hồi bề mặt và sâu',
        'Tăng cường độ rạng rỡ của da',
      ],
      differentiators: [
        {
          feature: 'Hệ thống bắn tự động',
          description: 'Tập trung đầu ra năng lượng để truyền chính xác',
        },
        {
          feature: 'Rung 3D',
          description: 'Rung 10.000 lần/phút hỗ trợ thẩm thấu năng lượng',
        },
      ],
    },
    'lumino-wave': {
      tagline: 'Thiết Bị Hội Tụ Thế Hệ Mới',
      overview: 'LUMINO WAVE là thiết bị thẩm mỹ tiên tiến được thiết kế để tối đa hóa hiệu quả điều trị bằng cách kết hợp năng lượng siêu âm và laser.',
      description: 'Sử dụng vi bọt do siêu âm tạo ra để tăng cường độ sâu xâm nhập của laser vào da, LUMINO WAVE đại diện cho sự tiến hóa tiếp theo trong liệu pháp hội tụ. Đang trong quá trình phê duyệt MFDS, dự kiến ra mắt nửa cuối 2026.',
      keyTechnologies: [
        {
          name: 'Hội tụ Siêu âm + Laser',
          description: 'Liệu pháp hội tụ trong đó dao động siêu âm và chiếu laser xảy ra đồng thời. Tán xạ ánh sáng được giảm thiểu nhờ hiệu ứng siêu âm, cho phép laser đến các lớp sâu hơn hiệu quả hơn.',
        },
      ],
      clinicalBenefits: [
        'Đạt kết quả điều trị với công suất/năng lượng thấp hơn',
        'Giảm thiểu kích ứng da và tác dụng phụ',
        'Tối đa hóa hiệu ứng nâng cơ và tái tạo',
        'Tăng cường xâm nhập laser đến các lớp hạ bì',
      ],
    },
  },

  // ═══════════════════════════════════════
  // ARABIC (ar)
  // ═══════════════════════════════════════
  ar: {
    'torr-rf': {
      tagline: 'محطة عمل RF متعددة الموجات مبتكرة',
      overview: 'TORR RF هو جهاز طبي غير جراحي يستخدم تقنية الترددات الراديوية (RF) متعددة الموجات المتخصصة لتوصيل الطاقة الحرارية إلى طبقات الأدمة وتحت الجلد.',
      description: 'تكمن الأهمية السريرية الأساسية لـ TORR RF في قدرته على توصيل طاقة قوية وآمنة بشكل موحد إلى العمق المطلوب باستخدام طاقة منخفضة، مع منع حروق السطح وتعظيم تسخين الأنسجة العميقة. حاصل على تصريح FDA 510(k) (K212561)، مصمم لشد الجلد ونحت الجسم وتخفيف الألم.',
      keyTechnologies: [
        {
          name: 'رأس الحركة الدائرية التلقائية (حاصل على براءة اختراع)',
          description: 'يدور رأس القبضة تلقائياً (68 دورة/دقيقة)، مما يخلق حقلاً حرارياً "حلقياً" يضمن توزيع طاقة RF بشكل موحد بدون نقاط ساخنة ويقلل إرهاق المشغل.',
        },
        {
          name: 'التحكم بدرجة الحرارة في الوقت الفعلي',
          description: 'تراقب المستشعرات المدمجة درجة حرارة الجلد باستمرار. يقطع النظام تلقائياً خرج RF إذا تجاوزت درجة الحرارة حد الأمان (قابل للتعديل 30°C-50°C)، مما يمنع الحروق.',
        },
        {
          name: 'وضع الراحة الاهتزازية',
          description: 'تقنية الاهتزاز ثلاثي الأبعاد (10,000 مرة/دقيقة) تخفف الإحساس بالحرارة من خلال التشتيت العصبي (نظرية التحكم بالبوابة)، مما يجعل العلاجات مريحة للمرضى.',
        },
      ],
      indications: [
        'الرفع وشد الجلد - توصيل الطاقة الحرارية إلى الأدمة العميقة لتحفيز إعادة تشكيل الكولاجين',
        'نحت الجسم والسيلوليت - معتمد من FDA للتقليل المؤقت لمظهر السيلوليت',
        'الأوعية الدموية (الدورة الدموية) - معتمد للتحسين المؤقت للدورة الدموية المحلية',
        'إدارة الألم - تخفيف آلام العضلات البسيطة والتشنجات',
      ],
      specLabels: {
        'Frequency': 'التردد',
        'Max Output Power': 'أقصى طاقة خرج',
        'Operation Modes': 'أوضاع التشغيل',
        'Treatment Depth': 'عمق العلاج',
        'Temperature Control': 'التحكم بدرجة الحرارة',
        'User Interface': 'واجهة المستخدم',
        'Dimensions': 'الأبعاد',
        'Weight': 'الوزن',
        'Power': 'الطاقة',
        'Safety Class': 'فئة الأمان',
      },
      specNotes: {
        'Stable deep heating frequency': 'تردد تسخين عميق مستقر',
        'Low power, high efficiency': 'طاقة منخفضة، كفاءة عالية',
        'Selectable via GUI': 'قابل للاختيار عبر واجهة المستخدم',
        'Adjustable Low/Deep Mode': 'وضع Low/Deep قابل للتعديل',
        'Real-time monitoring & Auto-cut off': 'مراقبة فورية وقطع تلقائي',
        'Intuitive GUI with Preset Memory': 'واجهة بديهية مع ذاكرة إعدادات مسبقة',
      },
      handpieces: [
        { name: 'القبضة الكبيرة (الجسم)', feature: 'حركة دائرية تلقائية (68 دورة/دقيقة) لنحت المناطق الكبيرة' },
        { name: 'القبضة الصغيرة (الوجه)', feature: 'مصممة لشد الوجه ونحت الخدين' },
        { name: 'القبضة الدقيقة (العين/المناطق الحساسة)', feature: 'عناية دقيقة لمنطقة حول العين والتجاعيد' },
      ],
      clinicalBenefits: [
        'علاجات بدون ألم مع وضع الراحة الاهتزازية',
        'توصيل طاقة موحد يمنع إرهاق المشغل',
        'مراقبة أمان فورية تمنع الحروق',
        'بدون خراطيش استهلاكية - تكاليف تشغيل منخفضة',
      ],
      differentiators: [
        {
          feature: 'تقنية الحركة التلقائية',
          description: 'على عكس المطبقات الثابتة التقليدية، يضمن الرأس الدوار (68 دورة/دقيقة) توزيع طاقة موحد عبر مناطق العلاج الواسعة',
        },
        {
          feature: 'طاقة أقل، فعالية أعلى',
          description: 'يحقق تسخيناً فعالاً بـ 55 واط مقارنة بالمنافسين الذين يحتاجون حتى 150 واط',
        },
        {
          feature: 'قبضات غير استهلاكية',
          description: 'قبضات متينة مصممة للاستخدام طويل المدى بدون استبدال خراطيش مكلفة',
        },
      ],
    },
    'ulblanc': {
      tagline: 'محطة عمل الموجات فوق الصوتية متعددة الترددات',
      overview: 'ULBLANC هي محطة عمل شاملة للعناية بالبشرة تجمع بين الموجات فوق الصوتية ثنائية التردد للشد والتجويف الصوتي لتوصيل الأدوية عبر الجلد.',
      description: 'يتيح النظام علاجاً فعالاً دون الإضرار بسطح الجلد، مع تقنية Dynamic Dual Wave لعلاج كل من البشرة السطحية والأنسجة العميقة.',
      keyTechnologies: [
        {
          name: 'Sono-I (Dynamic Dual Wave™)',
          description: 'يتناوب بين ترددات الموجات فوق الصوتية المختلفة لاستهداف كل من البشرة والأدمة. 1/3 MHz لشد الأدمة العميقة، 3/10 MHz لتهدئة البشرة.',
        },
        {
          name: 'i-Booster (الإدخال بالموجات فوق الصوتية)',
          description: 'يستخدم الموجات فوق الصوتية 28kHz لتوليد التجويف الصوتي، فتح ممرات دقيقة لتوصيل المكونات الفعالة عبر الجلد.',
        },
      ],
      indications: [
        'شد وتثبيت الجلد',
        'تقليل التجاعيد',
        'تعزيز امتصاص المكونات الفعالة',
        'تهدئة البشرة (مناسب لحب الشباب/الاحمرار)',
      ],
      specLabels: {
        'Sono-I Frequency': 'تردد Sono-I',
        'i-Booster Frequency': 'تردد i-Booster',
      },
      specNotes: {
        'Dual frequency modes': 'أوضاع تردد مزدوج',
        'For sonophoresis': 'للإدخال بالموجات فوق الصوتية',
      },
      clinicalBenefits: [
        'بدون فترة توقف - بدون ألم، بدون عدوى',
        'مناسب للاستخدام اليومي',
        'نطاق علاج متعدد من التهدئة إلى الرفع',
        'تحسين كفاءة امتصاص المنتجات',
      ],
    },
    'newchae-shot': {
      tagline: 'جهاز تجميل شخصي 3 في 1',
      overview: 'NEWCHAE SHOT هو جهاز تجميل منزلي يدمج تقنيات طبية احترافية في تصميم مدمج مع توصيل طاقة متعدد القنوات.',
      description: 'يجمع بين تقنية RF للشد وEMS للنحت وELP لتعزيز البشرة، يقدم NEWCHAE SHOT نتائج بمستوى العيادات للاستخدام المنزلي.',
      keyTechnologies: [
        {
          name: 'وضع RF (الشد)',
          description: 'تقنية Multi-Channel RF Stack توصل الحرارة عميقاً في الأدمة لتعزيز تجديد الكولاجين.',
        },
        {
          name: 'وضع EMS (V-Line)',
          description: 'التحفيز الكهربائي للعضلات لنحت الوجه والشد.',
        },
        {
          name: 'وضع ELP (تعزيز البشرة)',
          description: 'تقنية الإدخال الكهربائي تعزز امتصاص منتجات العناية بالبشرة.',
        },
      ],
      clinicalBenefits: [
        'تحسن كثافة البشرة بنسبة 128.48%',
        'تقليل حجم المسام بنسبة 26.74%',
        'تحسن مرونة السطح والعمق',
        'تعزيز إشراقة البشرة',
      ],
      differentiators: [
        {
          feature: 'نظام الإطلاق التلقائي',
          description: 'يركز خرج الطاقة للتوصيل الدقيق',
        },
        {
          feature: 'اهتزاز ثلاثي الأبعاد',
          description: 'يهتز 10,000 مرة/دقيقة لمساعدة اختراق الطاقة',
        },
      ],
    },
    'lumino-wave': {
      tagline: 'جهاز الدمج من الجيل القادم',
      overview: 'LUMINO WAVE هو جهاز تجميلي متقدم مصمم لتعظيم فعالية العلاج من خلال الجمع بين طاقة الموجات فوق الصوتية والليزر.',
      description: 'باستخدام الفقاعات الدقيقة المستحثة بالموجات فوق الصوتية لتعزيز عمق اختراق الليزر للجلد، يمثل LUMINO WAVE التطور القادم في العلاج بالدمج. حالياً قيد مراجعة MFDS مع إطلاق مخطط في النصف الثاني من 2026.',
      keyTechnologies: [
        {
          name: 'دمج الموجات فوق الصوتية + الليزر',
          description: 'علاج بالدمج حيث يحدث اهتزاز الموجات فوق الصوتية وإشعاع الليزر في وقت واحد. يتم تقليل تشتت الضوء بتأثير الموجات فوق الصوتية، مما يسمح لليزر بالوصول إلى طبقات أعمق بكفاءة.',
        },
      ],
      clinicalBenefits: [
        'تحقيق نتائج علاجية بطاقة أقل',
        'تقليل تهيج الجلد والآثار الجانبية',
        'تعظيم تأثيرات الرفع والتجديد',
        'تعزيز اختراق الليزر لطبقات الأدمة',
      ],
    },
  },
};

/**
 * Get product translation for a given language and product ID.
 * Returns undefined for English (use original product data).
 * Returns undefined if translation not found (fallback to English).
 */
export function getProductTranslation(lang: string, productId: string): ProductTranslation | undefined {
  if (lang === 'en') return undefined;
  return translations[lang]?.[productId];
}
