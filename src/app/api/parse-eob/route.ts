import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const policySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    annualDeductible: { type: Type.NUMBER, description: 'Annual deductible amount in USD' },
    deductibleMet: { type: Type.NUMBER, description: 'Deductible amount already met in USD' },
    annualMaximum: { type: Type.NUMBER, description: 'Annual maximum coverage limit in USD' },
    maxBenefitsUsed: { type: Type.NUMBER, description: 'Annual benefits already used in USD' },
  },
  required: ['annualDeductible', 'deductibleMet', 'annualMaximum', 'maxBenefitsUsed'],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing in .env.local' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No document provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');

    // Start with the primary model, then dynamically discover any other valid Gemini models on your key
    const candidateModels: string[] = ['gemini-3.8-flash'];

    try {
      const modelsPager = await ai.models.list();
      for await (const m of modelsPager) {
        const cleanName = m.name?.replace(/^models\//, '');
        if (
            cleanName &&
            cleanName.includes('gemini') &&
            !cleanName.includes('2.5') &&
            !cleanName.includes('image') &&
            !cleanName.includes('embedding') &&
            !cleanName.includes('imagen') &&
            !cleanName.includes('veo') &&
            !candidateModels.includes(cleanName)
        ) {
          candidateModels.push(cleanName);
        }
      }
    } catch (listErr) {
      console.warn('Could not list models dynamically, using primary model with retries:', listErr);
    }

    let lastError: any = null;

    // Try primary model up to 2 times (with a 2s pause on 503), then any discovered fallback models
    const attempts = ['gemini-3.8-flash', ...candidateModels];

    for (let i = 0; i < attempts.length; i++) {
      const modelName = attempts[i];
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType: file.type || 'image/png',
                data: base64Data,
              },
            },
            {
              text: 'Extract the patient insurance policy limits from this EOB or benefits document. If a value is not explicitly listed, default to 0 for met/used amounts, 50 for deductible, and 1500 for annual maximum. Return JSON matching the schema.',
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: policySchema,
            httpOptions: { timeout: 15000 },
          },
        });

        if (response.text) {
          const parsedPolicy = JSON.parse(response.text);
          return NextResponse.json({
            success: true,
            modelUsed: modelName,
            policy: parsedPolicy,
          });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt ${i + 1} (${modelName}) failed:`, err?.status || err?.message);
        // Wait 2 seconds before retrying if the server was temporarily busy (503)
        if (err?.status === 503 || String(err?.message).includes('503')) {
          await sleep(2000);
        }
      }
    }

    throw lastError || new Error('Unable to process document right now. Please try again in a moment.');
  } catch (error: any) {
    console.error('Parse EOB Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse document with Gemini' },
      { status: 500 }
    );
  }
}