// Resources/Downloads Content - Google Drive Integration
export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'ppt' | 'video' | 'image' | 'brochure';
  category: 'product-brochure' | 'technical-docs' | 'marketing' | 'certificates' | 'videos';
  thumbnail?: string;
  driveUrl: string;
  fileSize?: string;
  language?: string;
  product?: string;
}

export const resourceCategories = [
  { id: 'product-brochure', name: 'Product Brochures', icon: 'file-text' },
  { id: 'technical-docs', name: 'Technical Documents', icon: 'file-cog' },
  { id: 'marketing', name: 'Marketing Materials', icon: 'image' },
  { id: 'certificates', name: 'Certificates', icon: 'award' },
  { id: 'videos', name: 'Product Videos', icon: 'video' },
] as const;

// Placeholder resources - to be managed via Admin/CMS
export const resources: Resource[] = [
  // Product Brochures
  {
    id: 'torr-rf-brochure',
    title: 'TORR RF Product Brochure (Overseas)',
    description: 'Comprehensive product brochure for TORR RF Multi-Wave RF Workstation including specifications, features, and clinical applications.',
    type: 'pdf',
    category: 'product-brochure',
    thumbnail: '/images/resources/torr-rf-brochure-thumb.jpg',
    driveUrl: 'https://drive.google.com/file/d/1V_VFi5FcI_-jXsc4YsaryAaKWvqKEZNM/view',
    fileSize: '5.2 MB',
    language: 'English',
    product: 'TORR RF',
  },
  {
    id: 'ulblanc-brochure',
    title: 'ULBLANC Product Brochure',
    description: 'Detailed product information for ULBLANC Multi-Frequency Ultrasound Workstation with i-Booster technology.',
    type: 'pdf',
    category: 'product-brochure',
    thumbnail: '/images/resources/ulblanc-brochure-thumb.jpg',
    driveUrl: 'https://drive.google.com/file/d/PLACEHOLDER/view',
    fileSize: '4.8 MB',
    language: 'English',
    product: 'ULBLANC',
  },
  {
    id: 'newchae-shot-brochure',
    title: 'NEWCHAE SHOT Product Brochure',
    description: 'Product overview and specifications for NEWCHAE SHOT 3-in-1 Personal Beauty Device.',
    type: 'pdf',
    category: 'product-brochure',
    thumbnail: '/images/resources/newchae-shot-brochure-thumb.jpg',
    driveUrl: 'https://drive.google.com/file/d/PLACEHOLDER/view',
    fileSize: '3.5 MB',
    language: 'English',
    product: 'NEWCHAE SHOT',
  },
  
  // Technical Documents
  {
    id: 'torr-rf-cicm-lecture',
    title: 'TORR RF 2025 CICM Lecture',
    description: 'Academic presentation by Dr. Lee Sangsu at CICM 2025 conference covering clinical applications and research findings.',
    type: 'pdf',
    category: 'technical-docs',
    thumbnail: '/images/resources/torr-rf-manual-thumb.jpg',
    driveUrl: 'https://drive.google.com/file/d/19raj_kAzDGM1dXDe8Sff0KYOWHAdSoJC/view',
    fileSize: '8.1 MB',
    language: 'English',
    product: 'TORR RF',
  },
  {
    id: 'torr-rf-spec-sheet',
    title: 'TORR RF Technical Specifications',
    description: 'Detailed technical specifications and performance data for TORR RF device.',
    type: 'pdf',
    category: 'technical-docs',
    driveUrl: 'https://drive.google.com/file/d/PLACEHOLDER/view',
    fileSize: '1.2 MB',
    language: 'English',
    product: 'TORR RF',
  },
  
  // Marketing Materials
  {
    id: 'torr-rf-strategic-proposal-en',
    title: 'TORR RF Strategic Proposal (English)',
    description: 'Strategic business proposal for TORR RF including market analysis, competitive advantages, and partnership opportunities.',
    type: 'pdf',
    category: 'marketing',
    thumbnail: '/images/resources/company-ppt-thumb.jpg',
    driveUrl: 'https://drive.google.com/file/d/1u_NHLiTLjmMIHSbs80ghwZ-GunuSejcm/view',
    fileSize: '12.5 MB',
    language: 'English',
    product: 'TORR RF',
  },
  {
    id: 'torr-rf-strategic-proposal-pt',
    title: 'TORR RF Strategic Proposal (Portuguese)',
    description: 'Strategic business proposal for TORR RF in Portuguese market, including market analysis and partnership opportunities.',
    type: 'pdf',
    category: 'marketing',
    thumbnail: '/images/resources/company-ppt-thumb.jpg',
    driveUrl: 'https://drive.google.com/file/d/124CptgGV4GabNtJSU5TMSMMqYCkD0TU6/view',
    fileSize: '12.5 MB',
    language: 'Portuguese',
    product: 'TORR RF',
  },
  {
    id: 'company-presentation',
    title: 'BRITZMEDI Company Presentation',
    description: 'Corporate presentation covering company history, products, certifications, and partnership opportunities.',
    type: 'ppt',
    category: 'marketing',
    thumbnail: '/images/resources/company-ppt-thumb.jpg',
    driveUrl: 'https://drive.google.com/file/d/PLACEHOLDER/view',
    fileSize: '12.5 MB',
    language: 'English',
  },
  {
    id: 'product-images-torr-rf',
    title: 'TORR RF Product Images',
    description: 'High-resolution product images for TORR RF suitable for marketing and promotional use.',
    type: 'image',
    category: 'marketing',
    thumbnail: '/images/resources/torr-rf-images-thumb.jpg',
    driveUrl: 'https://drive.google.com/drive/folders/PLACEHOLDER',
    fileSize: '45 MB (ZIP)',
    product: 'TORR RF',
  },
  
  // Certificates
  {
    id: 'fda-510k-premarket',
    title: 'FDA 510(k) Premarket Notification',
    description: 'Official FDA 510(k) premarket notification for TORR RF and MTX-C1 devices.',
    type: 'pdf',
    category: 'certificates',
    driveUrl: 'https://drive.google.com/file/d/19JraYy_MYPb-Dee1-xk2OgmwZ5N44IY7/view',
    fileSize: '0.5 MB',
    product: 'TORR RF',
  },
  {
    id: 'fda-clearance-letter',
    title: 'FDA Clearance Letter',
    description: 'FDA clearance letter for TORR RF and MTX-C1 medical devices.',
    type: 'pdf',
    category: 'certificates',
    driveUrl: 'https://drive.google.com/file/d/1sUa0S-VpLcyvIj_y9x-ViWklcKhi6XmB/view',
    fileSize: '0.3 MB',
    product: 'TORR RF',
  },
  {
    id: 'fda-establishment-registration',
    title: 'FDA Establishment Registration & Device Listing',
    description: 'FDA establishment registration and device listing documentation for TORR RF and MTX-C1.',
    type: 'pdf',
    category: 'certificates',
    driveUrl: 'https://drive.google.com/file/d/1a2vw8YHs0YoEBtfIQAFYrEHL1NX_OmWW/view',
    fileSize: '0.4 MB',
    product: 'TORR RF',
  },
  {
    id: 'korea-medical-device-license',
    title: 'Korea Medical Device Manufacturing License (MTX-C1)',
    description: 'Korean medical device manufacturing license for MTX-C1 issued by MFDS.',
    type: 'pdf',
    category: 'certificates',
    driveUrl: 'https://drive.google.com/file/d/1Dz803KqTkBOgBxce1tNRZKVfyWWN_zuK/view',
    fileSize: '0.8 MB',
    language: 'Korean',
  },
  {
    id: 'iso-13485-certificate',
    title: 'ISO 13485:2016 Certificate',
    description: 'ISO 13485:2016 Quality Management System certification for BRITZMEDI.',
    type: 'pdf',
    category: 'certificates',
    driveUrl: 'https://drive.google.com/file/d/PLACEHOLDER/view',
    fileSize: '0.8 MB',
  },
  {
    id: 'gmp-certificate',
    title: 'GMP Certificate',
    description: 'Good Manufacturing Practice certification from Korea MFDS.',
    type: 'pdf',
    category: 'certificates',
    driveUrl: 'https://drive.google.com/file/d/PLACEHOLDER/view',
    fileSize: '0.6 MB',
  },
  
  // Videos
  {
    id: 'torr-rf-demo-video',
    title: 'TORR RF Demonstration Video',
    description: 'Product demonstration video showing TORR RF operation and treatment procedures.',
    type: 'video',
    category: 'videos',
    thumbnail: '/images/resources/torr-rf-video-thumb.jpg',
    driveUrl: 'https://drive.google.com/file/d/PLACEHOLDER/view',
    fileSize: '85 MB',
    language: 'English',
    product: 'TORR RF',
  },
  {
    id: 'company-intro-video',
    title: 'BRITZMEDI Company Introduction',
    description: 'Corporate introduction video showcasing our facilities, team, and manufacturing capabilities.',
    type: 'video',
    category: 'videos',
    thumbnail: '/images/resources/company-video-thumb.jpg',
    driveUrl: 'https://drive.google.com/file/d/PLACEHOLDER/view',
    fileSize: '120 MB',
    language: 'English',
  },
];

export const getResourcesByCategory = (category: Resource['category']) =>
  resources.filter(r => r.category === category);

export const getResourcesByProduct = (product: string) =>
  resources.filter(r => r.product === product);

export const getResourceById = (id: string) =>
  resources.find(r => r.id === id);
