import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";

const defaultConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

const jsonConfig: GenerationConfig = {
  temperature: 0.3,
  topP: 0.9,
  topK: 20,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
}

export function getGeminiModel(useJsonMode = false) {
  return getClient().getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: useJsonMode ? jsonConfig : defaultConfig,
  });
}

export function extractJSON(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) return arrMatch[0];
  return text.trim();
}

export async function generateJSON<T>(prompt: string, retries = 3): Promise<T> {
  const model = getGeminiModel(true);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = extractJSON(text);
      return JSON.parse(jsonStr) as T;
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw new Error(
    `Gemini generation failed after ${retries} attempts: ${lastError?.message}`
  );
}

export async function generateText(prompt: string): Promise<string> {
  const model = getGeminiModel(false);
  const result = await model.generateContent(prompt);
  return result.response.text();
}
