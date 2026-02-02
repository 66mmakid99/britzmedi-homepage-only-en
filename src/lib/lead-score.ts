// Lead Scoring Algorithm for BRITZMEDI
// Score range: 0-100

export interface LeadData {
  companyName: string;
  companyWebsite?: string;
  contactName: string;
  jobTitle: string;
  email: string;
  country: string;
  interestedProducts: string[];
  message?: string;
  companySize?: string;
  companyIndustry?: string;
}

export interface ScoreBreakdown {
  total: number;
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: {
    category: string;
    points: number;
    reason: string;
  }[];
}

// High-value countries for medical device distribution
const TIER_1_COUNTRIES = ['US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA', 'IT', 'ES', 'NL', 'CH', 'SE'];
const TIER_2_COUNTRIES = ['KR', 'CN', 'BR', 'MX', 'IN', 'SG', 'AE', 'SA', 'PL', 'AT', 'BE'];

// Decision-maker job titles
const C_LEVEL_TITLES = ['ceo', 'cto', 'cfo', 'coo', 'chief', 'president', 'owner', 'founder'];
const DIRECTOR_TITLES = ['director', 'vp', 'vice president', 'head of', 'general manager'];
const MANAGER_TITLES = ['manager', 'supervisor', 'lead', 'senior'];

// Products with higher business value
const HIGH_VALUE_PRODUCTS = ['TORR RF', 'ULBLANC'];
const MEDICAL_DEVICES = ['TORR RF', 'ULBLANC', 'LUMINO WAVE'];

// Industries that commonly purchase aesthetic devices
const TARGET_INDUSTRIES = [
  'healthcare', 'medical', 'dermatology', 'aesthetics', 'beauty', 'spa',
  'clinic', 'hospital', 'wellness', 'cosmetic', 'plastic surgery'
];

export function calculateLeadScore(lead: LeadData): ScoreBreakdown {
  const breakdown: ScoreBreakdown['breakdown'] = [];
  let total = 0;

  // 1. Country Score (max 20 points)
  const countryScore = scoreCountry(lead.country);
  total += countryScore.points;
  breakdown.push({
    category: 'Country/Market',
    points: countryScore.points,
    reason: countryScore.reason
  });

  // 2. Job Title Score (max 25 points)
  const titleScore = scoreJobTitle(lead.jobTitle);
  total += titleScore.points;
  breakdown.push({
    category: 'Decision Authority',
    points: titleScore.points,
    reason: titleScore.reason
  });

  // 3. Product Interest Score (max 20 points)
  const productScore = scoreProductInterest(lead.interestedProducts);
  total += productScore.points;
  breakdown.push({
    category: 'Product Interest',
    points: productScore.points,
    reason: productScore.reason
  });

  // 4. Company Website Score (max 10 points)
  const websiteScore = scoreCompanyWebsite(lead.companyWebsite);
  total += websiteScore.points;
  breakdown.push({
    category: 'Company Presence',
    points: websiteScore.points,
    reason: websiteScore.reason
  });

  // 5. Email Quality Score (max 10 points)
  const emailScore = scoreEmailQuality(lead.email, lead.companyWebsite);
  total += emailScore.points;
  breakdown.push({
    category: 'Email Quality',
    points: emailScore.points,
    reason: emailScore.reason
  });

  // 6. Message Quality Score (max 10 points)
  const messageScore = scoreMessage(lead.message);
  total += messageScore.points;
  breakdown.push({
    category: 'Engagement Level',
    points: messageScore.points,
    reason: messageScore.reason
  });

  // 7. Industry Score (max 5 points) - if available
  if (lead.companyIndustry) {
    const industryScore = scoreIndustry(lead.companyIndustry);
    total += industryScore.points;
    breakdown.push({
      category: 'Industry Fit',
      points: industryScore.points,
      reason: industryScore.reason
    });
  }

  // Determine grade
  const grade = getGrade(total);

  return {
    total: Math.min(100, total),
    grade,
    breakdown
  };
}

function scoreCountry(country: string): { points: number; reason: string } {
  const code = country.toUpperCase();

  if (TIER_1_COUNTRIES.includes(code)) {
    return { points: 20, reason: 'Tier 1 market with high purchasing power' };
  }
  if (TIER_2_COUNTRIES.includes(code)) {
    return { points: 15, reason: 'Growing market with good potential' };
  }
  return { points: 8, reason: 'Emerging market' };
}

function scoreJobTitle(title: string): { points: number; reason: string } {
  const lowerTitle = title.toLowerCase();

  if (C_LEVEL_TITLES.some(t => lowerTitle.includes(t))) {
    return { points: 25, reason: 'C-level executive or owner' };
  }
  if (DIRECTOR_TITLES.some(t => lowerTitle.includes(t))) {
    return { points: 20, reason: 'Director/VP level decision maker' };
  }
  if (MANAGER_TITLES.some(t => lowerTitle.includes(t))) {
    return { points: 12, reason: 'Manager level - may influence decisions' };
  }
  return { points: 5, reason: 'Entry level or unspecified role' };
}

function scoreProductInterest(products: string[]): { points: number; reason: string } {
  if (!products || products.length === 0) {
    return { points: 3, reason: 'No specific product interest' };
  }

  const hasHighValue = products.some(p =>
    HIGH_VALUE_PRODUCTS.some(hv => p.toLowerCase().includes(hv.toLowerCase()))
  );
  const hasMedicalDevice = products.some(p =>
    MEDICAL_DEVICES.some(md => p.toLowerCase().includes(md.toLowerCase()))
  );
  const multipleProducts = products.length >= 2;

  if (hasHighValue && multipleProducts) {
    return { points: 20, reason: 'Multiple high-value product interests' };
  }
  if (hasHighValue || hasMedicalDevice) {
    return { points: 15, reason: 'Interest in medical devices' };
  }
  if (multipleProducts) {
    return { points: 12, reason: 'Interest in multiple products' };
  }
  return { points: 8, reason: 'Single product interest' };
}

function scoreCompanyWebsite(website?: string): { points: number; reason: string } {
  if (!website) {
    return { points: 2, reason: 'No website provided' };
  }

  // Check for professional domain indicators
  const domain = website.toLowerCase();
  if (domain.includes('.gov') || domain.includes('.edu')) {
    return { points: 10, reason: 'Government or educational institution' };
  }
  if (domain.includes('clinic') || domain.includes('medical') || domain.includes('derma') ||
      domain.includes('spa') || domain.includes('beauty') || domain.includes('aesthetic')) {
    return { points: 10, reason: 'Industry-relevant business website' };
  }
  return { points: 6, reason: 'Has company website' };
}

function scoreEmailQuality(email: string, website?: string): { points: number; reason: string } {
  const emailDomain = email.split('@')[1]?.toLowerCase() || '';

  // Check if email matches website domain
  if (website) {
    const websiteDomain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    if (emailDomain === websiteDomain || emailDomain.includes(websiteDomain.split('.')[0])) {
      return { points: 10, reason: 'Email matches company domain' };
    }
  }

  // Check for professional domain
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  if (!personalDomains.includes(emailDomain)) {
    return { points: 8, reason: 'Business email domain' };
  }

  return { points: 3, reason: 'Personal email domain' };
}

function scoreMessage(message?: string): { points: number; reason: string } {
  if (!message || message.trim().length === 0) {
    return { points: 3, reason: 'No message provided' };
  }

  const length = message.trim().length;
  const words = message.trim().split(/\s+/).length;

  // Check for engagement signals
  const hasQuestions = message.includes('?');
  const mentionsDistributor = /distributor|distribution|partner/i.test(message);
  const mentionsPricing = /price|pricing|cost|quote|investment/i.test(message);
  const mentionsTimeline = /when|timeline|urgent|asap|soon/i.test(message);

  let points = 3;
  let reasons: string[] = [];

  if (length > 100) { points += 2; reasons.push('detailed message'); }
  if (hasQuestions) { points += 2; reasons.push('asks questions'); }
  if (mentionsDistributor) { points += 2; reasons.push('interested in distribution'); }
  if (mentionsPricing) { points += 1; reasons.push('inquiring about pricing'); }
  if (mentionsTimeline) { points += 1; reasons.push('time-sensitive'); }

  return {
    points: Math.min(10, points),
    reason: reasons.length > 0 ? `Engaged: ${reasons.join(', ')}` : 'Basic message provided'
  };
}

function scoreIndustry(industry: string): { points: number; reason: string } {
  const lowerIndustry = industry.toLowerCase();

  if (TARGET_INDUSTRIES.some(t => lowerIndustry.includes(t))) {
    return { points: 5, reason: 'Target industry match' };
  }
  return { points: 2, reason: 'Non-target industry' };
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 75) return 'A';
  if (score >= 55) return 'B';
  if (score >= 35) return 'C';
  return 'D';
}

// Export grade descriptions for UI
export const GRADE_DESCRIPTIONS = {
  A: 'Hot Lead - High priority, immediate follow-up recommended',
  B: 'Warm Lead - Good potential, follow up within 24-48 hours',
  C: 'Cool Lead - Needs nurturing, add to email sequence',
  D: 'Cold Lead - Low priority, monitor for future activity'
};
