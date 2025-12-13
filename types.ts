
export interface ScenarioResponse {
  content: string;
}

export enum ModelType {
  FLASH = 'gemini-1.5-flash',
  PRO = 'gemini-1.5-pro'
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  result: string | null; // This will now hold a JSON string
}

export interface Character {
  id: string;
  name: string;
  faName: string;
  desc: string;
  promptName: string; // The name used in image prompts (e.g., 'baby' instead of 'Fesgheli')
  isActive: boolean;
  imageBase64?: string | null; // To store the base64 of the uploaded image
}

export interface ScenarioSettings {
  sequenceCount: number;
  videosPerSequence: number;
  characters: Character[];
}

// Interfaces for the JSON structure returned by Gemini
export interface VideoPrompt {
  id: number;
  description: string;
  prompt: string;
  imageBase64?: string | null;
  isGenerating?: boolean;
  videoUrl?: string | null;
  isGeneratingVideo?: boolean;
}

export interface Sequence {
  id: number;
  title: string;
  summary: string; // 2-line summary of the sequence
  camera_angle: string;
  camera_movement: string;
  // This is the core action description without characters listed, used for reconstructing prompts
  action_base: string; 
  active_character_ids: string[]; // List of character IDs present in this sequence
  image_prompt: string;
  background_prompt: string; // Specific background for this sequence
  video_prompts: VideoPrompt[];
  transition: string;
}

export interface ScriptData {
  episode_title: string;
  summary: string; // New summary field
  location: string;
  sequences: Sequence[];
  instagram: {
    title: string;
    caption: string;
    hashtags: string[];
  };
}

// Payload sent to AI for updates
export interface SequenceUpdatePayload {
  id: number;
  action_base: string;
  active_character_ids: string[];
  target_video_count: number;
}

// Response structure for the update operation
export interface UpdatedSequenceData {
  id: number;
  active_character_ids: string[]; // Return this to confirm what was used (especially for random selection)
  image_prompt: string;
  video_prompts: VideoPrompt[];
}