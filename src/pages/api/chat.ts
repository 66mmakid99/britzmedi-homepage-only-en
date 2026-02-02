// Claude API Chatbot Endpoint
// POST /api/chat - Send a message to the chatbot

export const prerender = false;

import type { APIRoute } from 'astro';

interface Env {
  ANTHROPIC_API_KEY?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  context?: {
    product?: string;
    page?: string;
  };
}

// Product knowledge base for context injection - Detailed product data
const PRODUCT_KNOWLEDGE = {
  'torr-rf': {
    name: 'TORR RF (MTX-C1)',
    category: 'Medical Device - Flagship Product',
    tagline: 'Innovative Multi-Wave RF Workstation',
    description: 'TORR RF is a non-invasive medical device utilizing specialized Multi-Wave Radiofrequency (RF) technology to deliver thermal energy into the dermal and subcutaneous layers. The core clinical significance lies in its ability to deliver powerful yet safe energy uniformly to the desired depth using low power, preventing surface burns while maximizing deep tissue heating.',
    technologies: [
      'Auto Circular Motion Head (Patented) - The handpiece automatically rotates at 68 rpm, creating a "Toroidal" thermal field ensuring RF energy is distributed uniformly without hot spots',
      'Real-Time Temperature Control - Integrated sensors monitor skin temperature continuously (30°C-50°C adjustable), auto-cutoff prevents burns',
      'Vibro-Comfort Mode - 3D vibration technology (10,000 times/min) mitigates heat sensation through neurological distraction (Gate Control Theory)'
    ],
    indications: [
      'Lifting & Skin Tightening - Delivers thermal energy to deep dermis for collagen remodeling',
      'Body Contouring & Cellulite - FDA-cleared for temporary reduction in cellulite appearance',
      'Vascular (Circulation) - Cleared for temporary improvement of local blood circulation',
      'Pain Management - Relief of minor muscle aches, pains, and spasms'
    ],
    specifications: {
      frequency: '1 MHz ± 10%',
      maxPower: '55W (Medium/Large), 7.5W (Small)',
      modes: 'Single / Pulse / Repeat',
      treatmentDepth: '1.5mm ~ 10mm (adjustable Low/Deep Mode)',
      temperatureControl: '30°C ~ 50°C with real-time monitoring',
      display: '10.1" TFT LCD Touch Screen',
      dimensions: '338.1mm (W) × 643mm (D) × 857.5mm (H)',
      weight: '36 kg',
      safetyClass: 'Class I, Type BF Applied Part'
    },
    handpieces: [
      'Large Handpiece (Body) - Ø50mm, 3.5-10mm depth, Auto-Circular Motion for large area contouring',
      'Small Handpiece (Face) - Ø40mm, 2.5-6mm depth, for facial tightening and cheek contouring',
      'Micro Handpiece (Eye/Delicate) - Ø20mm, 1.5-2mm depth, precision care for periorbital areas'
    ],
    certifications: ['FDA 510(k) Cleared (K212561)', 'Korea MFDS Approved (License No. 22-156)', 'ISO 13485:2016 Certified', 'GMP Certified'],
    differentiators: [
      'Auto-Motion Technology - Unlike traditional stationary applicators, rotating head ensures uniform energy distribution',
      'Lower Power, Higher Efficacy - Achieves effective heating with 55W vs competitors requiring up to 150W',
      'Non-Consumable Handpieces - Durable handpieces without expensive cartridge replacements (low running costs)'
    ],
    clinicalBenefits: ['Pain-Free treatments with Vibro-Comfort Mode', 'Uniform energy delivery preventing operator fatigue', 'Real-time safety monitoring preventing burns', 'No consumable cartridges - low running costs']
  },
  'ulblanc': {
    name: 'ULBLANC (i-Booster)',
    category: 'Medical Device',
    tagline: 'Multi-Frequency Ultrasound Workstation',
    description: 'ULBLANC is a comprehensive skincare workstation combining dual-frequency ultrasound for tightening with acoustic cavitation for transdermal drug delivery. The system allows effective treatment without damaging the skin surface.',
    technologies: [
      'Sono-I (Dynamic Dual Wave™) - Alternates between frequencies: 1/3 MHz for deep dermal tightening, 3/10 MHz for epidermal soothing',
      'i-Booster (Sonophoresis) - Uses 28kHz ultrasound to generate acoustic cavitation (micro-jet effect), opening micro-pathways for deep transdermal delivery of active ingredients'
    ],
    indications: ['Skin firming and tightening', 'Wrinkle reduction', 'Enhanced absorption of active ingredients', 'Skin soothing (suitable for ACNE/Flushing)'],
    specifications: {
      sonoIFrequency: '1/3 MHz, 3/10 MHz (dual frequency modes)',
      iBoosterFrequency: '28 kHz (for sonophoresis)'
    },
    certifications: ['Korea MFDS Certified (No. 21-4685)'],
    clinicalBenefits: ['No downtime - Pain-free, infection-free', 'Suitable for daily use', 'Versatile treatment range from soothing to lifting', 'Enhanced product absorption efficiency']
  },
  'newchae-shot': {
    name: 'NEWCHAE SHOT',
    category: 'Medical Cosmetic Device (Home-Care)',
    tagline: '3-in-1 Personal Beauty Device',
    description: 'NEWCHAE SHOT is a home-care beauty device integrating professional-grade medical technologies into a compact form factor with multi-channel energy delivery. Combining RF tightening, EMS contouring, and ELP skin boosting technologies for clinical-grade results at home.',
    technologies: [
      'RF Mode (Tightening) - Multi-Channel RF Stack technology delivers heat deep into dermis, promoting collagen regeneration',
      'EMS Mode (V-Line) - Electrical Muscle Stimulation for facial contouring and toning',
      'ELP Mode (Skin Boost) - Electroporation technology enhances absorption of skincare products',
      '3D Vibration - 10,000 times/min to assist energy penetration',
      'Automated Shot System - Concentrates energy output for precise delivery'
    ],
    clinicalResults: {
      skinDensity: '+128.48% improvement',
      poreSize: '-26.74% reduction',
      elasticity: 'Improved surface and deep elasticity',
      radiance: 'Enhanced skin radiance'
    },
    differentiators: ['Professional-grade technology in compact home device', 'Three treatment modes in one device', 'Clinical study backed results']
  },
  'lumino-wave': {
    name: 'LUMINO WAVE (LSR-10)',
    category: 'Medical Device',
    tagline: 'Next-Generation Convergence Device',
    status: 'Coming Soon - H2 2026',
    description: 'LUMINO WAVE is an advanced aesthetic device designed to maximize treatment efficacy by combining Ultrasound and Laser energies. Utilizing ultrasound-induced microbubbles to enhance the penetration depth of laser into the skin.',
    technologies: [
      'Ultrasound + Laser Convergence - Simultaneous ultrasound vibration and laser irradiation. Light scattering is minimized by ultrasound effects, allowing laser to reach deeper layers more efficiently'
    ],
    certifications: ['KC (EMC) Registered (R-R-bzm-LSR-10, April 2025)', 'Korea MFDS Under Review (Target: H2 2026)'],
    clinicalBenefits: ['Achieves therapeutic results with lower power/energy', 'Minimized skin irritation and side effects', 'Maximized lifting and regeneration effects', 'Enhanced laser penetration to dermal layers']
  }
};

const COMPANY_INFO = {
  name: 'BRITZMEDI Co., Ltd.',
  nameKo: '(주)브리츠메디',
  established: 'October 23, 2017',
  ceo: 'Shin Jae Lee',
  location: 'Hwaseong-si, Gyeonggi-do, South Korea',
  headquarters: '15, Jeongmun-Cheon-ro 48beon-gil, Hwaseong-si, Gyeonggi-do, Republic of Korea',
  businessType: 'Medical Device Manufacturer & R&D',
  philosophy: 'Technology-intensive company focused on IP-secured competitive advantages in aesthetic medical field',
  certifications: ['FDA 510(k) Cleared', 'ISO 13485:2016', 'GMP Certified', 'MFDS Licensed'],
  manufacturing: {
    license: 'No. 6296 (MFDS)',
    fdaRegistration: 'FDA Registered Contract Manufacturer',
    capabilities: ['Full-cycle manufacturing', 'OEM/ODM services', 'End-to-end product development']
  },
  intellectualProperty: {
    registeredPatents: '11+',
    domesticPatents: '10',
    internationalPatents: '1',
    trademarks: '5',
    keyPatents: ['Auto Circular Motion Technology', 'Convergence Therapy Systems']
  },
  certifications_detail: [
    'FDA 510(k) K212561 - TORR RF cleared for skin tightening, body contouring, pain relief',
    'ISO 13485:2016 - Quality Management System for Medical Devices',
    'GMP Certified - Good Manufacturing Practice',
    'MFDS Licensed - Korean Ministry of Food and Drug Safety'
  ],
  contact: {
    email: 'contact@britzmedi.co.kr',
    phone: '+82-70-4348-7244',
    website: 'www.britzmedi.com'
  },
  targetMarkets: ['Global distribution partnerships', 'OEM/ODM for international brands', 'Direct sales to clinics and aesthetic centers']
};

function buildSystemPrompt(context?: { product?: string; page?: string }): string {
  let systemPrompt = `You are a sales consultant for BRITZMEDI. You MUST follow these critical rules:

## CRITICAL RULES - READ CAREFULLY
1. **ONLY use information provided in this system prompt** - Do NOT use any prior knowledge about BRITZMEDI
2. **If information is not provided below, say "I don't have that specific information. Please contact us directly."**
3. **NEVER make up facts, numbers, or details** that are not explicitly stated below
4. **NEVER reference external sources or your training data** about BRITZMEDI
5. **All company and product information below is the ONLY source of truth**

## Your Role
- Sales consultant using ONLY the provided information below
- Professional support for distributors and clinics
- Guide users to Contact page for information not covered here

## Company Overview
**${COMPANY_INFO.name}** (${COMPANY_INFO.nameKo})
- Established: ${COMPANY_INFO.established}
- CEO: ${COMPANY_INFO.ceo}
- Headquarters: ${COMPANY_INFO.headquarters}
- Business Type: ${COMPANY_INFO.businessType}
- Philosophy: "${COMPANY_INFO.philosophy}"

### Certifications & Regulatory
${COMPANY_INFO.certifications_detail.join('\n')}

### Intellectual Property
- ${COMPANY_INFO.intellectualProperty.registeredPatents} Registered Patents (${COMPANY_INFO.intellectualProperty.domesticPatents} domestic, ${COMPANY_INFO.intellectualProperty.internationalPatents} international)
- ${COMPANY_INFO.intellectualProperty.trademarks} Trademarks
- Key Patents: ${COMPANY_INFO.intellectualProperty.keyPatents.join(', ')}

### Manufacturing Capabilities
- ${COMPANY_INFO.manufacturing.license}
- ${COMPANY_INFO.manufacturing.fdaRegistration}
- Capabilities: ${COMPANY_INFO.manufacturing.capabilities.join(', ')}

### Contact
- Email: ${COMPANY_INFO.contact.email}
- Phone: ${COMPANY_INFO.contact.phone}
- Website: ${COMPANY_INFO.contact.website}

---

## Product Portfolio (Detailed)
`;

  // Add comprehensive product information
  for (const [id, product] of Object.entries(PRODUCT_KNOWLEDGE)) {
    const p = product as any;
    systemPrompt += `
### ${p.name}
**Category:** ${p.category}
**Tagline:** ${p.tagline || 'N/A'}
${p.status ? `**Status:** ${p.status}` : ''}

**Description:**
${p.description}

**Key Technologies:**
${p.technologies ? p.technologies.map((t: string) => `• ${t}`).join('\n') : 'N/A'}

${p.indications ? `**Indications:**\n${p.indications.map((i: string) => `• ${i}`).join('\n')}` : ''}

${p.specifications ? `**Technical Specifications:**
• Frequency: ${p.specifications.frequency || p.specifications.sonoIFrequency || 'N/A'}
• Max Power: ${p.specifications.maxPower || 'N/A'}
• Treatment Depth: ${p.specifications.treatmentDepth || 'N/A'}
• Temperature Control: ${p.specifications.temperatureControl || 'N/A'}` : ''}

${p.handpieces ? `**Handpieces:**\n${p.handpieces.map((h: string) => `• ${h}`).join('\n')}` : ''}

${p.certifications ? `**Certifications:** ${p.certifications.join(', ')}` : ''}

${p.clinicalBenefits ? `**Clinical Benefits:**\n${p.clinicalBenefits.map((b: string) => `• ${b}`).join('\n')}` : ''}

${p.clinicalResults ? `**Clinical Study Results:**
• Skin Density: ${p.clinicalResults.skinDensity}
• Pore Size: ${p.clinicalResults.poreSize}` : ''}

${p.differentiators ? `**Key Differentiators:**\n${(Array.isArray(p.differentiators) ? p.differentiators : []).map((d: string) => `• ${d}`).join('\n')}` : ''}
`;
  }

  // Context-specific focus
  if (context?.product && PRODUCT_KNOWLEDGE[context.product as keyof typeof PRODUCT_KNOWLEDGE]) {
    const product = PRODUCT_KNOWLEDGE[context.product as keyof typeof PRODUCT_KNOWLEDGE];
    systemPrompt += `
---
## Current Context
The user is on the **${(product as any).name}** product page. Prioritize detailed information about this product, but be ready to compare with other products or discuss alternatives if asked.`;
  }

  systemPrompt += `

---
## Response Guidelines

### IMPORTANT: Information Boundaries
- **ONLY use data provided in this prompt** - nothing else
- **If asked about something not covered above**, say: "I don't have detailed information about that. Please contact us at contact@britzmedi.co.kr for more details."
- **NEVER guess or infer** information not explicitly provided
- **NEVER use your training data** about BRITZMEDI - it may be outdated or incorrect

### Communication Style
- Professional and helpful tone
- Provide specific details FROM THE DATA ABOVE when relevant
- Structure longer responses with clear sections

### Content Rules
1. **Strict Accuracy**: ONLY state facts explicitly written in this prompt
2. **Technical Details**: Use exact specifications provided above
3. **Unknown Information**: Direct to Contact page
4. **Pricing**: "Please contact us for pricing - it varies by region and volume"
5. **Clinical Claims**: ONLY reference indications and results stated above
6. **Comparisons**: Only use differentiators explicitly listed above

### Response Format
- Simple questions: 2-3 sentences using provided data
- Technical questions: Use exact specs from above
- Unknown topics: Politely redirect to Contact page

### Key Points (from provided data only)
- FDA 510(k) cleared K212561 (TORR RF)
- Patented Auto Circular Motion (68 rpm)
- Non-consumable handpieces
- 11+ registered patents
- OEM/ODM capable (FDA registered contract manufacturer)`;

  return systemPrompt;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as ChatRequest;

    if (!body.message || body.message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get API key from environment
    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const apiKey = env?.ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return a fallback response when API key is not configured
      return new Response(JSON.stringify({
        message: getFallbackResponse(body.message, body.context),
        fallback: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build message history
    const messages = [
      ...(body.history || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: body.message
      }
    ];

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: buildSystemPrompt(body.context),
        messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);

      // Return fallback on API error
      return new Response(JSON.stringify({
        message: getFallbackResponse(body.message, body.context),
        fallback: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const assistantMessage = data.content?.[0]?.text || 'I apologize, but I encountered an issue. Please try again.';

    return new Response(JSON.stringify({
      message: assistantMessage,
      fallback: false
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process chat request',
      message: 'I apologize for the technical difficulty. Please contact us directly at contact@britzmedi.co.kr'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Fallback responses when API is not available
function getFallbackResponse(message: string, context?: { product?: string }): string {
  const lowerMessage = message.toLowerCase();

  // Product inquiries
  if (lowerMessage.includes('torr') || lowerMessage.includes('rf')) {
    return "TORR RF (MTX-C1) is our flagship FDA 510(k) cleared Multi-Wave RF system. It features patented Auto Circular Motion technology for even energy distribution, real-time temperature control, and the Vibro-Comfort system for patient comfort. Would you like to learn more about its specifications or discuss partnership opportunities?";
  }

  if (lowerMessage.includes('ulblanc') || lowerMessage.includes('ultrasound')) {
    return "ULBLANC (i-Booster) is our dual-frequency ultrasound system featuring Dynamic Dual Wave technology (1MHz + 3MHz) and i-Booster sonophoresis for enhanced product absorption. It's MFDS certified and excellent for skin elasticity treatments. Would you like more details?";
  }

  if (lowerMessage.includes('newchae') || lowerMessage.includes('home device')) {
    return "NEWCHAE SHOT is our innovative 3-in-1 home beauty device combining RF, EMS, and ELP technologies. Clinical studies show +128% skin density improvement and -26% pore size reduction. Perfect for at-home professional skincare routines!";
  }

  if (lowerMessage.includes('lumino') || lowerMessage.includes('laser')) {
    return "LUMINO WAVE (LSR-10) is our upcoming convergence device combining ultrasound and laser technologies. It's currently under MFDS review and scheduled for release in H2 2026. Sign up for updates on our contact page!";
  }

  // Company inquiries
  if (lowerMessage.includes('fda') || lowerMessage.includes('certification') || lowerMessage.includes('certified')) {
    return "BRITZMEDI holds FDA 510(k) clearance (K212561) for TORR RF, ISO 13485:2016 certification, GMP certification, and MFDS licensing. Our products meet the highest international regulatory standards.";
  }

  if (lowerMessage.includes('distributor') || lowerMessage.includes('partnership') || lowerMessage.includes('dealer')) {
    return "We're actively seeking distribution partners worldwide! Please visit our Contact page to submit your inquiry. Include your company details, region of interest, and current portfolio. Our team will respond within 24-48 hours.";
  }

  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('quote')) {
    return "For pricing information and quotes, please contact our sales team through the Contact page. Pricing varies by region and order volume. We'll be happy to provide a customized quote based on your needs.";
  }

  // General greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! Welcome to BRITZMEDI. I'm here to help you learn about our aesthetic medical devices. What would you like to know about? We offer FDA-cleared RF devices, ultrasound systems, and innovative home beauty devices.";
  }

  // Default response
  return "Thank you for your interest in BRITZMEDI! We specialize in innovative aesthetic medical devices including TORR RF (FDA 510(k) cleared), ULBLANC ultrasound, and NEWCHAE SHOT home device. How can I help you today? For specific inquiries, please visit our Contact page.";
}
