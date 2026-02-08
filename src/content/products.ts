// Product Information - Based on BRITZMEDI official documents

export interface ProductSpec {
  label: string;
  value: string;
  note?: string;
}

export interface ProductHandpiece {
  name: string;
  tipSize: string;
  depth: string;
  feature: string;
}

export interface Product {
  id: string;
  name: string;
  model: string;
  tagline: string;
  category: "medical-device" | "cosmetic";
  status: "available" | "coming-soon";
  featured?: boolean;
  
  overview: string;
  description: string;
  
  // Product images
  images?: {
    main?: string;           // Main product image
    logo?: string;           // Product logo
    gallery?: string[];      // Gallery images
    handpieces?: {           // Handpiece-specific images
      [key: string]: string;
    };
  };
  
  keyTechnologies: {
    name: string;
    description: string;
  }[];
  
  indications?: string[];
  
  specifications?: ProductSpec[];
  handpieces?: ProductHandpiece[];
  
  certifications?: {
    name: string;
    status: string;
    detail?: string;
  }[];
  
  clinicalBenefits?: string[];
  
  differentiators?: {
    feature: string;
    description: string;
  }[];
}

export const products: Product[] = [
  {
    id: "torr-rf",
    name: "TORR RF",
    model: "MTX-C1",
    tagline: "Innovative Multi-Wave RF Workstation",
    category: "medical-device",
    status: "available",
    featured: true,
    
    overview: "TORR RF is a non-invasive medical device utilizing specialized Multi-Wave Radiofrequency (RF) technology to deliver thermal energy into the dermal and subcutaneous layers.",
    
    description: "The core clinical significance of TORR RF lies in its ability to deliver powerful yet safe energy uniformly to the desired depth using low power, preventing surface burns while maximizing deep tissue heating. FDA 510(k) cleared (K212561) and designed for skin tightening, body contouring, and pain relief.",
    
    images: {
      main: '/images/products/torr-rf.webp',
      logo: '/images/logos/torr-rf-logo.png',
      gallery: [
        '/images/products/torr-rf/torrrf-01.webp',
        '/images/products/torr-rf/torrrf-body.webp',
        '/images/products/torr-rf/torrrf-handpiece-set.webp',
      ],
      handpieces: {
        'body-deep': '/images/products/torr-rf/body-handpiece-deep.webp',
        'body-super': '/images/products/torr-rf/body-handpiece-super.webp',
        'body-vibe': '/images/products/torr-rf/body-handpiece-vibe.webp',
        'face-deep': '/images/products/torr-rf/face-handpiece-deep.webp',
        'face-super': '/images/products/torr-rf/face-handpiece-super.webp',
        'eye': '/images/products/torr-rf/eye-handpiece.webp',
        'handpiece-01': '/images/products/torr-rf/torrrf-handpiece-01.webp',
        'handpiece-02': '/images/products/torr-rf/torrrf-handpiece-02.webp',
        'handpiece-03': '/images/products/torr-rf/torrrf-handpiece-03.webp',
      }
    },
    
    keyTechnologies: [
      {
        name: "Auto Circular Motion Head (Patented)",
        description: "The handpiece features a head that automatically rotates (68 rpm), creating a 'Toroidal' thermal field ensuring RF energy is distributed uniformly without hot spots and reducing operator fatigue.",
      },
      {
        name: "Real-Time Temperature Control",
        description: "Integrated sensors monitor skin temperature continuously. The system automatically cuts off RF output if temperature exceeds the set safety limit (adjustable 30°C–50°C), preventing burns.",
      },
      {
        name: "Vibro-Comfort Mode",
        description: "3D vibration technology (10,000 times/min) mitigates the sensation of heat through neurological distraction (Gate Control Theory), making treatments comfortable for patients sensitive to heat.",
      },
    ],
    
    indications: [
      "Lifting & Skin Tightening - Delivers thermal energy to the deep dermis to stimulate collagen remodeling",
      "Body Contouring & Cellulite - FDA-cleared for temporary reduction in the appearance of cellulite",
      "Vascular (Circulation) - Cleared for temporary improvement of local blood circulation",
      "Pain Management - Relief of minor muscle aches, pains, and muscle spasms",
    ],
    
    specifications: [
      { label: "Frequency", value: "1 MHz ± 10%", note: "Stable deep heating frequency" },
      { label: "Max Output Power", value: "55W (Medium/Large), 7.5W (Small)", note: "Low power, high efficiency" },
      { label: "Operation Modes", value: "Single / Pulse / Repeat", note: "Selectable via GUI" },
      { label: "Treatment Depth", value: "1.5mm ~ 10mm", note: "Adjustable Low/Deep Mode" },
      { label: "Temperature Control", value: "30°C ~ 50°C", note: "Real-time monitoring & Auto-cut off" },
      { label: "User Interface", value: '10.1" TFT LCD Touch Screen', note: "Intuitive GUI with Preset Memory" },
      { label: "Dimensions", value: "338.1mm (W) × 643mm (D) × 857.5mm (H)" },
      { label: "Weight", value: "36 kg" },
      { label: "Power", value: "100-240 VAC, 50/60 Hz, 200 VA" },
      { label: "Safety Class", value: "Class I, Type BF Applied Part" },
    ],
    
    handpieces: [
      {
        name: "Large Handpiece (Body)",
        tipSize: "Ø 50mm",
        depth: "3.5mm ~ 10mm",
        feature: "Auto-Circular Motion (68 rpm) for large area contouring",
      },
      {
        name: "Small Handpiece (Face)",
        tipSize: "Ø 40mm",
        depth: "2.5mm ~ 6mm",
        feature: "Designed for facial tightening and cheek contouring",
      },
      {
        name: "Micro Handpiece (Eye/Delicate)",
        tipSize: "Ø 20mm",
        depth: "1.5mm ~ 2mm",
        feature: "Precision care for periorbital areas and wrinkles",
      },
    ],
    
    certifications: [
      { name: "FDA 510(k)", status: "Cleared", detail: "K212561" },
      { name: "Korea MFDS", status: "Approved", detail: "License No. 22-156" },
      { name: "ISO 13485:2016", status: "Certified" },
      { name: "GMP", status: "Certified" },
    ],
    
    clinicalBenefits: [
      "Pain-Free treatments with Vibro-Comfort Mode",
      "Uniform energy delivery preventing operator fatigue",
      "Real-time safety monitoring preventing burns",
      "No consumable cartridges - low running costs",
    ],
    
    differentiators: [
      {
        feature: "Auto-Motion Technology",
        description: "Unlike traditional stationary applicators, the rotating head (68 rpm) ensures uniform energy distribution across large treatment areas",
      },
      {
        feature: "Lower Power, Higher Efficacy",
        description: "Achieves effective heating with 55W compared to competitors requiring up to 150W, enhancing safety",
      },
      {
        feature: "Non-Consumable Handpieces",
        description: "Durable handpieces designed for long-term use without expensive cartridge replacements",
      },
    ],
  },
  
  {
    id: "ulblanc",
    name: "ULBLANC",
    model: "i-Booster",
    tagline: "Multi-Frequency Ultrasound Workstation",
    category: "medical-device",
    status: "available",
    
    overview: "ULBLANC is a comprehensive skincare workstation combining dual-frequency ultrasound for tightening with acoustic cavitation for transdermal drug delivery.",
    
    description: "The system allows for effective treatment without damaging the skin surface, featuring Dynamic Dual Wave technology for both superficial and deep tissue treatment.",
    
    images: {
      main: '/images/products/ulblanc.webp',
      gallery: [
        '/images/products/ulblanc/ulblanc-01.webp',
        '/images/products/ulblanc/ulblanc-02.webp',
      ]
    },
    
    keyTechnologies: [
      {
        name: "Sono-I (Dynamic Dual Wave™)",
        description: "Alternates between different ultrasound frequencies to target both epidermis and dermis. 1/3 MHz for deep dermal tightening, 3/10 MHz for epidermal soothing.",
      },
      {
        name: "i-Booster (Sonophoresis)",
        description: "Utilizes 28kHz ultrasound to generate acoustic cavitation (micro-jet effect), opening micro-pathways for deep transdermal delivery of active ingredients.",
      },
    ],
    
    indications: [
      "Skin firming and tightening",
      "Wrinkle reduction",
      "Enhanced absorption of active ingredients",
      "Skin soothing (suitable for ACNE/Flushing)",
    ],
    
    specifications: [
      { label: "Sono-I Frequency", value: "1/3 MHz, 3/10 MHz", note: "Dual frequency modes" },
      { label: "i-Booster Frequency", value: "28 kHz", note: "For sonophoresis" },
      { label: "Output Power", value: "0.5 ~ 2.0 W/cm²", note: "Adjustable intensity" },
      { label: "Treatment Modes", value: "Tightening / Soothing / Boosting" },
      { label: "Display", value: '7" LCD Touch Screen' },
      { label: "Dimensions", value: "280mm (W) × 350mm (D) × 180mm (H)" },
      { label: "Weight", value: "4.5 kg" },
    ],

    handpieces: [
      {
        name: "Sono-I Handpiece (Face)",
        tipSize: "Ø 25mm",
        depth: "Epidermis to Dermis",
        feature: "Dual-wave technology for comprehensive facial treatment",
      },
      {
        name: "i-Booster Handpiece",
        tipSize: "Ø 30mm",
        depth: "Transdermal",
        feature: "28kHz ultrasound for enhanced active ingredient delivery",
      },
    ],

    certifications: [
      { name: "Korea MFDS", status: "Certified", detail: "No. 21-4685" },
    ],

    clinicalBenefits: [
      "No downtime - Pain-free, infection-free",
      "Suitable for daily use",
      "Versatile treatment range from soothing to lifting",
      "Enhanced product absorption efficiency",
    ],

    differentiators: [
      {
        feature: "Dynamic Dual Wave™",
        description: "Alternating frequency technology targets both superficial and deep tissue layers in a single treatment session",
      },
      {
        feature: "Sonophoresis Integration",
        description: "28kHz acoustic cavitation creates micro-pathways for 10x better absorption of active ingredients",
      },
      {
        feature: "ACNE/Flushing Safe",
        description: "Gentle enough for sensitive skin conditions while delivering effective results",
      },
    ],
  },
  
  {
    id: "newchae-shot",
    name: "NEWCHAE SHOT",
    model: "NEWCHAE SHOT",
    tagline: "3-in-1 Personal Beauty Device",
    category: "cosmetic",
    status: "available",
    
    overview: "NEWCHAE SHOT is a home-care beauty device integrating professional-grade medical technologies into a compact form factor with multi-channel energy delivery.",
    
    description: "Combining RF tightening, EMS contouring, and ELP skin boosting technologies, NEWCHAE SHOT delivers clinical-grade results for home use.",
    
    images: {
      main: '/images/products/newchae-shot.webp',
      gallery: [
        '/images/products/newchae-shot/newchae-01-1.webp',
        '/images/products/newchae-shot/newchae-01-4.webp',
        '/images/products/newchae-shot/newchae-pack-1.webp',
        '/images/products/newchae-shot/newchae-pack-2.webp',
      ]
    },
    
    keyTechnologies: [
      {
        name: "RF Mode (Tightening)",
        description: "Multi-Channel RF Stack technology delivers heat deep into the dermis, promoting collagen regeneration.",
      },
      {
        name: "EMS Mode (V-Line)",
        description: "Electrical Muscle Stimulation for facial contouring and toning.",
      },
      {
        name: "ELP Mode (Skin Boost)",
        description: "Electroporation technology enhances absorption of skincare products.",
      },
    ],

    indications: [
      "Skin Tightening - RF energy stimulates collagen for firmer skin",
      "Face Contouring - EMS tones facial muscles for V-line effect",
      "Product Absorption - ELP enhances skincare penetration",
      "Anti-Aging - Reduces fine lines and improves skin texture",
    ],

    specifications: [
      { label: "RF Frequency", value: "1 MHz", note: "Multi-channel stack" },
      { label: "EMS Frequency", value: "1-100 Hz", note: "Adjustable" },
      { label: "ELP Frequency", value: "100-1000 Hz", note: "Electroporation" },
      { label: "Treatment Modes", value: "RF / EMS / ELP / Combined" },
      { label: "Vibration", value: "10,000 times/min", note: "3D vibration" },
      { label: "Dimensions", value: "65mm × 65mm × 170mm" },
      { label: "Weight", value: "180g" },
      { label: "Battery", value: "Li-ion, USB-C Charging" },
    ],

    clinicalBenefits: [
      "Skin Density improved by 128.48%",
      "Pore Size reduced by 26.74%",
      "Improved surface and deep elasticity",
      "Enhanced skin radiance",
    ],

    differentiators: [
      {
        feature: "Automated Shot System",
        description: "Concentrates energy output for precise delivery at optimal intervals",
      },
      {
        feature: "3D Vibration Technology",
        description: "Vibrates 10,000 times/min to assist energy penetration and comfort",
      },
      {
        feature: "Clinical-Grade Home Care",
        description: "Professional technology miniaturized for convenient daily home use",
      },
    ],
  },
  
  {
    id: "lumino-wave",
    name: "LUMINO WAVE",
    model: "LSR-10",
    tagline: "Next-Generation Convergence Device",
    category: "medical-device",
    status: "coming-soon",
    
    overview: "LUMINO WAVE is an advanced aesthetic device designed to maximize treatment efficacy by combining Ultrasound and Laser energies.",
    
    description: "Utilizing ultrasound-induced microbubbles to enhance the penetration depth of laser into the skin, LUMINO WAVE represents the next evolution in convergence therapy. Currently undergoing MFDS approval with scheduled launch in H2 2026.",
    
    keyTechnologies: [
      {
        name: "Ultrasound + Laser Convergence",
        description: "A convergence therapy where ultrasound vibration and laser irradiation occur simultaneously. Light scattering is minimized by ultrasound effects, allowing the laser to reach deeper layers more efficiently.",
      },
    ],
    
    certifications: [
      { name: "KC (EMC)", status: "Registered", detail: "R-R-bzm-LSR-10 (April 2025)" },
      { name: "Korea MFDS", status: "Under Review", detail: "Target: H2 2026" },
    ],
    
    clinicalBenefits: [
      "Achieves therapeutic results with lower power/energy",
      "Minimized skin irritation and side effects",
      "Maximized lifting and regeneration effects",
      "Enhanced laser penetration to dermal layers",
    ],
  },
];

// Product Categories
export const productCategories = [
  {
    id: "medical-device",
    name: "Medical Devices",
    description: "KFDA-certified professional aesthetic medical devices",
  },
  {
    id: "cosmetic",
    name: "Medical Cosmetics",
    description: "Professional-grade home beauty devices",
  },
] as const;

// Get product by ID
export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

// Get products by category
export function getProductsByCategory(category: Product["category"]): Product[] {
  return products.filter(p => p.category === category);
}

// Get featured products
export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.featured);
}

// Get available products
export function getAvailableProducts(): Product[] {
  return products.filter(p => p.status === "available");
}
