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

// Product knowledge base for context injection
const PRODUCT_KNOWLEDGE = {
  'torr-rf': {
    name: 'TORR RF (MTX-C1)',
    category: 'Medical Device',
    description: 'Multi-Wave RF System for aesthetic treatments',
    technologies: ['Auto Circular Motion (patented)', 'Real-Time Temperature Control', 'Vibro-Comfort System'],
    indications: ['Skin tightening and lifting', 'Body contouring', 'Vascular lesion treatment', 'Pain relief'],
    certifications: ['FDA 510(k) Cleared (K212561)', 'ISO 13485:2016', 'MFDS Certified'],
    handpieces: ['Large Face (body treatments)', 'Small Face (facial)', 'Micro (delicate areas)']
  },
  'ulblanc': {
    name: 'ULBLANC (i-Booster)',
    category: 'Medical Device',
    description: 'Dual-frequency ultrasound system with i-Booster technology',
    technologies: ['Dynamic Dual Wave (1MHz + 3MHz)', 'Sonophoresis i-Booster'],
    indications: ['Skin elasticity improvement', 'Product absorption enhancement', 'Facial rejuvenation'],
    certifications: ['MFDS Certified (21-4685)']
  },
  'newchae-shot': {
    name: 'NEWCHAE SHOT',
    category: 'Medical Cosmetic Device',
    description: '3-in-1 home beauty device combining RF, EMS, and ELP technologies',
    technologies: ['RF for skin tightening', 'EMS for muscle stimulation', 'ELP for product absorption'],
    benefits: ['+128% skin density improvement', '-26% pore size reduction']
  },
  'lumino-wave': {
    name: 'LUMINO WAVE (LSR-10)',
    category: 'Medical Device',
    description: 'Convergence device combining ultrasound and laser technologies',
    status: 'Coming Soon (H2 2026)',
    certifications: ['KC EMC Registered', 'MFDS Under Review']
  }
};

const COMPANY_INFO = {
  name: 'BRITZMEDI Co., Ltd.',
  established: 'October 23, 2017',
  ceo: 'Shin Jae Lee',
  location: 'Seongnam-si, Gyeonggi-do, South Korea',
  certifications: ['FDA 510(k) Cleared', 'ISO 13485:2016', 'GMP Certified', 'MFDS Licensed'],
  patents: '11 registered (10 domestic, 1 international)',
  contact: {
    email: 'contact@britzmedi.co.kr',
    phone: '+82-70-4348-7244'
  }
};

function buildSystemPrompt(context?: { product?: string; page?: string }): string {
  let systemPrompt = `You are a helpful sales assistant for BRITZMEDI, a Korean medical device manufacturer specializing in aesthetic medical devices. You provide friendly, professional, and accurate information about products and services.

## Company Information
- Name: ${COMPANY_INFO.name}
- Established: ${COMPANY_INFO.established}
- CEO: ${COMPANY_INFO.ceo}
- Location: ${COMPANY_INFO.location}
- Certifications: ${COMPANY_INFO.certifications.join(', ')}
- Patents: ${COMPANY_INFO.patents}
- Contact: ${COMPANY_INFO.contact.email} / ${COMPANY_INFO.contact.phone}

## Product Portfolio
`;

  // Add all products to the context
  for (const [id, product] of Object.entries(PRODUCT_KNOWLEDGE)) {
    systemPrompt += `
### ${product.name}
- Category: ${product.category}
- Description: ${product.description}
${product.technologies ? `- Technologies: ${product.technologies.join(', ')}` : ''}
${(product as any).indications ? `- Indications: ${(product as any).indications.join(', ')}` : ''}
${(product as any).certifications ? `- Certifications: ${(product as any).certifications.join(', ')}` : ''}
${(product as any).status ? `- Status: ${(product as any).status}` : ''}
`;
  }

  // Add context-specific information
  if (context?.product && PRODUCT_KNOWLEDGE[context.product as keyof typeof PRODUCT_KNOWLEDGE]) {
    const product = PRODUCT_KNOWLEDGE[context.product as keyof typeof PRODUCT_KNOWLEDGE];
    systemPrompt += `

## Current Context
The user is currently viewing the ${product.name} product page. Focus on providing detailed information about this product while being ready to discuss other products if asked.`;
  }

  systemPrompt += `

## Guidelines
1. Be helpful, professional, and friendly
2. Provide accurate product information based on the knowledge above
3. For pricing or distribution inquiries, guide users to the contact form
4. For technical questions beyond the provided information, suggest contacting the sales team
5. Never make claims about clinical outcomes that aren't supported by the product data
6. If asked about competitors, focus on BRITZMEDI's strengths without disparaging others
7. Encourage users to visit the Contact page for partnership or purchase inquiries
8. Keep responses concise (2-4 sentences for simple questions, longer for detailed inquiries)
9. Use markdown formatting for better readability when listing features or specifications`;

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
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
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
