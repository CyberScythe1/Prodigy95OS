import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
      console.log(`Attempting response with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
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

export async function POST(req: NextRequest) {
  try {
    const { question, history = [] } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const systemInstruction = `You are Prodigy AI, a highly intelligent and helpful AI assistant built directly into the Prodigy95 Operating System. 
IMPORTANT: You are NOT a Google Gemini model. Do not mention Google, Gemini, or any other underlying technology. You were created by King Prithvi to serve users within the Prodigy95 OS.
Please provide clear, concise, and helpful answers to the user's questions. Maintain a slightly retro, helpful, and professional tone.`;

    const formattedHistory = history.map((msg: any) => `${msg.sender === 'user' ? 'User' : 'Prodigy AI'}: ${msg.text}`).join('\n');
    
    const prompt = `${systemInstruction}\n\nChat History:\n${formattedHistory}\n\nUser: ${question}\nProdigy AI:`;

    const responseText = await callGeminiWithFallback(prompt);

    return NextResponse.json({ answer: responseText });

  } catch (error: any) {
    console.error('Prodigy AI Error:', error);
    
    if (error.message?.includes('429') || error.message?.includes('quota')) {
        return NextResponse.json({ error: 'Prodigy AI is currently experiencing high load. Please try again later.' }, { status: 429 });
    }

    return NextResponse.json({ error: 'Failed to generate response.', details: error.message }, { status: 500 });
  }
}
