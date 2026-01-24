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
    title: 'TORR RF Product Brochure',
    description: 'Comprehensive product brochure for TORR RF Multi-Wave RF Workstation including specifications, features, and clinical applications.',
    type: 'pdf',
    category: 'product-brochure',
    thumbnail: '/images/resources/torr-rf-brochure-thumb.jpg',
    driveUrl: 'https://drive.google.com/file/d/PLACEHOLDER/view',
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
    id: 'torr-rf-user-manual',
    title: 'TORR RF User Manual',
    description: 'Complete user manual with operation instructions, safety guidelines, and maintenance procedures.',
    type: 'pdf',
    category: 'technical-docs',
    thumbnail: '/images/resources/torr-rf-manual-thumb.jpg',
    driveUrl: 'https://drive.google.com/file/d/PLACEHOLDER/view',
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
    id: 'fda-510k-certificate',
    title: 'FDA 510(k) Clearance Letter',
    description: 'Official FDA 510(k) clearance documentation for TORR RF (K212561).',
    type: 'pdf',
    category: 'certificates',
    driveUrl: 'https://drive.google.com/file/d/PLACEHOLDER/view',
    fileSize: '0.5 MB',
    product: 'TORR RF',
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
