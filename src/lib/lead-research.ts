// Automated company research via Claude API + web search
// Called asynchronously via waitUntil after lead submission

export interface CompanyResearch {
  company_overview?: {
    full_name: string;
    website_status: string;
    industry: string;
    business_type: string;
    estimated_size: string;
    year_established: string;
    location: string;
  };
  relevance_assessment?: {
    is_medical_business: boolean;
    is_aesthetic_focused: boolean;
    is_potential_distributor: boolean;
    is_existing_clinic: boolean;
    has_existing_rf_devices: string;
    competitor_devices_used: string[];
    assessment_summary: string;
  };
  market_context?: {
    country_market_size: string;
    regulatory_environment: string;
    distribution_landscape: string;
  };
  red_flags?: string[];
  recommended_action?: string;
  talking_points?: string[];
  confidence_score?: number;
  error?: string;
  raw?: string;
}

export async function researchCompany(env: any, data: {
  companyName: string;
  companyWebsite?: string;
  email: string;
  country: string;
  jobTitle?: string;
  interestedIn: string[];
}): Promise<CompanyResearch> {
  try {
    const emailDomain = data.email.split('@')[1];

    const prompt = `Research this company that submitted an inquiry to BRITZMEDI (Korean aesthetic medical device manufacturer).

Company: ${data.companyName}
Website: ${data.companyWebsite || 'Not provided'}
Email domain: ${emailDomain}
Country: ${data.country}
Contact job title: ${data.jobTitle || 'Not provided'}
Products interested in: ${data.interestedIn.join(', ')}

Search the web and provide a structured intelligence report. Return JSON only, no markdown:

{
  "company_overview": {
    "full_name": "Official company name",
    "website_status": "active|inactive|not_found",
    "industry": "aesthetic clinic|distributor|hospital|manufacturer|unknown",
    "business_type": "clinic|distributor|wholesaler|hospital_group|individual|unknown",
    "estimated_size": "small (<10)|medium (10-50)|large (50-200)|enterprise (200+)|unknown",
    "year_established": "YYYY or unknown",
    "location": "City, Country"
  },
  "relevance_assessment": {
    "is_medical_business": true,
    "is_aesthetic_focused": true,
    "is_potential_distributor": true,
    "is_existing_clinic": true,
    "has_existing_rf_devices": "yes|no|unknown",
    "competitor_devices_used": ["Device names if found"],
    "assessment_summary": "1-2 sentence assessment of this lead's potential value"
  },
  "market_context": {
    "country_market_size": "Brief note on aesthetic device market in their country",
    "regulatory_environment": "Brief note on medical device regulations in their country",
    "distribution_landscape": "Who are major distributors in their market"
  },
  "red_flags": [
    "Any concerns: fake company, mismatch between email and company, suspicious patterns"
  ],
  "recommended_action": "Priority follow-up within 24h|Standard follow-up within 3 days|Low priority — verify first|Likely spam — do not pursue",
  "talking_points": [
    "Suggested conversation starters based on research",
    "Key questions to ask this lead"
  ],
  "confidence_score": 75
}

If you cannot find information about this company, say so honestly. Do NOT fabricate company details.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const apiData: any = await response.json();
    const textContent = apiData.content
      ?.filter((b: any) => b.type === 'text')
      ?.map((b: any) => b.text)
      ?.join('\n') || '';

    // Extract JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as CompanyResearch;
    }

    return { error: 'Could not parse research results', raw: textContent };
  } catch (e: any) {
    console.error('Company research error:', e);
    return { error: e.message };
  }
}
