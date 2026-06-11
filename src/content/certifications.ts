// Certifications & Regulatory Information

export interface Certification {
  name: string;
  fullName: string;
  status: "certified" | "cleared" | "registered" | "in-preparation" | "planned";
  region: string;
  description: string;
  products?: string[];
  certificateNo?: string;
  validUntil?: string;
  icon?: string;
}

export const certifications: Certification[] = [
  {
    name: "FDA 510(k)",
    fullName: "U.S. Food and Drug Administration 510(k) Clearance",
    status: "cleared",
    region: "USA",
    description: "FDA has determined the device to be substantially equivalent to a legally marketed predicate device for indications including temporary relief of muscle pain and temporary reduction in the appearance of cellulite.",
    products: ["TORR RF (MTX-C1)"],
    certificateNo: "K212561",
  },
  {
    name: "ISO 13485:2016",
    fullName: "Medical Device Quality Management Systems",
    status: "certified",
    region: "International",
    description: "Certified for the design, development, manufacture, and sales of active medical devices (Electrosurgical unit).",
    products: ["All Medical Devices"],
    certificateNo: "MI000128",
    validUntil: "November 17, 2028",
  },
  {
    name: "GMP",
    fullName: "Good Manufacturing Practice",
    status: "certified",
    region: "Korea",
    description: "Manufacturing facilities certified by the Ministry of Food and Drug Safety (MFDS), Korea for medical device production.",
    products: ["Surgical Operation System (수술용 장치)"],
    certificateNo: "KTR-ADBAA-27070",
    validUntil: "June 12, 2027",
  },
  {
    name: "MFDS License",
    fullName: "Korea Ministry of Food and Drug Safety Manufacturing License",
    status: "certified",
    region: "Korea",
    description: "Official manufacturing license for medical devices issued by MFDS.",
    products: ["TORR RF (MTX-C1)"],
    certificateNo: "No. 22-156",
  },
  {
    name: "MFDS Certification",
    fullName: "Korea Ministry of Food and Drug Safety Product Certification",
    status: "certified",
    region: "Korea",
    description: "Product certification for medical devices from MFDS.",
    products: ["ULBLANC (i-Booster)"],
    certificateNo: "No. 21-4685",
  },
  {
    name: "KC (EMC)",
    fullName: "Korea Certification - Electromagnetic Compatibility",
    status: "registered",
    region: "Korea",
    description: "Broadcasting and Communication Equipment registration for EMC compliance.",
    products: ["LUMINO WAVE (LSR-10)"],
    certificateNo: "R-R-bzm-LSR-10",
  },
  {
    name: "Venture Enterprise",
    fullName: "Venture Enterprise Certification (R&D Type)",
    status: "certified",
    region: "Korea",
    description: "Recognized as a technology-intensive venture company focused on R&D innovation.",
    validUntil: "June 2028",
  },
];

// Technical Safety Standards
export const technicalStandards = [
  {
    standard: "IEC 60601-1",
    name: "Electrical Safety",
    description: "General requirements for basic safety and essential performance of medical electrical equipment",
  },
  {
    standard: "IEC 60601-1-2",
    name: "EMC (Electromagnetic Compatibility)",
    description: "Requirements and tests for electromagnetic disturbances and immunity",
  },
  {
    standard: "IEC 60601-2-2",
    name: "RF Safety",
    description: "Particular requirements for high frequency surgical equipment and high frequency surgical accessories",
  },
  {
    standard: "ISO 10993-1",
    name: "Biocompatibility",
    description: "Biological evaluation of medical devices - all patient-contacting materials are biocompatible",
  },
];

// Global Regulatory Roadmap
export const regulatoryRoadmap = [
  {
    region: "Korea (MFDS)",
    products: [
      { name: "TORR RF", status: "Approved" },
      { name: "ULBLANC", status: "Approved" },
      { name: "LUMINO WAVE", status: "Under Review", target: "H2 2026" },
    ],
  },
  {
    region: "USA (FDA)",
    products: [
      { name: "TORR RF", status: "510(k) Cleared" },
    ],
  },
  {
    region: "Europe (CE MDR)",
    products: [
      { name: "All Medical Devices", status: "In Preparation" },
    ],
    note: "Preparing for CE MDR certification",
  },
  {
    region: "Brazil (ANVISA)",
    products: [
      { name: "TORR RF", status: "Planned" },
    ],
    note: "To follow FDA market stabilization",
  },
  {
    region: "China (NMPA)",
    products: [
      { name: "TORR RF", status: "Planned" },
    ],
    note: "To follow FDA and CE market stabilization",
  },
];

// FDA Disclaimer
export const fdaDisclaimer = `"FDA Cleared" indicates the FDA has determined the device to be substantially equivalent to a legally marketed predicate device. It does not denote "FDA Approval," which is reserved for high-risk (Class III) devices requiring PMA.`;

// Quality Certifications Summary for display
export const qualitySummary = {
  title: "Quality Assurance",
  description: "BRITZMEDI operates under a strictly certified Quality Management System (QMS) and holds key regulatory approvals for its major products.",
  highlights: [
    "FDA 510(k) Cleared flagship product",
    "ISO 13485:2016 certified quality management",
    "GMP certified manufacturing facilities",
    "11 registered patents (10 domestic, 1 international)",
  ],
};
