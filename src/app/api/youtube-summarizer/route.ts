import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import FirecrawlApp from '@mendable/firecrawl-js';
import axios from 'axios';

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
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3-flash-preview'
  ];
  
  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`Attempting summary with model: ${modelName}`);
      // Using tools for grounding to ensure accuracy even with minimal metadata
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        tools: [{ google_search: {} }] as any
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      if (text) {
        return text;
      }
    } catch (error: any) {
      console.warn(`Model ${modelName} failed or rate-limited:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All configured Gemini models failed to respond.');
}

/**
 * Attemps to get basic metadata via oEmbed (Fast & Reliable for most videos)
 */
async function getBasicMetadata(videoId: string) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { timeout: 5000 });
    return {
      title: res.data.title,
      author: res.data.author_name,
      success: true
    };
  } catch (e) {
    return { success: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL.' }, { status: 400 });
    }

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Step 1: Get Basic Metadata (Very fast, safe fallback)
    const basicMeta = await getBasicMetadata(videoId);
    
    // Step 2: Attempt Firecrawl for full description (Optional, will NOT throw on fail)
    let extendedMarkdown = '';
    if (process.env.FIRECRAWL_API_KEY) {
      try {
        const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
        const scrapeResult = await firecrawl.scrapeUrl(canonicalUrl, {
          formats: ['markdown'],
        });
        if (scrapeResult.success) {
          extendedMarkdown = scrapeResult.markdown || '';
        }
      } catch (e) {
        console.warn('Firecrawl scraping timed out or failed, falling back to basic metadata.');
      }
    }

    // Step 3: Use Gemini with Fallback Logic & Search Grounding
    // We provide whatever data we have. Gemini's Search Tool will fill the gaps.
    const videoDataInfo = `
Target URL: ${canonicalUrl}
Initial Title: ${basicMeta.title || 'Unknown Title'}
Initial Creator: ${basicMeta.author || 'Unknown'}
Page Content Preview: ${extendedMarkdown.substring(0, 3000)}
    `;

    const prompt = `Research and summarize the YouTube video at this URL: ${canonicalUrl}. 
    
Available Preliminary Data:
${videoDataInfo}

INSTRUCTION: 
1. Use Google Search to verify the actual content, title, and key insights of this specific video.
2. Produce a professional JSON summary.

JSON Format:
{
  "title": "Actual title of the video",
  "summary": "2-4 sentence summary of the video's content based on your research",
  "bullets": ["Insight 1", "Insight 2", "Insight 3", "Insight 4", "Insight 5"]
}

IMPORTANT: Only return valid JSON. Do not include markdown code fences. If you cannot find the video, provide a helpful message within the JSON summary field.`;

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
      title: parsedData.title || basicMeta.title || 'YouTube Video',
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
