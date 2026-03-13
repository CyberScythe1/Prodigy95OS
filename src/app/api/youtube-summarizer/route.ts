import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import FirecrawlApp from '@mendable/firecrawl-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/**
 * Robustly calls Gemini with fallback logic in the order specified by the user.
 */
async function callGeminiWithFallback(prompt: string) {
  const models = [
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-3-flash'
  ];
  
  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`Attempting summary with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      if (text) {
        console.log(`Successfully generated content using ${modelName}`);
        return text;
      }
    } catch (error: any) {
      console.warn(`Model ${modelName} failed or rate-limited:`, error.message);
      lastError = error;
      // Move to next model for rate limits or availability issues
      continue;
    }
  }

  throw lastError || new Error('All configured Gemini models failed to respond.');
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json({ error: 'FIRECRAWL_API_KEY is not configured.' }, { status: 500 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL.' }, { status: 400 });
    }

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Step 1: Use Firecrawl to get the ACTUAL page metadata
    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    
    const scrapeResult = await firecrawl.scrapeUrl(canonicalUrl, {
      formats: ['markdown'],
    });

    if (!scrapeResult.success) {
      throw new Error(`Failed to scrape video metadata: ${scrapeResult.error}`);
    }

    const metadata = scrapeResult.metadata || {};
    const markdown = scrapeResult.markdown || '';
    
    const videoTitle = metadata.title || 'Unknown Video';
    const videoInfo = `
Title: ${videoTitle}
Creator: ${metadata.author || 'Unknown'}
Page Content Preview: ${markdown.substring(0, 3000)}
    `;

    // Step 2: Use Gemini with Fallback Logic
    const prompt = `Based on the following metadata extracted from a YouTube video page, produce a high-quality JSON summary.

VIDEO DATA:
${videoInfo}

JSON Format:
{
  "title": "Clean version of the video title",
  "summary": "2-4 sentence summary of the video's content",
  "bullets": ["Insight 1", "Insight 2", "Insight 3", "Insight 4", "Insight 5"]
}

IMPORTANT: Only return valid JSON. Do not include markdown code fences or extra text.`;

    const responseText = await callGeminiWithFallback(prompt);

    const cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         try { parsedData = JSON.parse(jsonMatch[0]); } catch { throw new Error('Failed to parse AI response'); }
      } else {
         throw new Error('No JSON found in AI response');
      }
    }

    return NextResponse.json({
      title: parsedData.title || videoTitle,
      summary: parsedData.summary || 'No summary available.',
      bullets: Array.isArray(parsedData.bullets) ? parsedData.bullets : []
    });

  } catch (error: any) {
    console.error('Summarization Error:', error);
    
    if (error.message?.includes('429') || error.message?.includes('quota')) {
        return NextResponse.json({ error: 'All Gemini models reached their rate limits. Please wait a minute.' }, { status: 429 });
    }

    return NextResponse.json({ error: 'Failed to generate summary.', details: error.message }, { status: 500 });
  }
}
