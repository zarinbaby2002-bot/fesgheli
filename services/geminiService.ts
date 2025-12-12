import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { getSystemPrompt, getUpdateSystemPrompt, getImageRegenerationSystemPrompt } from '../constants';
import { ModelType, ScenarioSettings, Sequence, UpdatedSequenceData, SequenceUpdatePayload, Character, VideoPrompt } from '../types';

export const generateScenario = async (
  topic: string, 
  additionalDetails: string, 
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

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  try {
    const response = await ai.models.generateContent({
      model: ModelType.FLASH, // Switched to FLASH to fix Quota/429 errors with PRO model
      contents: userPrompt,
      config: {
        systemInstruction: getSystemPrompt(settings),
        temperature: 0.7,
        responseMimeType: 'application/json',
        safetySettings,
      },
    });

    if (response.text) {
        return response.text;
    } else {
        // More detailed error analysis
        const finishReason = response.candidates?.[0]?.finishReason;
        const safetyRatings = response.candidates?.[0]?.safetyRatings;
        let detailedError = "پاسخی از هوش مصنوعی دریافت نشد.";
        if (finishReason === 'SAFETY') {
            detailedError = `محتوای تولید شده به دلیل مسائل ایمنی مسدود شد. جزئیات: ${JSON.stringify(safetyRatings)}`;
        } else if (finishReason) {
            detailedError = `تولید محتوا به دلیل "${finishReason}" متوقف شد.`;
        }
        console.error("No content generated. Full response:", response);
        throw new Error(detailedError);
    }
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
        // Handle Quota Exceeded specifically
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
           throw new Error("سهمیه استفاده از هوش مصنوعی (Quota) پر شده است. لطفاً کمی صبر کنید یا از کلید API دیگری استفاده نمایید.");
        }
        throw new Error(`خطا در ارتباط با هوش مصنوعی: ${error.message}`);
    }
    throw new Error("An unexpected error occurred.");
  }
};

export const updateSequencePrompts = async (
  sequencesPayload: SequenceUpdatePayload[], 
  settings: ScenarioSettings
): Promise<UpdatedSequenceData[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: ModelType.FLASH, // Hardcoded for speed
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

export const generateImage = async (prompt: string, referenceImages: { name: string; base64: string }[]): Promise<string> => {
    if (!process.env.API_KEY) {
      throw new Error("API Key is missing.");
    }
  
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const contentParts: any[] = [];
    referenceImages.forEach(img => {
        const match = img.base64.match(/^data:(image\/.*?);base64,(.*)$/);
        if (match && match[1] && match[2]) {
            contentParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
    });
    
    let finalPrompt = prompt;
    if (referenceImages.length > 0) {
        const charPromptNames = referenceImages.map(img => `"${img.name}"`).join(' and ');
        finalPrompt += `\n\n**CRITICAL, NON-NEGOTIABLE INSTRUCTION:** This is the most important rule. You MUST adhere to the provided reference images.
1. **CHARACTER APPEARANCE**: Replicate the character(s) (${charPromptNames}) with 100% accuracy.
2. **CLOTHING**: The clothing, including colors, style, and any patterns, MUST be an EXACT match to the reference image. DO NOT CHANGE THE OUTFIT.
3. **FACE & HAIR**: The facial features and hairstyle must also be an EXACT match.
Any deviation from the reference images is considered a failure. This is not a suggestion, it is a strict command.`;
    }
    contentParts.push({ text: finalPrompt });

    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const MAX_RETRIES = 3;
    let lastErrorIsQuota = false;
    let lastErrorMessage: string | undefined;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: contentParts },
                config: {
                    imageConfig: { aspectRatio: "9:16" },
                    safetySettings,
                },
            });
            
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64String = part.inlineData.data;
                    return `data:${part.inlineData.mimeType};base64,${base64String}`;
                }
            }
            throw new Error("No image data found in the response.");
        } catch (error: any) { // Use 'any' to access error properties directly
            console.error(`Gemini Image Generation Error (Attempt ${i + 1}/${MAX_RETRIES}):`, error);
            if (error?.error?.code === 429 || (error.message && error.message.includes('quota'))) {
                lastErrorIsQuota = true;
                lastErrorMessage = `شما از حد مجاز استفاده (Quota) خود فراتر رفته‌اید. لطفاً جزئیات طرح و صورت‌حساب خود را بررسی کنید.`;
            } else {
                lastErrorIsQuota = false;
                lastErrorMessage = error.message || "یک خطای ناشناخته در تولید تصویر رخ داد.";
            }

            if (i === MAX_RETRIES - 1) {
                // On the last retry, throw the accumulated specific error
                throw new Error(lastErrorMessage);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    // This line should ideally not be reached if the loop always throws on the last retry,
    // but included for type safety and as a fallback
    throw new Error(lastErrorMessage || "خطا در تولید تصویر پس از چندین تلاش.");
};

export const generateVideo = async (prompt: string, imageBase64: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
    const match = imageBase64.match(/^data:(image\/.*?);base64,(.*)$/);
    if (!match || !match[1] || !match[2]) {
        throw new Error("Invalid image data URL format.");
    }
    const mimeType = match[1];
    const base64Data = match[2];
  
    const finalPrompt = `${prompt}, with natural ambience and relevant sound effects.`;
    
    const MAX_RETRIES = 3;
    let operation;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: finalPrompt,
                image: { imageBytes: base64Data, mimeType: mimeType },
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
            });
            break; 
        } catch (error) {
            console.error(`Gemini Video Generation Start Error (Attempt ${i + 1}/${MAX_RETRIES}):`, error);
            if (i === MAX_RETRIES - 1) {
                if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('entity was not found'))) {
                    throw new Error("API Key selection is required for video generation. Please select a paid API key from your Google Cloud project.");
                }
                throw new Error("خطا در شروع فرآیند تولید ویدیو پس از چندین تلاش.");
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    if (!operation) {
        throw new Error("Failed to start video generation operation.");
    }

    try {
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });

            // Proactively check for errors within the operation object during polling
            // @ts-ignore - The error object structure might not be fully typed by the SDK
            if (operation.error) {
                // @ts-ignore
                const errorMessage = operation.error.message || 'Unknown error during video processing.';
                throw new Error(`خطا در پردازش ویدیو: ${errorMessage}`);
            }
        }
    
        // Fix: Added a type assertion to work around an incorrect type inference from the SDK.
        const downloadLink = (operation.response?.generatedVideos?.[0] as any)?.video?.uri;
    
        if (!downloadLink) {
            throw new Error("Video generation succeeded but no download link was found.");
        }
        
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) {
            const errorBody = await videoResponse.text();
            throw new Error(`Failed to download video file. Status: ${videoResponse.status}. Body: ${errorBody}`);
        }
        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);
  
    } catch (error) {
        console.error("Gemini Video Polling/Download Error:", error);
        if (error instanceof Error) {
            throw new Error(error.message); // Propagate the specific error message
        }
        throw new Error("خطا در تکمیل یا دانلود ویدیو.");
    }
};