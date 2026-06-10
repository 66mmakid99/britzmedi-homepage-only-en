// Intelligent 5-axis lead scoring system for BRITZMEDI
// Score range: 0-100 (5 axes × 20 points each)

export interface ScoreAxis {
  score: number;
  max: number;
  reason: string;
}

export interface ScoreBreakdown {
  email_quality: ScoreAxis;
  company_info: ScoreAxis;
  product_interest: ScoreAxis;
  engagement_signals: ScoreAxis;
  market_fit: ScoreAxis;
  total: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

export function scoreLead(data: {
  email: string;
  companyName: string;
  companyWebsite?: string;
  jobTitle?: string;
  country: string;
  interestedIn: string[];
  message?: string;
  source?: string;
  isFreeEmail: boolean;
  companyResearch?: any;
}): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    email_quality: { score: 0, max: 20, reason: '' },
    company_info: { score: 0, max: 20, reason: '' },
    product_interest: { score: 0, max: 20, reason: '' },
    engagement_signals: { score: 0, max: 20, reason: '' },
    market_fit: { score: 0, max: 20, reason: '' },
    total: 0,
    grade: 'C',
  };

  // === 1. Email Quality (20 pts) ===
  if (data.isFreeEmail) {
    breakdown.email_quality = { score: 5, max: 20, reason: `Free email (${data.email.split('@')[1]}) — low trust signal` };
  } else {
    const domain = data.email.split('@')[1];
    const websiteDomain = data.companyWebsite?.replace(/https?:\/\//, '').replace(/www\./, '').split('/')[0];
    if (websiteDomain && domain?.includes(websiteDomain.split('.')[0])) {
      breakdown.email_quality = { score: 20, max: 20, reason: 'Company email matching website domain' };
    } else {
      breakdown.email_quality = { score: 15, max: 20, reason: `Company email (${domain})` };
    }
  }

  // === 2. Company Info Completeness (20 pts) ===
  let companyScore = 0;
  const companyReasons: string[] = [];

  if (data.companyName && data.companyName.length > 2) {
    companyScore += 5;
    companyReasons.push('Company name provided');
  }
  if (data.companyWebsite && data.companyWebsite.includes('.')) {
    companyScore += 5;
    companyReasons.push('Website provided');
  }
  if (data.jobTitle && data.jobTitle.length > 1) {
    companyScore += 5;
    companyReasons.push('Job title provided');
    const decisionMaker = /ceo|cto|coo|cfo|director|president|owner|founder|vp|vice president|general manager|head of|chief/i;
    if (decisionMaker.test(data.jobTitle)) {
      companyScore += 5;
      companyReasons.push('Decision-maker role');
    }
  }
  breakdown.company_info = { score: Math.min(companyScore, 20), max: 20, reason: companyReasons.join(', ') };

  // === 3. Product Interest (20 pts) ===
  let productScore = 0;
  const productReasons: string[] = [];

  if (data.interestedIn.length > 0) {
    productScore += 5;
    productReasons.push(`${data.interestedIn.length} product(s) selected`);
  }
  if (data.interestedIn.some(p => /torr/i.test(p))) {
    productScore += 5;
    productReasons.push('Interested in flagship TORR RF');
  }
  if (data.interestedIn.some(p => /distribution|partner/i.test(p))) {
    productScore += 5;
    productReasons.push('Distribution/Partnership interest');
  }
  breakdown.product_interest = { score: Math.min(productScore, 20), max: 20, reason: productReasons.join(', ') };

  // === 4. Engagement Signals (20 pts) ===
  let engagementScore = 0;
  const engagementReasons: string[] = [];

  if (data.message && data.message.length > 50) {
    engagementScore += 10;
    engagementReasons.push('Detailed message provided');
  } else if (data.message && data.message.length > 10) {
    engagementScore += 5;
    engagementReasons.push('Brief message provided');
  }
  if (data.source && data.source !== 'unknown') {
    engagementScore += 5;
    engagementReasons.push(`Source: ${data.source}`);
  }
  breakdown.engagement_signals = { score: Math.min(engagementScore, 20), max: 20, reason: engagementReasons.join(', ') || 'No additional signals' };

  // === 5. Market Fit (20 pts) ===
  let marketScore = 0;
  const marketReasons: string[] = [];

  const tierOne = ['US', 'DE', 'GB', 'FR', 'JP', 'AU', 'CA', 'IT', 'ES', 'NL', 'SE', 'CH', 'AT', 'AE', 'SA', 'KW', 'QA'];
  const tierTwo = ['TH', 'VN', 'ID', 'MY', 'PH', 'SG', 'IN', 'BR', 'MX', 'TR', 'PL', 'CZ', 'RO', 'HU', 'EG', 'ZA', 'NG'];
  const tierThree = ['KR', 'CN'];

  const country = data.country?.toUpperCase();
  if (tierOne.includes(country)) {
    marketScore += 15;
    marketReasons.push(`Tier 1 market (${country})`);
  } else if (tierTwo.includes(country)) {
    marketScore += 10;
    marketReasons.push(`Tier 2 market (${country})`);
  } else if (tierThree.includes(country)) {
    marketScore += 3;
    marketReasons.push(`Domestic/China market (${country}) — use separate channel`);
  } else {
    marketScore += 7;
    marketReasons.push(`Other market (${country})`);
  }

  // Company research bonus
  if (data.companyResearch) {
    const research = data.companyResearch;
    if (research.relevance_assessment?.is_medical_business) {
      marketScore += 5;
      marketReasons.push('Confirmed medical/aesthetic business');
    }
  }

  breakdown.market_fit = { score: Math.min(marketScore, 20), max: 20, reason: marketReasons.join(', ') };

  // === Total + Grade ===
  breakdown.total = breakdown.email_quality.score + breakdown.company_info.score +
    breakdown.product_interest.score + breakdown.engagement_signals.score + breakdown.market_fit.score;

  if (breakdown.total >= 80) breakdown.grade = 'A';
  else if (breakdown.total >= 60) breakdown.grade = 'B';
  else if (breakdown.total >= 40) breakdown.grade = 'C';
  else breakdown.grade = 'D';

  return breakdown;
}
