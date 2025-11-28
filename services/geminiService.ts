
import { GoogleGenAI } from "@google/genai";
import { getSystemPrompt, getUpdateSystemPrompt } from '../constants';
import { ModelType, ScenarioSettings, Sequence, UpdatedSequenceData, SequenceUpdatePayload } from '../types';

export const generateScenario = async (topic: string, model: ModelType, settings: ScenarioSettings): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Write the script for this episode: ${topic}`,
      config: {
        systemInstruction: getSystemPrompt(settings),
        temperature: 0.7,
        responseMimeType: 'application/json', 
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

export const updateSequencePrompts = async (
  sequencesPayload: SequenceUpdatePayload[], 
  model: ModelType, 
  settings: ScenarioSettings
): Promise<UpdatedSequenceData[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Update these sequences based on their new active characters and video counts: ${JSON.stringify(sequencesPayload)}`,
      config: {
        systemInstruction: getUpdateSystemPrompt(settings),
        temperature: 0.7,
        responseMimeType: 'application/json', 
      },
    });

    if (response.text) {
        return JSON.parse(response.text) as UpdatedSequenceData[];
    } else {
        throw new Error("No content generated.");
    }
  } catch (error) {
    console.error("Gemini API Update Error:", error);
    throw new Error("خطا در به‌روزرسانی پرامپت‌ها.");
  }
};
