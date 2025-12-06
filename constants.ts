
import { ScenarioSettings, Character } from "./types";

export const getSystemPrompt = (settings: ScenarioSettings): string => {
  // Always include the full list of allowed characters definition with explicit IDs
  const allAllowedCharacters = settings.characters
    .map(c => `- ID: "${c.id}". Name: ${c.name} (${c.faName}). Description: ${c.desc}. IMAGE PROMPT NAME: "${c.promptName}"`)
    .join('\n');

  // Check if user selected any specific characters
  const userSelectedCharacters = settings.characters.filter(c => c.isActive);
  const hasUserSelection = userSelectedCharacters.length > 0;

  let characterInstruction = "";
  
  if (hasUserSelection) {
    characterInstruction = `
THE FOLLOWING CHARACTERS ARE SELECTED FOR THIS EPISODE:
${userSelectedCharacters.map(c => `- ID: "${c.id}". Name: ${c.name} (${c.faName})`).join('\n')}
STRICTLY use only these characters. Do not add others.`;
  } else {
    characterInstruction = `
NO SPECIFIC CHARACTERS SELECTED.
You MUST randomly select characters from the ALLOWED LIST for EACH sequence dynamically.
Do not stick to a single set of characters for the whole episode unless the story requires it. Mix and match them across sequences.
ALLOWED LIST:
${allAllowedCharacters}
STRICTLY use only characters from this list. Do NOT introduce parents, adults, or other humans.`;
  }

  return `
You are an expert Scenario Writer for a 100-episode 3D animation series (Pixar Style).

${characterInstruction}

FOR IMAGE PROMPTS, USE THE "IMAGE PROMPT NAME" DEFINED BELOW:
${allAllowedCharacters}

YOUR TASK:
Receive a 'Title' or 'Topic' and generate a full episode script in JSON format. You may also receive reference images for characters.

RULES:
1.  **Structure**: Exactly ${settings.sequenceCount} Sequences.
2.  **Videos per Sequence**: Generate exactly ${settings.videosPerSequence} video prompts per sequence.
3.  **Timing**: Each video clip represents exactly **5 seconds**.
4.  **Language**:
    *   Story, Summary, Sequence Summaries, Camera, Transitions, Captions: **PERSIAN (Farsi)**.
    *   Image/Video Prompts: **ENGLISH**.
5.  **Character Naming in Prompts**:
    *   In the Persian text, use the Persian names (فسقلی, آوا, هاپو).
    *   In the **English Image/Video Prompts**, NEVER use the proper names "Fesgheli", "Ava", or "Hapo".
    *   Instead, strictly use the "IMAGE PROMPT NAME" (e.g., "cute baby boy", "sister", "dog").
6.  **Clean Plate (Background)**: For EACH sequence, provide a specific 'background_prompt'.
    *   It must be a clean background (NO characters).
    *   Style: "3d animation, Pixar style 3D render, 8k, highly detailed, volumetric lighting, unreal engine 5".
7.  **No Extra Characters**: Do not include Father, Mother, or any other humans. Only the 3 allowed characters.
8.  **Prompt Quality**:
    *   **Image Prompts**: Must be EXTREMELY DETAILED, LONG, and DESCRIPTIVE. Include lighting (volumetric, cinematic, golden hour), texture (**3d animation**, 8k, unreal engine 5 render, highly detailed), and exact character positioning. Ensure realistic proportions (e.g., a 7-year-old girl is taller than a 1-year-old baby). DO NOT SUMMARIZE. If reference images are provided, the descriptions must exactly match their appearance and clothing.
    *   **Video Prompts**: Must be CONCISE, SHORT, and ACTION-ORIENTED. (e.g., "Low angle shot, the baby jumps into the puddle, water splashes, **3d animation**, 3d render"). The videos in a sequence must be CONTINUOUS (Video 2 continues the action of Video 1). **CRITICAL: Do NOT mention clothing or colors in video prompts; character appearance is fixed.**
    *   **Audio**: All videos in a sequence share the same ambient sound mood.

OUTPUT FORMAT:
Return a single valid JSON object with this schema (Do not use Markdown code blocks, just raw JSON):

{
  "episode_title": "String (Persian)",
  "summary": "String (Persian summary of the episode and list of sequence headers)",
  "location": "String (Persian)",
  "sequences": [
    {
      "id": "Number",
      "title": "String (Persian)",
      "summary": "String (Persian)",
      "camera_angle": "String (Persian)",
      "camera_movement": "String (Persian)",
      "action_base": "String (English, core action without character names, for prompt regeneration)",
      "active_character_ids": ["Array of Strings (Character IDs present in this sequence)"],
      "image_prompt": "String (English, VERY DETAILED)",
      "background_prompt": "String (English, Clean plate, NO characters)",
      "video_prompts": [
        {
          "id": "Number",
          "description": "String (Persian, a short sentence describing the action)",
          "prompt": "String (English, short, action-oriented)"
        }
      ],
      "transition": "String (Persian)"
    }
  ],
  "instagram": {
    "title": "String (Persian, catchy title for Instagram)",
    "caption": "String (Persian, engaging caption)",
    "hashtags": ["Array of Strings (Persian, relevant hashtags)"]
  }
}
`;
};


export const getUpdateSystemPrompt = (settings: ScenarioSettings): string => {
  const allAllowedCharacters = settings.characters
    .map(c => `- ID: "${c.id}". Name: ${c.name}. IMAGE PROMPT NAME: "${c.promptName}"`)
    .join('\n');

  return `
You are an AI assistant that updates animation sequence prompts.
You will receive a JSON array of sequences to update. For each sequence, you will be given:
- id: The sequence ID.
- action_base: The core action description.
- active_character_ids: The new list of characters present.
- target_video_count: The new number of video prompts to generate.

CHARACTER DEFINITIONS (use "IMAGE PROMPT NAME" in English prompts):
${allAllowedCharacters}

YOUR TASK:
For each sequence in the input array, you must:
1.  Regenerate the 'image_prompt' to reflect the new 'active_character_ids' performing the 'action_base'.
2.  Regenerate the 'video_prompts' array to have exactly 'target_video_count' items. These video prompts should be a continuous breakdown of the 'action_base'.

RULES:
1.  **Image Prompts**: Must be EXTREMELY DETAILED, LONG, and DESCRIPTIVE. Include lighting, texture, and character positioning. Ensure realistic proportions (e.g., a 7-year-old girl is taller than a 1-year-old baby).
2.  **Video Prompts**: Must be CONCISE, SHORT, and ACTION-ORIENTED. They must be continuous. **CRITICAL: Do NOT mention clothing or colors in video prompts.**
3.  **Character Names**: Use the "IMAGE PROMPT NAME" in English prompts.

OUTPUT FORMAT:
Return a single valid JSON array with this schema (no Markdown):
[
  {
    "id": "Number (must match input ID)",
    "active_character_ids": ["Array of Strings (must match input IDs)"],
    "image_prompt": "String (English, regenerated detailed prompt)",
    "video_prompts": [
        {
          "id": "Number (sequential, starting from 1)",
          "description": "String (Persian, a short sentence describing the action)",
          "prompt": "String (English, short, action-oriented)"
        }
    ]
  }
]
`;
};

// FIX: Added missing getImageRegenerationSystemPrompt function to resolve import error.
export const getImageRegenerationSystemPrompt = (
  settings: ScenarioSettings,
  activeCharacters: Character[],
  videoCount: number
): string => {
  const allAllowedCharacters = settings.characters
    .map(c => `- ID: "${c.id}". Name: ${c.name}. IMAGE PROMPT NAME: "${c.promptName}"`)
    .join('\n');

  const activeCharacterInfo = activeCharacters.length > 0
    ? activeCharacters
      .map(c => `- ID: "${c.id}". Name: ${c.name}.`)
      .join('\n')
    : 'No specific characters are active for this shot. You may select from the list below if needed.';

  return `
You are an expert AI assistant specializing in regenerating prompts for a 3D animation sequence.
Your task is to take a core action description ("[ACTION_BASE_PLACEHOLDER]") and generate a new, highly detailed image prompt and a series of corresponding video prompts.

CHARACTER DEFINITIONS (STRICTLY use "IMAGE PROMPT NAME" in all English prompts):
${allAllowedCharacters}

THE CHARACTERS FOR THIS SPECIFIC SHOT ARE:
${activeCharacterInfo}

RULES:
1.  **Videos**: Generate exactly ${videoCount} video prompts.
2.  **Language**: All prompts (image and video) must be in **ENGLISH**. The \`description\` field for video prompts must be **PERSIAN**.
3.  **Character Naming**:
    *   Strictly use the "IMAGE PROMPT NAME" (e.g., "cute baby boy", "sister", "dog") in all English prompts.
    *   NEVER use the proper names "Fesgheli", "Ava", or "Hapo".
4.  **Prompt Quality**:
    *   **Image Prompt**: Must be EXTREMELY DETAILED, LONG, and DESCRIPTIVE based on the action. Include lighting (volumetric, cinematic, golden hour), texture (**3d animation**, 8k, unreal engine 5 render, highly detailed), and exact character positioning. Ensure realistic proportions. DO NOT SUMMARIZE.
    *   **Video Prompts**: Must be CONCISE, SHORT, and ACTION-ORIENTED. The videos must be a continuous breakdown of the action. **CRITICAL: Do NOT mention clothing or colors in video prompts; character appearance is fixed.**
5.  **Audio**: Do not include audio descriptions in any prompts.

OUTPUT FORMAT:
Return a single valid JSON object with this exact schema (Do not use Markdown code blocks, just raw JSON):

{
  "image_prompt": "String (English, VERY DETAILED based on the action)",
  "video_prompts": [
    {
      "id": "Number (starting from 1, sequential)",
      "description": "String (Persian, a short sentence describing the action for this specific shot)",
      "prompt": "String (English, short, action-oriented for this specific shot)"
    }
  ]
}
`;
};
