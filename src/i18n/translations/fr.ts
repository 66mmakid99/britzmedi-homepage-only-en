// French translations
import type { TranslationKeys } from './en';

export const fr: TranslationKeys = {
  // Navigation
  nav: {
    products: 'Produits',
    about: 'A propos',
    certifications: 'Certifications',
    resources: 'Ressources',
    blog: 'Blog',
    faq: 'FAQ',
    contact: 'Contact',
    contactUs: 'Nous contacter',
  },

  // Common
  common: {
    learnMore: 'En savoir plus',
    viewDetails: 'Voir les details',
    downloadBrochure: 'Telecharger la brochure',
    getQuote: 'Demander un devis',
    contactSales: 'Contacter le service commercial',
    readMore: 'Lire la suite',
    viewAll: 'Tout afficher',
    backTo: 'Retour a',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succes',
    submit: 'Envoyer',
    cancel: 'Annuler',
    close: 'Fermer',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    all: 'Tous',
    upcoming: 'A venir',
    appliedTo: 'Applique a',
  },

  // Home page
  home: {
    hero: {
      title: 'Solutions innovantes en medecine esthetique',
      subtitle: 'FDA 510(k) Autorise | ISO 13485 Certifie | Fabrication GMP',
      cta: 'Decouvrir nos produits',
      ctaSecondary: 'Devenir distributeur',
    },
    features: {
      title: 'Pourquoi choisir BRITZMEDI',
      subtitle: 'La confiance des professionnels a travers le monde',
    },
    products: {
      title: 'Nos produits',
      subtitle: 'Dispositifs medicaux avances pour les professionnels de l\'esthetique',
    },
    certifications: {
      title: 'Certifications internationales',
      subtitle: 'Conformes aux normes internationales les plus exigeantes',
    },
  },

  // Products
  products: {
    title: 'Produits',
    subtitle: 'Dispositifs medicaux innovants',
    category: {
      all: 'Tous les produits',
      medicalDevice: 'Dispositifs medicaux',
      cosmetic: 'Cosmetiques',
    },
    status: {
      available: 'Disponible',
      comingSoon: 'Bientot disponible',
    },
    details: {
      overview: 'Apercu',
      keyTechnologies: 'Technologies cles',
      indications: 'Indications',
      specifications: 'Specifications',
      certifications: 'Certifications',
      clinicalBenefits: 'Benefices cliniques',
      handpieces: 'Pieces a main',
      gallery: 'Galerie',
      productImages: 'Images du produit',
      technology: 'Technologie',
      clinicalUse: 'Utilisation clinique',
      technicalData: 'Donnees techniques',
      accessories: 'Accessoires',
      handpieceConfig: 'Configuration des pieces a main',
      benefits: 'Avantages',
      tipSize: 'Taille de l\'embout',
      depth: 'Profondeur',
      flagshipProduct: 'Produit phare',
      comingH22026: 'Disponible S2 2026',
      medicalDevice: 'Dispositif medical',
      medicalCosmetic: 'Cosmetique medicale',
      model: 'Modele',
      requestQuote: 'Demander un devis',
      requestDemo: 'Demander une demonstration',
      interestedIn: 'Interesse par ce produit ?',
      contactCta: 'Contactez notre equipe commerciale pour les tarifs, la planification d\'une demonstration ou toute question technique.',
      viewAllProducts: 'Voir tous les produits',
      home: 'Accueil',
    },
  },

  // About page
  about: {
    title: 'A propos de BRITZMEDI',
    subtitle: 'Fabricant leader de dispositifs medicaux esthetiques de Coree',
    hero: {
      label: 'A propos de BRITZMEDI',
      title1: 'Pionnier de l\'esthetique',
      title2: 'Innovation medicale',
    },
    overview: {
      title: 'Presentation de l\'entreprise',
      companyName: 'Raison sociale',
      ceo: 'PDG',
      appointed: 'Nomme',
      established: 'Date de creation',
      headquarters: 'Siege social et usine',
      businessType: 'Type d\'activite',
    },
    philosophy: {
      title: 'Notre philosophie',
      text: 'Au-dela du developpement de dispositifs esthetiques, nous nous engageons a rechercher une beaute durable au quotidien.',
    },
    ip: {
      title: 'Propriete intellectuelle',
      registeredPatents: 'Brevets deposes',
      trademarks: 'Marques deposees',
      domesticPatents: 'Brevets nationaux',
      internationalPatents: 'Brevets internationaux',
    },
    history: {
      label: 'Notre parcours',
      title: 'Historique et etapes cles',
      subtitle: 'D\'un institut specialise en R&D a un fabricant mondial de dispositifs medicaux avec autorisation FDA.',
    },
    milestones: {
      '2017': {
        title: 'Creation de l\'entreprise',
        description: 'Creation de BRITZMEDI Co., Ltd. et certification en tant qu\'Institut de Recherche Affilie',
      },
      '2021': {
        title: 'Certification GMP',
        description: 'Obtention de la certification GMP (Bonnes Pratiques de Fabrication) du MFDS',
      },
      '2022': {
        title: 'Autorisation FDA et certification ISO',
        description: 'Obtention de l\'autorisation FDA 510(k) pour TORR RF (K212561) et de la certification ISO 13485:2016',
      },
      '2025': {
        title: 'Renouvellement du statut d\'Entreprise Innovante',
        description: 'Re-designation en tant qu\'Entreprise Innovante (Type R&D), valable jusqu\'en juin 2028',
      },
      '2026': {
        title: 'Lancement de LUMINO WAVE',
        description: 'Lancement prevu du dispositif LUMINO WAVE de nouvelle generation (S2 2026)',
      },
    },
    rnd: {
      label: 'Excellence en R&D',
      title: 'Capacites de recherche et developpement',
      subtitle: 'BRITZMEDI opere en tant qu\'entreprise a forte intensite technologique, mettant l\'accent sur la propriete intellectuelle pour garantir des avantages concurrentiels dans le domaine de la medecine esthetique.',
      points: {
        research: 'Institut de Recherche Affilie certifie depuis 2017',
        venture: 'Certification Entreprise Innovante (Type R&D) valable jusqu\'en juin 2028',
        patents: 'Developpement interne de technologies de convergence brevetees',
        inventors: 'Inventeurs principaux a la tete des demandes de brevets cles pour les technologies avancees',
      },
    },
    tech: {
      title: 'Technologies cles',
      convergence: {
        name: 'Therapie de convergence',
        description: 'Technologie combinant ultrasons et laser pour maximiser la penetration cutanee',
      },
      multiwave: {
        name: 'Technologie RF multi-ondes',
        description: 'Systemes thermiques RF brevetes avec conception d\'electrodes segmentees',
      },
      transdermal: {
        name: 'Administration transdermique',
        description: 'Technologie de cavitation acoustique pour une absorption cutanee en profondeur',
      },
    },
    manufacturing: {
      label: 'Fabrication',
      title: 'Capacites de fabrication et OEM/ODM',
      subtitle: 'BRITZMEDI possede des capacites de fabrication sur l\'ensemble du cycle et offre des services de developpement pour ses partenaires internationaux.',
      infrastructure: {
        title: 'Infrastructure de fabrication',
        description: 'Notre entreprise exploite une installation de fabrication dediee a Hwaseong-si, autorisee par le Ministere de la Securite Alimentaire et Pharmaceutique.',
        mfdsLicense: 'N° de licence MFDS',
        gmpCertified: 'Fabrication certifiee GMP',
        isoCertified: 'Certifie ISO 13485:2016',
      },
      oem: {
        title: 'Pret pour l\'OEM/ODM',
        description: 'Officiellement enregistre aupres de la FDA americaine en tant que fabricant sous contrat, attestant de notre capacite a produire des dispositifs medicaux conformes aux normes americaines les plus strictes.',
        fdaRegistered: 'Fabricant sous contrat enregistre FDA',
        ownerOperator: 'N° Owner/Operator',
        e2eSupport: 'Accompagnement complet du developpement produit',
      },
      cta: 'Discuter des opportunites de partenariat',
    },
    mission: {
      title: 'Notre mission',
      description: 'Fournir des solutions de medecine esthetique innovantes, sures et efficaces aux professionnels du monde entier.',
    },
    team: {
      title: 'Equipe de direction',
    },
  },

  // Contact / Lead Form
  contact: {
    title: 'Nous contacter',
    subtitle: 'Prenez contact avec notre equipe',
    responseTime: 'Nous repondons sous 24 a 48 heures.',
    hero: {
      label: 'Nous contacter',
      title1: 'Engageons la',
      title2: 'conversation',
      description: 'Que vous soyez interesse par nos produits, que vous exploriez des opportunites de partenariat ou que vous ayez besoin d\'un support technique, notre equipe est a votre disposition.',
    },
    getInTouch: 'Nous joindre',
    form: {
      title: 'Demande d\'informations',
      description: 'Remplissez le formulaire ci-dessous et nous vous repondrons sous 1 a 2 jours ouvrables.',
      companyName: 'Nom de l\'entreprise',
      companyWebsite: 'Site web de l\'entreprise',
      yourName: 'Votre nom',
      jobTitle: 'Fonction',
      businessEmail: 'E-mail professionnel',
      country: 'Pays',
      interestedIn: 'Interets',
      selectAtLeastOne: 'Selectionnez au moins un',
      message: 'Message',
      privacy: 'J\'accepte la collecte et l\'utilisation de mes donnees personnelles dans le but de repondre a ma demande.',
      submit: 'Envoyer la demande',
      submitting: 'Envoi en cours...',
      distributionPartnership: 'Partenariat de distribution',
      oemOdm: 'Demande OEM/ODM',
    },
    placeholders: {
      companyName: 'Nom de votre entreprise',
      companyWebsite: 'www.exemple.com',
      yourName: 'Jean Dupont',
      jobTitle: 'PDG / Directeur / Responsable',
      businessEmail: 'vous@entreprise.com',
      selectCountry: 'Selectionnez votre pays',
    },
    hints: {
      businessEmail: 'Veuillez utiliser votre adresse e-mail professionnelle',
    },
    validation: {
      required: 'Ce champ est obligatoire',
      companyNameMin: 'Le nom de l\'entreprise est requis (2 caracteres minimum).',
      yourNameMin: 'Votre nom est requis (2 caracteres minimum).',
      jobTitleRequired: 'La fonction est requise.',
      countryRequired: 'Veuillez selectionner votre pays.',
      invalidEmail: 'Veuillez saisir une adresse e-mail valide.',
      businessEmailRequired: 'Veuillez utiliser votre adresse e-mail professionnelle. Les adresses personnelles (Gmail, Yahoo, etc.) ne sont pas acceptees.',
      tempEmailNotAccepted: 'Les adresses e-mail temporaires ne sont pas acceptees.',
      invalidUrl: 'Veuillez saisir une URL de site web valide.',
      companyWebsiteRequired: 'Le site web de l\'entreprise est requis.',
      businessWebsiteRequired: 'Veuillez saisir une URL de site web professionnel valide.',
      selectAtLeastOne: 'Veuillez selectionner au moins un produit ou service.',
    },
    success: {
      title: 'Demande envoyee avec succes !',
      message: 'Merci pour votre demande. Nous vous repondrons sous 1 a 2 jours ouvrables.',
    },
    error: {
      title: 'Echec de l\'envoi',
      duplicateEmail: 'Une demande avec cette adresse e-mail a deja ete soumise. Nous vous contacterons prochainement.',
      generic: 'Veuillez reessayer plus tard ou nous contacter directement par e-mail a contact@britzmedi.co.kr',
    },
    info: {
      title: 'Coordonnees',
      headquarters: 'Siege social et usine',
      address: 'Adresse',
      phone: 'Telephone',
      email: 'E-mail',
      website: 'Site web',
    },
    map: {
      location: 'Hwaseong-si, Gyeonggi-do, Republique de Coree',
    },
  },

  // FAQ
  faq: {
    title: 'Questions frequemment posees',
    subtitle: 'Trouvez les reponses aux questions courantes',
    heroLabel: 'Assistance',
    heroDescription: 'Trouvez les reponses aux questions courantes concernant nos produits, notre entreprise, le processus de commande, le support technique et les certifications.',
    stillHaveQuestions: 'Vous avez encore des questions ?',
    stillHaveQuestionsDesc: 'Vous ne trouvez pas ce que vous cherchez ? Notre equipe est la pour vous aider. Contactez-nous et nous vous repondrons sous 1 a 2 jours ouvrables.',
    contactUs: 'Nous contacter',
    emailUs: 'Nous envoyer un e-mail',
    categories: {
      products: 'Produits',
      company: 'Entreprise',
      ordering: 'Commandes et distribution',
      technical: 'Support technique',
      certifications: 'Certifications',
    },
    items: {
      'what-is-torr-rf': {
        question: 'Qu\'est-ce que TORR RF et quelles sont ses principales applications ?',
        answer: 'TORR RF est notre dispositif medical phare autorise FDA 510(k) qui utilise une technologie innovante de radiofrequence multi-ondes pour delivrer de l\'energie thermique dans les couches dermiques et sous-cutanees. Il est principalement utilise pour les traitements esthetiques non invasifs, notamment le raffermissement cutane, la reduction des rides et le remodelage corporel. L\'appareil dispose de conceptions d\'electrodes segmentees brevetees pour une delivrance d\'energie precise.',
      },
      'torr-rf-fda-cleared': {
        question: 'TORR RF est-il autorise par la FDA ?',
        answer: 'Oui, TORR RF a recu l\'autorisation FDA 510(k) (K212561) en 2022. Cette autorisation confirme que le dispositif repond aux normes de securite et d\'efficacite exigees par la Food and Drug Administration americaine pour la commercialisation aux Etats-Unis.',
      },
      'ulblanc-features': {
        question: 'Qu\'est-ce qui differencie ULBLANC des autres appareils a ultrasons ?',
        answer: 'ULBLANC est une station de soins cutanes complete qui combine une technologie ultrasonore bi-frequence avec la cavitation acoustique pour l\'administration transdermique de principes actifs (technologie i-Booster). Cette combinaison unique permet a la fois des effets de raffermissement cutane et une absorption amelioree des produits de soins, faisant d\'ULBLANC une solution polyvalente pour les cliniques esthetiques.',
      },
      'newchae-shot-home-use': {
        question: 'NEWCHAE SHOT peut-il etre utilise a domicile ?',
        answer: 'Oui, NEWCHAE SHOT est specialement concu comme un appareil de beaute personnel 3-en-1 pour un usage a domicile. Il integre des technologies medicales de niveau professionnel dans un format compact et convivial avec une delivrance d\'energie multicanale, permettant aux consommateurs d\'obtenir des resultats de soins de niveau professionnel chez eux.',
      },
      'lumino-wave-availability': {
        question: 'Quand LUMINO WAVE sera-t-il disponible ?',
        answer: 'Le lancement de LUMINO WAVE est prevu pour le second semestre 2026. Ce dispositif de nouvelle generation integre notre technologie innovante de therapie de convergence, combinant ultrasons et laser pour maximiser la penetration cutanee. Contactez notre equipe commerciale pour etre informe de sa disponibilite.',
      },
      'company-history': {
        question: 'Quand BRITZMEDI a-t-elle ete creee ?',
        answer: 'BRITZMEDI Co., Ltd. a ete creee le 23 octobre 2017 en Coree du Sud. Nous avons debute en tant qu\'Institut de Recherche Affilie et sommes devenus un fabricant mondial de dispositifs medicaux avec une autorisation FDA, une certification ISO 13485 et un statut d\'Entreprise Innovante.',
      },
      'company-location': {
        question: 'Ou se trouve BRITZMEDI ?',
        answer: 'Notre siege social et notre usine de fabrication sont situes au 1211, 388, Dunchon-daero, Jungwon-gu, Seongnam-si, Gyeonggi-do, Republique de Coree (Code postal : 13403). Nous exploitons une installation de fabrication certifiee GMP avec des capacites de R&D integrees.',
      },
      'rd-capabilities': {
        question: 'BRITZMEDI dispose-t-elle de ses propres capacites de R&D ?',
        answer: 'Oui, BRITZMEDI exploite un Institut de Recherche Affilie avec du personnel R&D dedie. Nous avons depose plus de 11 brevets (10 nationaux, 1 international) et 5 marques. Notre statut d\'Entreprise Innovante de type R&D confirme notre engagement envers l\'innovation en technologie medicale esthetique.',
      },
      'become-distributor': {
        question: 'Comment devenir distributeur BRITZMEDI ?',
        answer: 'Nous accueillons les demandes de partenariat de distributeurs qualifies dans le monde entier. Pour devenir distributeur, veuillez contacter notre equipe commerciale via la page Contact avec des informations sur votre entreprise, le territoire souhaite et votre experience dans la distribution de dispositifs medicaux. Nous examinerons votre candidature et organiserons une consultation.',
      },
      'minimum-order': {
        question: 'Quelles sont les quantites minimales de commande ?',
        answer: 'Les quantites minimales de commande varient selon le produit et le marche. Veuillez contacter notre equipe commerciale pour des informations specifiques sur les MOQ en fonction de votre territoire et de vos besoins. Nous proposons des arrangements flexibles pour les distributeurs qualifies et pouvons discuter d\'unites d\'echantillonnage a des fins d\'evaluation.',
      },
      'shipping-international': {
        question: 'Livrez-vous a l\'international ?',
        answer: 'Oui, nous livrons aux distributeurs et partenaires dans le monde entier. Nos produits sont fabriques dans notre usine certifiee GMP en Coree et expedies selon les normes internationales d\'expedition de dispositifs medicaux. Les conditions d\'expedition et la logistique seront discutees lors des negociations de partenariat.',
      },
      'oem-odm-services': {
        question: 'Proposez-vous des services OEM/ODM ?',
        answer: 'Oui, BRITZMEDI est un fabricant sous contrat enregistre aupres de la FDA (Owner Operator Number : 10088936) offrant des services OEM/ODM complets. Nous fournissons des services de developpement de bout en bout, de la conception a la fabrication, en tirant parti de notre usine certifiee GMP et de notre equipe R&D experimentee. Contactez-nous pour discuter de vos besoins specifiques.',
      },
      'training-provided': {
        question: 'Proposez-vous des formations pour vos appareils ?',
        answer: 'Oui, nous proposons des programmes de formation complets pour tous nos dispositifs medicaux. La formation comprend le fonctionnement de l\'appareil, les protocoles de traitement, les procedures de securite et la maintenance. La formation peut etre dispensee sur site, dans nos locaux en Coree, ou via notre plateforme de formation numerique. Contactez votre distributeur local ou notre equipe d\'assistance pour organiser une formation.',
      },
      'warranty-policy': {
        question: 'Quelle est votre politique de garantie ?',
        answer: 'Les produits BRITZMEDI sont couverts par une garantie fabricant standard. Les conditions et la couverture de la garantie varient selon le produit et la region. Notre garantie couvre les defauts de fabrication et inclut le support technique. Des options de garantie etendue sont disponibles. Veuillez consulter votre documentation d\'achat ou contacter notre equipe d\'assistance pour des informations specifiques sur la garantie.',
      },
      'technical-support': {
        question: 'Comment obtenir un support technique ?',
        answer: 'Le support technique est disponible via plusieurs canaux : 1) Contactez votre distributeur agree local, 2) Envoyez un e-mail a notre equipe d\'assistance a contact@britzmedi.co.kr, 3) Appelez-nous au +82-70-4348-7244 pendant les heures ouvrables (9h00 - 18h00 KST, du lundi au vendredi). Nous nous efforcons de repondre a toutes les demandes sous 1 a 2 jours ouvrables.',
      },
      'iso-certification': {
        question: 'BRITZMEDI est-elle certifiee ISO ?',
        answer: 'Oui, BRITZMEDI est certifiee ISO 13485:2016, la norme internationale pour les systemes de management de la qualite des dispositifs medicaux. Cette certification demontre notre engagement envers une qualite constante et la conformite reglementaire dans la conception, le developpement et la fabrication de dispositifs medicaux.',
      },
      'gmp-certified': {
        question: 'Votre usine de fabrication est-elle certifiee GMP ?',
        answer: 'Oui, notre usine de fabrication est certifiee GMP (Bonnes Pratiques de Fabrication) par le Ministere coreen de la Securite Alimentaire et Pharmaceutique (MFDS). Nous avons obtenu cette certification en 2021, et elle garantit que nos produits sont fabriques et controles de maniere coherente selon les normes de qualite.',
      },
      'regulatory-approvals': {
        question: 'Quelles autorisations reglementaires vos produits possedent-ils ?',
        answer: 'Nos produits detiennent diverses autorisations reglementaires selon le marche. TORR RF possede l\'autorisation FDA 510(k) pour le marche americain et l\'approbation MFDS coreenne. Tous les produits disposent de l\'approbation MFDS coreenne. Nous elargissons continuellement notre portefeuille reglementaire et pouvons fournir des informations specifiques sur les certifications pour votre marche cible sur demande.',
      },
    },
  },

  // Certifications page
  certifications: {
    title: 'Certifications',
    subtitle: 'Qualite et statut reglementaire',
    heroLabel: 'Qualite et conformite',
    heroTitle1: 'Certifications et',
    heroTitle2: 'Statut reglementaire',
    qualityTitle: 'Certifications qualite et reglementaires',
    qualitySubtitle: 'Nos certifications completes demontrent notre engagement envers la qualite et la securite des patients.',
    technicalLabel: 'Conformite',
    technicalTitle: 'Normes de securite technique',
    technicalSubtitle: 'Nos appareils sont concus et testes pour repondre aux normes de securite internationales rigoureuses, tel que verifie lors des processus d\'examen FDA 510(k) et MFDS.',
    powerRequirements: 'Exigences d\'alimentation',
    voltage: 'Tension',
    protectionClass: 'Classe de protection',
    roadmapLabel: 'Expansion internationale',
    roadmapTitle: 'Feuille de route reglementaire',
    roadmapSubtitle: 'Nos efforts continus pour commercialiser les produits BRITZMEDI sur les marches du monde entier.',
    tableRegion: 'Region / Organisme',
    tableProduct: 'Produit',
    tableStatus: 'Statut',
    tableNotes: 'Notes',
    fdaNote: 'Note importante sur l\'autorisation FDA',
    ctaTitle: 'Besoin de documents de certification ?',
    ctaSubtitle: 'Contactez-nous pour demander des copies de certificats, des rapports d\'essais ou des informations reglementaires detaillees.',
    ctaRequest: 'Demander des documents',
    ctaViewProducts: 'Voir les produits',
    status: {
      certified: 'Certifie',
      cleared: 'Autorise',
      registered: 'Enregistre',
      inPreparation: 'En preparation',
      planned: 'Prevu',
    },
    certificateNo: 'N° de certificat',
    validUntil: 'Valable jusqu\'au',
    products: 'Produits :',
  },

  // Resources page
  resources: {
    title: 'Ressources',
    subtitle: 'Centre de ressources',
    heroLabel: 'Telechargements',
    heroTitle1: 'Centre de',
    heroTitle2: 'ressources',
    heroDescription: 'Accedez aux brochures produits, documents techniques, supports marketing, certificats et videos. Toutes les ressources sont disponibles en telechargement.',
    allResources: 'Toutes les ressources',
    categories: {
      productBrochure: 'Brochures produits',
      technicalDocs: 'Documents techniques',
      marketing: 'Supports marketing',
      certificates: 'Certificats',
      videos: 'Videos produits',
    },
    download: 'Telecharger',
    noResults: 'Aucune ressource trouvee',
    noResultsDesc: 'Essayez de selectionner une autre categorie.',
    ctaTitle: 'Besoin de documents supplementaires ?',
    ctaSubtitle: 'Vous recherchez des documents specifiques, des presentations personnalisees ou des supports localises ? Contactez notre equipe et nous preparerons les ressources dont vous avez besoin.',
    ctaRequest: 'Demander des supports',
  },

  // Privacy page
  privacy: {
    title: 'Politique de confidentialite',
    heroLabel: 'Mentions legales',
    lastUpdated: 'Derniere mise a jour : janvier 2025',
    intro: {
      title: 'Introduction',
      p1: 'BRITZMEDI Co., Ltd. (« Societe », « nous », « notre ») exploite le site web britzmedi.com et les services associes. Cette Politique de confidentialite explique comment nous collectons, utilisons, divulguons et protegeons vos informations lorsque vous visitez notre site web et utilisez nos services.',
      p2: 'Veuillez lire attentivement cette Politique de confidentialite. Si vous n\'acceptez pas nos politiques et pratiques, veuillez ne pas utiliser nos services.',
    },
    collection: {
      title: '1. Informations que nous collectons',
      personalTitle: 'Informations personnelles que vous fournissez',
      personalDesc: 'Nous pouvons collecter des informations personnelles que vous fournissez volontairement, notamment :',
      autoTitle: 'Informations collectees automatiquement',
      autoDesc: 'Lorsque vous visitez notre site web, nous collectons automatiquement certaines informations :',
    },
    contactTitle: 'Coordonnees',
    contactDesc: 'Si vous avez des questions concernant cette Politique de confidentialite ou nos pratiques en matiere de confidentialite, veuillez nous contacter :',
  },

  // Terms page
  terms: {
    title: 'Conditions generales d\'utilisation',
    heroLabel: 'Mentions legales',
    lastUpdated: 'Derniere mise a jour : janvier 2025',
    intro: {
      title: 'Introduction',
      p1: 'Les presentes Conditions generales d\'utilisation (« Conditions ») regissent votre acces et votre utilisation du site web britzmedi.com et de tous les services, contenus et produits associes fournis par BRITZMEDI Co., Ltd. (« Societe », « nous », « notre »).',
      p2: 'En accedant a notre site web et en l\'utilisant, vous acceptez d\'etre lie par les presentes Conditions. Si vous n\'acceptez pas ces Conditions, veuillez ne pas utiliser notre site web ni nos services.',
    },
    contactTitle: 'Coordonnees',
    contactDesc: 'Si vous avez des questions concernant les presentes Conditions generales d\'utilisation ou si vous souhaitez signaler une violation, veuillez nous contacter :',
  },

  // Footer
  footer: {
    description: 'Leader de l\'innovation en medecine esthetique avec une technologie autorisee FDA depuis la Coree.',
    products: 'Produits',
    company: 'Entreprise',
    resources: 'Ressources',
    contact: 'Contact',
    support: 'Assistance',
    legal: 'Mentions legales',
    links: {
      aboutUs: 'A propos',
      certifications: 'Certifications',
      faq: 'FAQ',
      resourceCenter: 'Centre de ressources',
      productBrochures: 'Brochures produits',
      technicalDocs: 'Documents techniques',
      certificates: 'Certificats',
    },
    badges: {
      fdaCleared: 'FDA 510(k) Autorise',
      iso: 'ISO 13485',
      gmp: 'Certifie GMP',
    },
    privacyPolicy: 'Politique de confidentialite',
    termsOfService: 'Conditions generales d\'utilisation',
    copyright: '\u00a9 {year} BRITZMEDI Co., Ltd. Tous droits reserves.',
  },

  // 404
  notFound: {
    title: 'Page introuvable',
    message: 'La page que vous recherchez n\'existe pas.',
    backHome: 'Retour a l\'accueil',
  },
} as const;
