import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Robustly calls Gemini with fallback logic in the order specified by the user.
 */
async function callGeminiWithFallback(prompt: string) {
  const models = [
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash-lite',
    'gemini-3-flash-preview'
  ];
  
  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`Attempting extraction with model: ${modelName}`);
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
      continue;
    }
  }

  throw lastError || new Error('All configured Gemini models failed to respond.');
}

export async function POST(req: NextRequest) {
  try {
    const { role, location, level } = await req.json();

    if (!role) {
      return NextResponse.json({ error: 'Job role is required' }, { status: 400 });
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json({ error: 'FIRECRAWL_API_KEY is not configured.' }, { status: 500 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

    // Build search URL for Remotive
    const searchQuery = encodeURIComponent(role.trim());
    const searchUrl = `https://remotive.com/remote-jobs/software-dev?search=${searchQuery}`;

    // Step 1: Scrape the job board page
    const scrapeResult = await firecrawl.scrapeUrl(searchUrl, {
      formats: ['markdown'],
    });

    if (!scrapeResult.success) {
      throw new Error(`Scrape failed: ${scrapeResult.error || 'Unknown error'}`);
    }

    const markdown = scrapeResult.markdown || '';

    if (markdown.length < 200) {
      return NextResponse.json({ jobs: [], message: 'No job listings found for this search.' });
    }

    // Step 2: Use Gemini with Fallback Logic
    const prompt = `Extract job listings from the following webpage content. 
    
The user is searching for: "${role}" jobs${location ? ` in ${location}` : ''}${level && level !== 'Any' ? ` at ${level} level` : ''}.

From the content below, extract up to 10 job postings and return them as a JSON object with a "jobs" array. Each job should have these fields:
- "company": company name (string)
- "role": job title (string)  
- "location": location or "Remote" if not specified (string)
- "link": URL to the job posting on remotive.com (string).

Return ONLY valid JSON. No markdown, no code fences, no explanations.
If no relevant jobs are found, return {"jobs": []}.

Webpage content:
${markdown.substring(0, 15000)}`;

    const responseText = await callGeminiWithFallback(prompt);

    // Clean and parse
    const cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch {
          console.error('Failed to parse Gemini response for jobs');
          return NextResponse.json({ jobs: [] });
        }
      } else {
        return NextResponse.json({ jobs: [] });
      }
    }

    const jobs = Array.isArray(parsedData.jobs) ? parsedData.jobs : [];

    return NextResponse.json({ jobs: jobs.slice(0, 15) });

  } catch (error: any) {
    console.error('Job Search Error:', error);

    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return NextResponse.json({ error: 'All Gemini models reached their rate limits. Please wait a minute.' }, { status: 429 });
    }

    return NextResponse.json({ error: 'Failed to find jobs.', details: error.message }, { status: 500 });
  }
}
