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

Source language: ${sourceLang}

Transcript:
${truncated}`;

  return await callGemini(apiKey, prompt);
}

/**
 * Research doctor/expert info mentioned in the video
 */
export async function researchDoctor(apiKey: string, transcript: string, videoTitle: string): Promise<{
  name: string;
  title: string;
  credentials: string;
  bio: string;
  profileImageUrl?: string;
} | null> {
  const prompt = `Analyze this YouTube video transcript and identify if a specific doctor or medical professional is featured.

Video title: ${videoTitle}

Transcript (first 3000 chars):
${transcript.slice(0, 3000)}

If a doctor/medical professional is clearly identified, respond ONLY with a JSON object:
{
  "name": "Dr. Full Name",
  "title": "Their medical specialty (e.g., Dermatologist, Plastic Surgeon, Aesthetic Medicine Specialist)",
  "credentials": "Their credentials (e.g., MD, FAAD, Board Certified Dermatologist)",
  "bio": "A brief 2-3 sentence professional bio based on information from the video",
  "profileImageUrl": "URL to their public profile photo if findable (hospital website, LinkedIn, conference profile, or null)"
}

IMPORTANT rules for fields:
- "name": MUST start with "Dr." prefix (e.g., "Dr. John Smith", NOT just "John Smith")
- "title": MUST be their medical specialty or clinical role (e.g., "Dermatologist", "Plastic Surgeon", "Aesthetic Medicine Specialist"). Do NOT use administrative titles like "Director", "Department Head", "CEO", "Chairman", "Manager", or "President".
- "credentials": List their medical degrees and certifications (e.g., "MD, PhD", "MD, FAAD", "MD, Board Certified Plastic Surgeon")

For profileImageUrl: Search for the doctor's public profile photo from their hospital/clinic website, professional directory, or academic profile. Only include if you can find a real, publicly accessible URL. Use null if not found.

If no specific doctor is identified, respond with: null

Response:`;

  try {
    const result = await callGemini(apiKey, prompt);
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    if (cleaned === 'null' || cleaned === '') return null;

    return JSON.parse(cleaned);
  } catch {
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
