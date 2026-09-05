// Company Information - Based on BRITZMEDI official documents
export const company = {
  name: "BRITZMEDI Co., Ltd.",
  nameKo: "(주)브리츠메디",
  ceo: "Shin Jae Lee",
  ceoAppointment: "December 2, 2025",
  establishment: "October 23, 2017",
  
  address: {
    full: "1211, 388, Dunchon-daero, Jungwon-gu, Seongnam-si, Gyeonggi-do, Republic of Korea",
    city: "Seongnam-si",
    province: "Gyeonggi-do",
    country: "Republic of Korea",
    postalCode: "13403",
  },
  
  contact: {
    phone: "+82-70-4348-7244",
    // Displayed as-is; `whatsappLink` is the wa.me form (digits only, no + or dashes).
    whatsapp: "+82 10-6525-9442",
    whatsappLink: "https://wa.me/821065259442",
    email: "sh.lee@britzmedi.com",
    website: "www.britzmedi.com",
  },

  businessType: "Manufacturer of Medical Devices, R&D, Wholesale & Retail",
  
  description: {
    short: "Professional aesthetic medical device manufacturer established in 2017",
    long: "BRITZMEDI has evolved from a specialized R&D institute into a global medical device manufacturer, holding FDA clearance and Venture Enterprise certification. We are committed to researching sustainable beauty for everyday life through innovative aesthetic devices.",
  },
  
  philosophy: "Beyond developing aesthetic devices, we are committed to researching sustainable beauty for everyday life.",
  
  // Key Personnel (R&D)
  keyPersonnel: [
    { name: "Kim Dong Hoo", role: "R&D" },
    { name: "Kim Jung Rack", role: "R&D" },
    { name: "Kim Hyoung Moon", role: "R&D" },
    { name: "Hwang Je Wan", role: "R&D" },
  ],

  // Manufacturing
  manufacturing: {
    license: "License No. 6044",
    authority: "Ministry of Food and Drug Safety (MFDS), Korea",
    fdaRegistration: {
      type: "Contract Manufacturer",
      ownerOperatorNumber: "10088936",
    },
  },

  // Intellectual Property
  intellectualProperty: {
    registeredPatents: 11,
    domesticPatents: 10,
    internationalPatents: 1,
    trademarks: 5,
    pendingPatents: "Additional patents pending",
  },
} as const;

// Company Milestones/History
export const milestones = [
  {
    year: "2017",
    title: "Company Establishment",
    description: "Established BRITZMEDI Co., Ltd. and certified as a Company-Affiliated Research Institute",
  },
  {
    year: "2021",
    title: "GMP Certification",
    description: "Obtained GMP (Good Manufacturing Practice) Certification from MFDS",
  },
  {
    year: "2022",
    title: "FDA Clearance & ISO Certification",
    description: "Acquired FDA 510(k) clearance for TORR RF (K212561) and ISO 13485:2016 certification",
  },
  {
    year: "2025",
    title: "Venture Enterprise Re-designation",
    description: "Re-designated as 'Venture Enterprise' (R&D Type), valid until June 2028",
  },
  {
    year: "2026",
    title: "LUMINO WAVE Launch",
    description: "Scheduled launch of next-generation LUMINO WAVE device (H2 2026)",
    upcoming: true,
  },
] as const;

// Core Technologies
export const coreTechnologies = [
  {
    name: "Convergence Therapy",
    description: "Technology combining Ultrasound and Laser to maximize skin penetration",
    appliedTo: "LUMINO WAVE",
  },
  {
    name: "Multi-Wave RF Technology",
    description: "Patented RF thermal systems with segmented electrode designs",
    appliedTo: "TORR RF",
  },
  {
    name: "Transdermal Delivery",
    description: "Acoustic cavitation technology for deep skin absorption",
    appliedTo: "ULBLANC (i-Booster)",
  },
] as const;
