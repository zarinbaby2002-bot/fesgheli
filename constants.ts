
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
You MUST randomly select one or more characters from the ALLOWED LIST below to feature in this episode.
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
Receive a 'Title' or 'Topic' and generate a full episode script in JSON format.

RULES:
1.  **Structure**: Exactly ${settings.sequenceCount} Sequences.
2.  **Videos per Sequence**: Generate exactly ${settings.videosPerSequence} video prompts per sequence.
3.  **Timing**: Each video clip represents exactly **5 seconds**.
4.  **Language**:
    *   Story, Summary, Camera, Transitions, Captions: **PERSIAN (Farsi)**.
    *   Image/Video Prompts: **ENGLISH**.
5.  **Character Naming in Prompts**:
    *   In the Persian text, use the Persian names (فسقلی, آوا, هاپو).
    *   In the **English Image/Video Prompts**, NEVER use the proper names "Fesgheli", "Ava", or "Hapo".
    *   Instead, strictly use the "IMAGE PROMPT NAME" (e.g., "cute baby boy", "sister", "dog").
6.  **Clean Plate**: Provide a prompt for the background without characters.
7.  **No Extra Characters**: Do not include Father, Mother, or any other humans. Only the 3 allowed characters.
8.  **Prompt Quality**:
    *   **Image Prompts**: Must be EXTREMELY DETAILED, LONG, and DESCRIPTIVE. Include lighting (volumetric, cinematic, golden hour), texture (8k, unreal engine 5 render, highly detailed), and exact character positioning. DO NOT SUMMARIZE.
    *   **Video Prompts**: Must be CONCISE, SHORT, and ACTION-ORIENTED. (e.g., "Low angle shot, the baby jumps into the puddle, water splashes, 3d render"). The videos in a sequence must be CONTINUOUS (Video 2 continues the action of Video 1).
    *   **Audio**: All videos in a sequence share the same ambient sound mood.

OUTPUT FORMAT:
Return a single valid JSON object with this schema (Do not use Markdown code blocks, just raw JSON):

{
  "episode_title": "String (Persian)",
  "summary": "String (Persian summary of the episode and list of sequence headers)",
  "location": "String (Persian)",
  "background_prompt": "String (English, Clean plate, no characters)",
  "sequences": [
    {
      "id": 1,
      "title": "String (Persian)",
      "camera_angle": "String (Persian)",
      "camera_movement": "String (Persian)",
      "action_base": "String (English description of the scene action WITHOUT listing characters explicitly)",
      "active_character_ids": ["String (Must be the exact ID defined above)"],
      "image_prompt": "String (Extremely detailed English Image Prompt)",
      "video_prompts": [
        { "id": 1, "description": "Persian description", "prompt": "Concise English motion prompt (5s duration logic)" }
      ],
      "transition": "String (Persian)"
    }
  ],
  "instagram": {
    "title": "String",
    "caption": "String",
    "hashtags": ["String"]
  }
}
`;
};

export const getUpdateSystemPrompt = (settings: ScenarioSettings): string => {
  const allAllowedCharacters = settings.characters
    .map(c => `- ID: ${c.id}. Name: ${c.name}. IMAGE PROMPT NAME: "${c.promptName}"`)
    .join('\n');

  return `
You are an expert Prompt Engineer for 3D Animation (Pixar Style).

CONTEXT:
I have a list of Sequences. For each sequence, I have:
1. Changed the "Active Characters".
2. Changed the "Target Video Count".

Your task is to REWRITE the 'image_prompt' and GENERATE a new list of 'video_prompts' based on the action_base.

CHARACTER MAPPINGS:
${allAllowedCharacters}

RULES:
1. **Contextual Rewrite**: Rewrite the prompt so the action flows naturally with the new characters.
   - If 'baby' is active: "A cute baby boy splashing water..."
   - If 'baby' and 'dog' are active: "A cute baby boy and a golden retriever puppy splashing water at each other..."
2. **Image Prompt Style**: **EXTREMELY DETAILED**. Do NOT shorten the prompt. Use "Pixar style 3D render, 8k, highly detailed, volumetric lighting, unreal engine 5, octane render". Describe the scene, lighting, and textures in depth.
3. **Video Prompt Style**: CONCISE, SHORT, PRECISE. (e.g., "The dog runs left to right, 3d render style").
   - Generate exactly 'target_video_count' videos for the sequence.
   - Ensure visual continuity between videos in the sequence.
4. **No Proper Names**: Use "IMAGE PROMPT NAME", NEVER "Fesgheli".

INPUT FORMAT:
JSON List of sequences with { id, action_base, active_character_ids, target_video_count }.

OUTPUT FORMAT:
Return a strictly valid JSON Array of objects. Do NOT use Markdown.

[
  {
    "id": 1,
    "active_character_ids": ["string"],
    "image_prompt": "String (Rewritten Detailed English Image Prompt - KEEP IT LONG AND DETAILED)",
    "video_prompts": [
       { "id": 1, "description": "Persian Description", "prompt": "String (Concise English Video Prompt)" }
       ... (Generate exactly target_video_count items)
    ]
  }
]
`;
};

export const getImageRegenerationSystemPrompt = (settings: ScenarioSettings, activeCharacters: Character[]): string => {
  const charDescriptions = activeCharacters
    .map(c => `- ${c.promptName} (${c.desc})`)
    .join('\n');

  return `
You are a High-End CGI Visual Artist specialized in Prompt Engineering for Midjourney and Stable Diffusion (Pixar/Disney Style).

TASK:
Rewrite and ENHANCE the following Image Prompt for a 3D animation scene. 

CONTEXT:
Action: The scene involves the following action: [ACTION_BASE_PLACEHOLDER]
Characters present:
${charDescriptions}

RULES:
1.  **Output**: Return ONLY the raw string of the new prompt. No JSON, no quotes, no markdown.
2.  **Style**: Pixar style 3D render, Unreal Engine 5, Octane Render, 8k resolution, cinematic lighting, volumetric atmosphere.
3.  **Detail Level**: EXTREMELY HIGH. Do not summarize. Add details about lighting (soft, warm, cinematic), textures (fluffy, shiny, realistic), and composition.
4.  **Characters**: Ensure strictly the listed characters are described performing the action. Use their "Prompt Names" (e.g., cute baby boy), NOT proper names.
5.  **Length**: The prompt should be verbose and descriptive (50-100 words).

Input Prompt to Enhance: [ACTION_BASE_PLACEHOLDER]
`;
};
