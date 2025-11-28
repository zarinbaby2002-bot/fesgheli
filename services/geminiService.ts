import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { ModelType } from '../types';

export const generateScenario = async (topic: string, model: ModelType): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Write the script for this episode: ${topic}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    if (response.text) {
        return response.text;
    } else {
        throw new Error("No content generated.");
    }
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
        throw new Error(`خطا در ارتباط با هوش مصنوعی: ${error.message}`);
    }
    throw new Error("An unexpected error occurred.");
  }
};
