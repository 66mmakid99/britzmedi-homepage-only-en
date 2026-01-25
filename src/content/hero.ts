// Hero Section Settings - Managed via Admin
export interface HeroSettings {
  // Background type: 'gradient' | 'image' | 'video'
  backgroundType: 'gradient' | 'image' | 'video';
  
  // For image background
  backgroundImage?: string;
  backgroundImageAlt?: string;
  
  // For video background
  backgroundVideo?: string;
  backgroundVideoPoster?: string;
  
  // Overlay settings
  overlayOpacity: number; // 0-100
  overlayColor: 'dark' | 'light' | 'primary';
  
  // Content
  badge: string;
  headline: string;
  highlightText: string;
  subheadline: string;
  description: string;
  
  // CTA Buttons
  primaryCTA: {
    text: string;
    href: string;
  };
  secondaryCTA: {
    text: string;
    href: string;
  };
}

// Default hero settings (can be overridden by CMS)
export const heroSettings: HeroSettings = {
  backgroundType: 'image', // Options: 'gradient', 'image', 'video'
  
   // Background image URL (updated 2026-01-26)
   backgroundImage: '/images/hero/herosection_torrrf_modelcut01.webp',
   backgroundImageAlt: 'BRITZMEDI Medical Devices',
   
   // Example video URL (replace with actual video)
   backgroundVideo: '/videos/hero-bg.mp4',
   backgroundVideoPoster: '/images/hero/herosection_torrrf_modelcut02.webp',
  
  // Overlay
  overlayOpacity: 50,
  overlayColor: 'dark',
  
  // Content
  badge: 'FDA 510(k) Cleared Medical Devices',
  headline: 'Innovative Aesthetic',
  highlightText: 'Medical Technology',
  subheadline: 'from Korea',
  description: 'Since 2017, BRITZMEDI has been pioneering advanced RF technology and skincare solutions. Our FDA-cleared devices deliver safe, effective treatments trusted by clinics worldwide.',
  
  // CTAs
  primaryCTA: {
    text: 'Explore Products',
    href: '/products',
  },
  secondaryCTA: {
    text: 'Contact Sales',
    href: '/contact',
  },
};
