// Homepage Visual Editor - TypeScript Interfaces

export interface HeroCTA {
  text: string;
  href: string;
}

export interface HeroSection {
  backgroundType: 'gradient' | 'image' | 'video' | 'split';
  backgroundImage: string;
  backgroundImageAlt: string;
  backgroundVideo: string;
  backgroundVideoPoster: string;
  heroImage?: string;
  heroImageAlt?: string;
  overlayOpacity: number; // 0-100
  overlayColor: 'dark' | 'light' | 'primary';
  badge: string;
  headline: string;
  highlightText: string;
  subheadline: string;
  description: string;
  primaryCTA: HeroCTA;
  secondaryCTA: HeroCTA;
}

export interface TrustBadge {
  label: string;
  title: string;
  subtitle: string;
}

export interface TrustBadgesSection {
  badges: TrustBadge[];
}

export interface FeaturedProductsSection {
  label: string;
  title: string;
  description: string;
  displayCount: number;
  imageOverrides?: Record<string, string>; // productId → image URL (from Site Editor uploads)
}

export interface WhyFeature {
  iconPath: string;
  title: string;
  description: string;
}

export interface CompanyStat {
  label: string;
  value: string;
  type: 'number' | 'badge';
  badgeText?: string;
}

export interface WhyBritzMediSection {
  label: string;
  title: string;
  description: string;
  features: WhyFeature[];
  statsTitle: string;
  stats: CompanyStat[];
  learnMoreText: string;
  learnMoreHref: string;
}

export interface CoreTechnologiesSection {
  label: string;
  title: string;
  description: string;
}

export interface CTASection {
  title: string;
  description: string;
  primaryCTA: HeroCTA;
  secondaryCTA: HeroCTA;
}

export interface HomepageConfig {
  hero: HeroSection;
  trustBadges: TrustBadgesSection;
  featuredProducts: FeaturedProductsSection;
  whyBritzMedi: WhyBritzMediSection;
  coreTechnologies: CoreTechnologiesSection;
  cta: CTASection;
}
