export const EXPECTED_IDEA_COUNT = 200;
export const EXPECTED_INTERESTING_PROMPT_COUNT = 10;
export const ADDITIONAL_FEATURE_COUNT = 10;
export const STATE_SCHEMA_VERSION = 1;

export type WorkshopStep = 'intro' | 'choose' | 'extend';

export interface SourceMetadata {
  pageTitle: string;
  pageUrl: string;
  extractedOn: string;
  notes: string;
}

export interface InterestingPrompt {
  title: string;
  prompt: string;
  sourceText?: string;
}

export interface PromptEntry {
  title: string;
  prompt: string;
}

export interface AppIdea {
  id: string;
  title: string;
  description: string;
  features: string[];
  constraints: string;
  starterPrompt: string;
  sourceEvolutions: string[];
  additionalFeatures: PromptEntry[];
}

export interface AppConfig {
  schemaVersion: string;
  source: SourceMetadata;
  interestingPrompts: InterestingPrompt[];
  ideas: AppIdea[];
}

export interface WorkshopState {
  schemaVersion: number;
  step: WorkshopStep;
  selectedIdeaId: string | null;
  secondActOffset: number;
  angleOffset: number;
}

export class ConfigValidationError extends Error {
  public readonly issues: string[];

  public constructor(issues: string[]) {
    super(`Workshop configuration is invalid:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
    this.name = 'ConfigValidationError';
    this.issues = issues;
  }
}

export function createInitialState(): WorkshopState {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    step: 'intro',
    selectedIdeaId: null,
    secondActOffset: 0,
    angleOffset: 0,
  };
}
