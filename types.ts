export interface ScenarioResponse {
  content: string;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview'
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  result: string | null;
}
