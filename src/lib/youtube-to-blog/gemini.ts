// Gemini API integration for translation, doctor research, and image generation

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

/**
 * Call Gemini API with a text prompt
 */
async function callGemini(apiKey: string, prompt: string, model = 'gemini-2.0-flash'): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data: GeminiResponse = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini returned no text');
  }

  return text;
}

/**
 * Translate transcript to English using Gemini
 */
export async function translateTranscript(apiKey: string, text: string, sourceLang: string): Promise<string> {
  if (sourceLang === 'en') return text;

  // Truncate very long transcripts to fit within token limits
  const maxChars = 15000;
  const truncated = text.length > maxChars ? text.slice(0, maxChars) + '\n[... transcript truncated for translation]' : text;

  const prompt = `Translate the following YouTube video transcript to English.
Maintain the original meaning and technical terms.
Clean up any speech disfluencies (ums, ahs, repeated words).
Output ONLY the translated text, no commentary.

CRITICAL TRANSLATION RULES FOR KOREAN NAMES:

1. KOREAN PERSON NAMES: NEVER translate Korean names phonetically or by meaning. Korean names must be ROMANIZED using standard Korean romanization rules.
   - 서의석 → "Seo Eui-seok" (NOT "Yui Saksayo" or any other phonetic guess)
   - 김민수 → "Kim Min-su" (NOT "Minsoo Kim" unless that's their known English name)
   - 박지영 → "Park Ji-yeong"

2. NAME FORMAT: Family name first: "Seo Eui-seok" or Western order: "Eui-seok Seo"
   - Family name (성): First character, capitalize: Kim, Lee, Park, Choi, Seo, etc.
   - Given name (이름): Remaining characters, hyphenated, first letter cap: Eui-seok, Min-su, Ji-yeong

3. KOREAN TITLES: Romanize properly:
   - 원장/원장님 → "Director" (clinic director)
   - 교수/교수님 → "Professor"
   - 전문의 → "Board-certified specialist"
   - 피부과 전문의 → "Board-certified dermatologist"
   - 성형외과 전문의 → "Board-certified plastic surgeon"

4. HOSPITAL/CLINIC NAMES: Keep the Korean romanization + English description:
   - "서울피부과" → "Seoul Dermatology Clinic (서울피부과)"
   - "강남성형외과" → "Gangnam Plastic Surgery Clinic (강남성형외과)"

5. PRESERVE ORIGINAL: Always include the Korean name in parentheses on first mention:
   - "Dr. Seo Eui-seok (서의석)"

6. COMMON FAMILY NAME ROMANIZATIONS (use these, not phonetic guesses):
   김=Kim, 이=Lee, 박=Park, 최=Choi, 정=Jung/Jeong, 강=Kang, 조=Cho,
   윤=Yoon, 장=Jang, 임=Lim, 한=Han, 오=Oh, 서=Seo, 신=Shin, 권=Kwon,
   황=Hwang, 안=Ahn, 송=Song, 류=Ryu, 유=Yoo, 전=Jeon, 홍=Hong, 고=Ko,
   문=Moon, 배=Bae, 백=Baek, 허=Heo, 노=Noh

Source language: ${sourceLang}

Transcript:
${truncated}`;

  return await callGemini(apiKey, prompt);
}

export interface DoctorResearchResult {
  name: string;
  title: string;
  credentials: string;
  bio: string;
  profileImageUrl?: string;
  verified: boolean;
  verifiedSource: string;
}

/**
 * Extract doctor name from subtitle/title/description using "Dr." pattern
 */
function extractDrNameFromText(text: string): string | null {
  // Match "Dr." followed by a name (2-4 words, capitalized)
  const patterns = [
    /Dr\.\s+([A-Z][a-z]+(?:[- ][A-Z][a-z]+){0,3})/g,
    /Doctor\s+([A-Z][a-z]+(?:[- ][A-Z][a-z]+){0,3})/g,
  ];
  const names: string[] = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      // Skip generic words that follow "Dr." but aren't names
      if (!['The', 'This', 'That', 'Who', 'Kim', 'Lee', 'Park'].includes(name) || name.split(' ').length > 1) {
        names.push(`Dr. ${name}`);
      }
    }
  }
  // Return most frequently mentioned name
  if (names.length === 0) return null;
  const freq = new Map<string, number>();
  for (const n of names) freq.set(n, (freq.get(n) || 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Research doctor/expert info mentioned in the video
 * Priority: 1) subtitle "Dr." pattern 2) title/description English name 3) AI inference (unverified)
 */
export async function researchDoctor(
  apiKey: string,
  transcript: string,
  videoTitle: string,
  videoDescription?: string
): Promise<DoctorResearchResult | null> {
  // Step 1: Try to extract "Dr." name from subtitle text first
  const subtitleName = extractDrNameFromText(transcript);

  // Step 2: Try title and description
  const titleDescName = extractDrNameFromText(
    `${videoTitle} ${videoDescription || ''}`
  );

  // Determine if we have a directly-extracted name
  const directName = subtitleName || titleDescName;
  const nameSource = subtitleName ? 'subtitle' : titleDescName ? 'title/description' : null;

  const prompt = `Analyze this YouTube video transcript and identify if a specific doctor or medical professional is featured.

Video title: ${videoTitle}
${videoDescription ? `Video description: ${videoDescription.slice(0, 500)}` : ''}
${directName ? `\nA name was detected in the video text: "${directName}". Verify and use this name if it matches the featured professional.` : ''}

Transcript (first 3000 chars):
${transcript.slice(0, 3000)}

If a doctor/medical professional is clearly identified, respond ONLY with a JSON object:
{
  "name": "Dr. Full Name (in English)",
  "name_ko": "Korean name if applicable, or null",
  "title": "Their medical specialty (e.g., Dermatologist, Plastic Surgeon, Aesthetic Medicine Specialist)",
  "credentials": "Their credentials (e.g., MD, FAAD, Board Certified Dermatologist)",
  "bio": "A brief 2-3 sentence professional bio based on information from the video",
  "profileImageUrl": "URL to their public profile photo if findable, or null",
  "nameConfidence": "high" or "medium" or "low"
}

IMPORTANT rules:
- "name": MUST start with "Dr." prefix. Use the CORRECT English spelling of the name.
  - For Korean names: use the doctor's KNOWN English name if available (from publications, hospital website, conference proceedings).
  - If no known English spelling exists, use standard Korean romanization (e.g., Kim, Lee, Park for surnames).
  - NEVER guess or approximate Korean name romanization - if unsure, set nameConfidence to "low".
- "title": MUST be their medical specialty or clinical role. Do NOT use administrative titles like "Director", "CEO", "Chairman".
- "nameConfidence":
  - "high": name was explicitly shown/spoken in English in the video, or is well-known
  - "medium": name was extracted from Korean with reasonable confidence
  - "low": name is AI's best guess, may be inaccurate

If no specific doctor is identified, respond with: null

Response:`;

  try {
    const result = await callGemini(apiKey, prompt);
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    if (cleaned === 'null' || cleaned === '') return null;

    const parsed = JSON.parse(cleaned);
    const confidence = parsed.nameConfidence || 'low';

    // Determine verified status:
    // - "high" confidence from AI + direct name match = verified
    // - Direct extraction from subtitle = verified
    // - Otherwise = unverified
    let verified = false;
    let verifiedSource = 'ai-inference';

    if (directName && parsed.name === directName) {
      verified = true;
      verifiedSource = nameSource!;
    } else if (confidence === 'high') {
      verified = true;
      verifiedSource = 'ai-high-confidence';
    } else if (directName) {
      // We had a direct extraction but AI gave a different name
      // Trust the AI's name but mark as unverified
      verified = false;
      verifiedSource = 'ai-inference';
    }

    return {
      name: parsed.name,
      title: parsed.title,
      credentials: parsed.credentials,
      bio: parsed.bio,
      profileImageUrl: parsed.profileImageUrl || undefined,
      verified,
      verifiedSource,
    };
  } catch {
    // If AI fails but we have a direct name, return minimal info
    if (directName) {
      return {
        name: directName,
        title: 'Medical Professional',
        credentials: 'MD',
        bio: '',
        verified: true,
        verifiedSource: nameSource!,
      };
    }
    return null;
  }
}

/**
 * Generate a blog post image prompt based on content
 */
export async function generateImagePrompt(apiKey: string, title: string, excerpt: string): Promise<string> {
  const prompt = `Create a concise image generation prompt for a medical/aesthetic blog post.

Blog title: ${title}
Excerpt: ${excerpt}

Requirements:
- Professional medical/aesthetic theme
- Clean, modern style suitable for a medical device company blog
- No text in the image
- 1200x800 aspect ratio
- Photorealistic style

Respond with ONLY the image generation prompt (1-2 sentences), nothing else.`;

  return await callGemini(apiKey, prompt);
}

export interface ContentImageSpec {
  sectionHeading: string;
  imagePrompt: string;
  altText: string;
  caption: string;
}

/**
 * Analyze blog HTML and generate image prompts for the 2 most visual H2 sections
 */
export async function generateContentImagePrompts(
  apiKey: string,
  htmlContent: string,
  title: string
): Promise<ContentImageSpec[]> {
  // Extract H2 headings from HTML
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const headings: string[] = [];
  let match;
  while ((match = h2Regex.exec(htmlContent)) !== null) {
    headings.push(match[1].replace(/<[^>]*>/g, '').trim());
  }

  if (headings.length < 2) return [];

  const prompt = `You are an image director for a professional medical/aesthetic blog.

Blog title: ${title}

H2 sections in the article:
${headings.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Pick the 2 most visually interesting sections that would benefit from an illustrative image.
For each, provide:
- sectionHeading: the exact H2 text (copy exactly from the list above)
- imagePrompt: a concise Imagen prompt (1-2 sentences) for a professional medical photo. No text overlays, clean modern style, photorealistic.
- altText: a descriptive alt text for AEO/SEO (10-20 words)
- caption: a short figure caption (5-10 words)

Respond ONLY with a JSON array of 2 objects. No markdown, no commentary.
Example:
[
  {"sectionHeading":"...","imagePrompt":"...","altText":"...","caption":"..."},
  {"sectionHeading":"...","imagePrompt":"...","altText":"...","caption":"..."}
]`;

  try {
    const result = await callGemini(apiKey, prompt);
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const specs: ContentImageSpec[] = JSON.parse(cleaned);

    // Validate: keep only specs whose heading actually appears in content
    return specs.filter(s =>
      headings.some(h => h.toLowerCase() === s.sectionHeading.toLowerCase())
    ).slice(0, 2);
  } catch (err) {
    console.error('[Gemini] Content image prompts failed:', err);
    return [];
  }
}

/**
 * Generate image using Gemini's Imagen model
 */
export async function generateImage(apiKey: string, imagePrompt: string): Promise<ArrayBuffer | null> {
  // Use Gemini's image generation endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: imagePrompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '3:2',
          safetyFilterLevel: 'block_few',
        },
      }),
    });

    if (!res.ok) {
      console.error(`[Gemini Image] Failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;

    if (!imageBase64) {
      console.error('[Gemini Image] No image data returned');
      return null;
    }

    // Decode base64 to ArrayBuffer
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (err) {
    console.error('[Gemini Image] Error:', err);
    return null;
  }
}
