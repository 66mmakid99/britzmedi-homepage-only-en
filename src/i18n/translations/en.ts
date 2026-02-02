// English translations (default)
export const en = {
  // Navigation
  nav: {
    products: 'Products',
    about: 'About',
    certifications: 'Certifications',
    resources: 'Resources',
    faq: 'FAQ',
    contact: 'Contact',
    contactUs: 'Contact Us',
  },

  // Common
  common: {
    learnMore: 'Learn More',
    viewDetails: 'View Details',
    downloadBrochure: 'Download Brochure',
    getQuote: 'Get a Quote',
    contactSales: 'Contact Sales',
    readMore: 'Read More',
    viewAll: 'View All',
    backTo: 'Back to',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    submit: 'Submit',
    cancel: 'Cancel',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    all: 'All',
  },

  // Home page
  home: {
    hero: {
      title: 'Innovative Aesthetic Medical Solutions',
      subtitle: 'FDA 510(k) Cleared | ISO 13485 Certified | GMP Manufacturing',
      cta: 'Explore Our Products',
      ctaSecondary: 'Become a Distributor',
    },
    features: {
      title: 'Why Choose BRITZMEDI',
      subtitle: 'Trusted by professionals worldwide',
    },
    products: {
      title: 'Our Products',
      subtitle: 'Advanced medical devices for aesthetic professionals',
    },
    certifications: {
      title: 'Global Certifications',
      subtitle: 'Meeting the highest international standards',
    },
  },

  // Products
  products: {
    title: 'Products',
    subtitle: 'Innovative Medical Devices',
    category: {
      all: 'All Products',
      medicalDevice: 'Medical Devices',
      cosmetic: 'Cosmetics',
    },
    status: {
      available: 'Available',
      comingSoon: 'Coming Soon',
    },
    details: {
      overview: 'Overview',
      keyTechnologies: 'Key Technologies',
      indications: 'Indications',
      specifications: 'Specifications',
      certifications: 'Certifications',
      clinicalBenefits: 'Clinical Benefits',
      handpieces: 'Handpieces',
    },
  },

  // About
  about: {
    title: 'About BRITZMEDI',
    subtitle: 'Leading aesthetic medical device manufacturer from Korea',
    mission: {
      title: 'Our Mission',
      description: 'To provide innovative, safe, and effective aesthetic medical solutions to professionals worldwide.',
    },
    history: {
      title: 'Our History',
    },
    team: {
      title: 'Leadership Team',
    },
  },

  // Contact / Lead Form
  contact: {
    title: 'Contact Us',
    subtitle: 'Get in touch with our team',
    form: {
      companyName: 'Company Name',
      companyWebsite: 'Company Website',
      yourName: 'Your Name',
      jobTitle: 'Job Title',
      businessEmail: 'Business Email',
      country: 'Country',
      interestedIn: 'Interested In',
      message: 'Message',
      privacy: 'I agree to the privacy policy',
      submit: 'Submit Inquiry',
      submitting: 'Submitting...',
    },
    validation: {
      required: 'This field is required',
      invalidEmail: 'Please enter a valid email address',
      businessEmailRequired: 'Please use your business email',
      invalidUrl: 'Please enter a valid URL',
      selectAtLeastOne: 'Please select at least one option',
    },
    success: {
      title: 'Thank You!',
      message: 'We have received your inquiry and will get back to you within 24-48 hours.',
    },
    info: {
      title: 'Contact Information',
      address: 'Address',
      phone: 'Phone',
      email: 'Email',
    },
  },

  // FAQ
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Find answers to common questions',
    categories: {
      products: 'Products',
      company: 'Company',
      ordering: 'Ordering & Distribution',
      technical: 'Technical Support',
      certifications: 'Certifications',
    },
  },

  // Footer
  footer: {
    company: 'Company',
    products: 'Products',
    support: 'Support',
    legal: 'Legal',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    copyright: '© {year} BRITZMEDI Co., Ltd. All rights reserved.',
  },

  // 404
  notFound: {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    backHome: 'Back to Home',
  },
} as const;

export type TranslationKeys = typeof en;
