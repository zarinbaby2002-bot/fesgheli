

import { GoogleGenAI } from "@google/genai";
import { getSystemPrompt, getUpdateSystemPrompt, getImageRegenerationSystemPrompt } from '../constants';
import { ModelType, ScenarioSettings, Sequence, UpdatedSequenceData, SequenceUpdatePayload, Character, VideoPrompt } from '../types';

export const generateScenario = async (
  topic: string, 
  additionalDetails: string, 
  model: ModelType, 
  settings: ScenarioSettings
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let userPrompt = `Write the script for this episode: ${topic}`;
  if (additionalDetails && additionalDetails.trim()) {
    userPrompt += `\n\nIMPORTANT ADDITIONAL CONTEXT/TAGS/IDEAS:\n${additionalDetails}\n\nEnsure these details are strictly incorporated into the story, the descriptions, and the English Image/Video Prompts.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
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

export const regenerateSingleImagePrompt = async (
  actionBase: string,
  activeCharacters: Character[],
  settings: ScenarioSettings,
  videoCount: number
): Promise<{ image_prompt: string, video_prompts: VideoPrompt[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Replace placeholder in system prompt or construct content
  const systemInstruction = getImageRegenerationSystemPrompt(settings, activeCharacters, videoCount)
    .replace(/\[ACTION_BASE_PLACEHOLDER\]/g, actionBase);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Fast model is sufficient for re-rolling prompts
      contents: `Generate a highly detailed, Pixar-style image prompt and corresponding video prompts for this action: ${actionBase}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.6, // Lower temperature to ensure stricter adherence to character constraints
        responseMimeType: 'application/json',
      },
    });

    if (response.text) {
        return JSON.parse(response.text);
    } else {
        throw new Error("No content generated.");
    }
  } catch (error) {
    console.error("Gemini API Image Regen Error:", error);
    throw new Error("خطا در تولید مجدد پرامپت تصویر.");
  }
};
